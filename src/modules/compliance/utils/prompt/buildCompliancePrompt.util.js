import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { TEMPLATE, RULES_PLACEHOLDER, TEXT_PLACEHOLDER, PROFILE_PLACEHOLDER } = ComplianceConstants.PROMPT;
const JSON_INDENT = 2;
const ANY_PLACEHOLDER = /\{\{[A-Z_]+\}\}/g;

const { NOT_VERIFIABLE_VERIFIABILITY } = ComplianceConstants;

// Rules marked not-verifiable (paper, binding, signatures ...) are never sent: the file cannot show them.
const checkableRules = (rules) => rules.filter((rule) => rule.verifiability !== NOT_VERIFIABLE_VERIFIABILITY);

const numberedRules = (rules) =>
  checkableRules(rules).map((rule) => `[${rule.ruleId}] ${rule.ruleName} — ${rule.description}`).join('\n');

export function buildCompliancePrompt({ rules, documentText, formattingProfile }) {
  const values = {
    [RULES_PLACEHOLDER]: numberedRules(rules),
    [TEXT_PLACEHOLDER]: documentText,
    [PROFILE_PLACEHOLDER]: JSON.stringify(formattingProfile, null, JSON_INDENT),
  };

  // One pass over the template only: text inserted for one placeholder is never scanned again, so
  // a document that happens to contain "{{FORMATTING_PROFILE}}" cannot be rewritten by a later step.
  return TEMPLATE.replace(ANY_PLACEHOLDER, (match) => values[match] ?? match);
}
