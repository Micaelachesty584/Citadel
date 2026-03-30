#!/usr/bin/env node

/**
 * external-action-gate.js — PreToolUse hook (Bash)
 *
 * Uses the First-Encounter Consent pattern to handle external actions.
 *
 * On first encounter: informs the user what's about to happen and offers
 * three choices for how to handle external actions going forward:
 *   - "always-ask"    — Block every external action, require approval each time
 *   - "session-allow" — Allow for this session, ask fresh next session
 *   - "auto-allow"    — Trust the agent, never ask again
 *
 * Consent preference is stored in harness.json under consent.externalActions.
 *
 * Two tiers of external actions:
 *   HARD — Irreversible or high-impact (merge, close, delete, release).
 *          Always blocked regardless of consent. User must approve each one.
 *   SOFT — Reversible (push, pr create, comment, edit).
 *          Governed by the consent preference.
 *
 * Secrets exfiltration (cat .env, etc.) is always blocked — not consent-gated.
 *
 * Exit codes:
 *   0 = allowed
 *   2 = blocked — agent must get user approval first
 */

const health = require('./harness-health-util');

const CITADEL_UI = process.env.CITADEL_UI === 'true';

function hookOutput(hookName, action, message, data = {}) {
  if (CITADEL_UI) {
    process.stdout.write(JSON.stringify({
      hook: hookName,
      action,
      message,
      timestamp: new Date().toISOString(),
      data,
    }));
  } else {
    process.stdout.write(message);
  }
}

// ── Always blocked: secrets exfiltration ────────────────────────────────────

const SECRETS_PATTERNS = [
  { regex: /\bcat\s+.*\.env(\b|\.)/, label: 'cat .env (secrets)' },
  { regex: /\bsource\s+.*\.env(\b|\.)/, label: 'source .env (secrets)' },
  { regex: /\bhead\s+.*\.env(\b|\.)/, label: 'head .env (secrets)' },
  { regex: /\btail\s+.*\.env(\b|\.)/, label: 'tail .env (secrets)' },
  { regex: /\bgrep\b.*\.env(\b|\.)/, label: 'grep .env (secrets)' },
  { regex: /\bless\s+.*\.env(\b|\.)/, label: 'less .env (secrets)' },
  { regex: /\bmore\s+.*\.env(\b|\.)/, label: 'more .env (secrets)' },
];

// ── Hard-blocked: irreversible external actions (always require approval) ───

const HARD_PATTERNS = [
  { regex: /\bgh\s+pr\s+merge\b/, label: 'gh pr merge' },
  { regex: /\bgh\s+pr\s+close\b/, label: 'gh pr close' },
  { regex: /\bgh\s+issue\s+close\b/, label: 'gh issue close' },
  { regex: /\bgh\s+issue\s+delete\b/, label: 'gh issue delete' },
  { regex: /\bgh\s+release\s+create\b/, label: 'gh release create' },
  { regex: /\bgh\s+repo\s+fork\b/, label: 'gh repo fork' },
  { regex: /gh\.exe"\s+pr\s+merge\b/, label: 'gh pr merge' },
  { regex: /gh\.exe"\s+pr\s+close\b/, label: 'gh pr close' },
  { regex: /gh\.exe"\s+issue\s+close\b/, label: 'gh issue close' },
  { regex: /gh\.exe"\s+issue\s+delete\b/, label: 'gh issue delete' },
  { regex: /gh\.exe"\s+release\s+create\b/, label: 'gh release create' },
  { regex: /gh\.exe"\s+repo\s+fork\b/, label: 'gh repo fork' },
  { regex: /\bgh\s+api\b.*--method\s+(POST|PUT|PATCH|DELETE)/i, label: 'gh api (mutating)' },
  { regex: /gh\.exe"\s+api\b.*--method\s+(POST|PUT|PATCH|DELETE)/i, label: 'gh api (mutating)' },
];

// ── Soft-gated: reversible external actions (governed by consent) ───────────

const SOFT_PATTERNS = [
  { regex: /\bgit\s+push\b/, label: 'git push' },
  { regex: /\bgh\s+pr\s+create\b/, label: 'gh pr create' },
  { regex: /gh\.exe"\s+pr\s+create\b/, label: 'gh pr create' },
  { regex: /\bgh\s+pr\s+(comment|edit)\b/, label: 'gh pr comment/edit' },
  { regex: /gh\.exe"\s+pr\s+(comment|edit)\b/, label: 'gh pr comment/edit' },
  { regex: /\bgh\s+issue\s+(create|comment|edit)\b/, label: 'gh issue create/comment/edit' },
  { regex: /gh\.exe"\s+issue\s+(create|comment|edit)\b/, label: 'gh issue create/comment/edit' },
];

/**
 * Strip quoted strings and heredoc bodies so commit messages,
 * PR descriptions, and echo'd text don't trigger false positives.
 */
function stripQuotedContent(cmd) {
  let stripped = cmd;
  // 1. Strip heredoc bodies: <<'DELIM' ... DELIM  and  << DELIM ... DELIM
  stripped = stripped.replace(/<<-?\s*'?(\w+)'?[^\n]*\n[\s\S]*?\n\s*\1\b/g, '');
  // 2. Strip double-quoted subshells "$(...)"
  stripped = stripped.replace(/"\$\([\s\S]*?\)"/g, '""');
  // 3. Strip single-quoted subshells '$(...)'
  stripped = stripped.replace(/'\$\([\s\S]*?\)'/g, "''");
  // 4. Strip backtick subshells `...`
  stripped = stripped.replace(/`[^`]*`/g, '``');
  // 5. Strip remaining double-quoted strings
  stripped = stripped.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  // 6. Strip single-quoted strings
  stripped = stripped.replace(/'(?:[^'\\]|\\.)*'/g, "''");
  return stripped;
}

function main() {
  let input = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => { input += chunk; });
  process.stdin.on('end', () => {
    try {
      run(input);
    } catch {
      process.exit(0); // Fail open
    }
  });
}

function run(input) {
  let event;
  try { event = JSON.parse(input); } catch { process.exit(0); }

  if ((event.tool_name || '') !== 'Bash') process.exit(0);

  const command = event.tool_input?.command || '';
  if (!command) process.exit(0);

  const stripped = stripQuotedContent(command);

  // Tier 0: Secrets — always blocked, no consent option
  for (const { regex, label } of SECRETS_PATTERNS) {
    if (regex.test(stripped)) {
      health.logBlock('external-action-gate', 'blocked', `${label}: ${command.slice(0, 200)}`);
      hookOutput('external-action-gate', 'blocked',
        `[external-action-gate] Blocked: "${label}" reads secrets. This is always blocked.`,
        { label, tier: 'secrets' }
      );
      process.exit(2);
    }
  }

  // Tier 1: Hard — always blocked, user must approve each one
  for (const { regex, label } of HARD_PATTERNS) {
    if (regex.test(stripped)) {
      health.logBlock('external-action-gate', 'blocked', `${label}: ${command.slice(0, 200)}`);
      hookOutput('external-action-gate', 'blocked',
        `[external-action-gate] Blocked: "${label}" is irreversible. ` +
        `Show the user the exact content and get approval before executing.`,
        { label, tier: 'hard' }
      );
      process.exit(2);
    }
  }

  // Tier 2: Soft — governed by consent preference
  for (const { regex, label } of SOFT_PATTERNS) {
    if (regex.test(stripped)) {
      const consent = health.checkConsent('externalActions');

      if (consent.action === 'allow') {
        // User previously chose auto-allow or session-allow is active
        process.exit(0);
      }

      if (consent.action === 'first-encounter') {
        health.logBlock('external-action-gate', 'first-encounter', `${label}: ${command.slice(0, 200)}`);
        hookOutput('external-action-gate', 'first-encounter',
          `[external-action-gate] This is your first external action ("${label}").\n` +
          `Citadel can push branches, create PRs, and post comments on your behalf.\n\n` +
          `How would you like to handle this going forward?\n` +
          `  1. "always-ask"    — Ask me every time before any external action\n` +
          `  2. "session-allow" — Allow for this session, ask again next session\n` +
          `  3. "auto-allow"    — I trust the agent, don't ask again\n\n` +
          `Tell the user these three options and ask which they prefer.\n` +
          `Then write their choice to harness.json:\n` +
          `  node -e "require('./hooks_src/harness-health-util').writeConsent('externalActions', '<choice>')"` +
          `\nFor "session-allow", also run:\n` +
          `  node -e "require('./hooks_src/harness-health-util').grantSessionAllow('externalActions')"` +
          `\nThen retry the command.`,
          { label, tier: 'soft', consent: 'first-encounter' }
        );
        process.exit(2);
      }

      // consent.action === 'block' (always-ask or session-allow without active grant)
      health.logBlock('external-action-gate', 'consent-block', `${label}: ${command.slice(0, 200)}`);

      const pref = health.readConsent('externalActions');
      if (pref === 'session-allow') {
        // Session-allow but no active session grant — new session
        hookOutput('external-action-gate', 'consent-block',
          `[external-action-gate] New session: "${label}" needs approval.\n` +
          `Your preference is "session-allow" — approve this to allow external actions for this session.\n` +
          `Ask the user for approval. If approved, run:\n` +
          `  node -e "require('./hooks_src/harness-health-util').grantSessionAllow('externalActions')"` +
          `\nThen retry.`,
          { label, tier: 'soft', consent: 'session-renew' }
        );
      } else {
        hookOutput('external-action-gate', 'consent-block',
          `[external-action-gate] "${label}" is an external action. ` +
          `Show the user the exact content and get approval before executing.`,
          { label, tier: 'soft', consent: 'always-ask' }
        );
      }
      process.exit(2);
    }
  }

  // Not an external action — allow
  process.exit(0);
}

main();
