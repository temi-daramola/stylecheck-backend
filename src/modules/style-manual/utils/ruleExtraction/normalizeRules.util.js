import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const {
  MAX_RULES,
  MAX_RULE_NAME_LENGTH,
  MAX_RULE_DESCRIPTION_LENGTH,
  RULE_ID_PREFIX,
  RULE_ID_PAD_LENGTH,
} = StyleManualConstants;

const cleanText = (value, maxLength) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

/**
 * Turns Gemini's raw output into the rules we store.
 * Gemini output is untrusted: we keep only well-formed items and assign ruleIds ourselves
 * so they are always unique and sequential.
 * Returns an empty array when nothing usable was returned.
 */
export function normalizeRules(geminiResult) {
  const rawRules = Array.isArray(geminiResult?.rules) ? geminiResult.rules : [];

  return rawRules
    .map((rule) => ({
      ruleName: cleanText(rule?.ruleName, MAX_RULE_NAME_LENGTH),
      description: cleanText(rule?.description, MAX_RULE_DESCRIPTION_LENGTH),
    }))
    .filter((rule) => rule.ruleName && rule.description)
    .slice(0, MAX_RULES)
    .map((rule, index) => ({
      ruleId: `${RULE_ID_PREFIX}${String(index + 1).padStart(RULE_ID_PAD_LENGTH, '0')}`,
      ...rule,
    }));
}
