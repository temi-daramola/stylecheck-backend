import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { TEMPLATE, RULES_PLACEHOLDER, TEXT_PLACEHOLDER, PROFILE_PLACEHOLDER } = ComplianceConstants.PROMPT;
const JSON_INDENT = 2;
const ANY_PLACEHOLDER = /\{\{[A-Z_]+\}\}/g;

const numberedRules = (rules) =>
  rules.map((rule, index) => `${index + 1}. [${rule.ruleId}] ${rule.ruleName} — ${rule.description}`).join('\n');

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
