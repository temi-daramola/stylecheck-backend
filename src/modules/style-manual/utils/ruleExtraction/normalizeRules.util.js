import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const {
  MAX_RULES,
  MAX_RULE_NAME_LENGTH,
  MAX_RULE_DESCRIPTION_LENGTH,
  MAX_SOURCE_REF_LENGTH,
  RULE_ID_PREFIX,
  RULE_ID_PAD_LENGTH,
  CATEGORIES,
  VERIFIABILITY,
  DEFAULT_CATEGORY,
  DEFAULT_VERIFIABILITY,
} = StyleManualConstants;

const VALID_VERIFIABILITY = Object.values(VERIFIABILITY);

const cleanText = (value, maxLength) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const oneOf = (value, allowed, fallback) => {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return allowed.includes(normalized) ? normalized : fallback;
};

const duplicateKey = (rule) => `${rule.sourceRef}|${rule.ruleName}|${rule.description}`.toLowerCase().replace(/\s+/g, ' ');

/**
 * Turns Gemini's raw output into the rules we store.
 * Gemini output is untrusted: we keep only well-formed items, clamp the enumerated fields to known
 * values, drop exact duplicates (a follow-up pass can repeat a rule), and assign ruleIds ourselves
 * so they are always unique and sequential. Returns an empty array when nothing usable was returned.
 */
export function normalizeRules(geminiResult) {
  const rawRules = Array.isArray(geminiResult?.rules) ? geminiResult.rules : [];
  const seen = new Set();

  return rawRules
    .map((rule) => ({
      sourceRef: cleanText(rule?.sourceRef, MAX_SOURCE_REF_LENGTH),
      category: oneOf(rule?.category, CATEGORIES, DEFAULT_CATEGORY),
      verifiability: oneOf(rule?.verifiability, VALID_VERIFIABILITY, DEFAULT_VERIFIABILITY),
      ruleName: cleanText(rule?.ruleName, MAX_RULE_NAME_LENGTH),
      description: cleanText(rule?.description, MAX_RULE_DESCRIPTION_LENGTH),
    }))
    .filter((rule) => rule.ruleName && rule.description)
    .filter((rule) => {
      const key = duplicateKey(rule);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_RULES)
    .map((rule, index) => ({
      ruleId: `${RULE_ID_PREFIX}${String(index + 1).padStart(RULE_ID_PAD_LENGTH, '0')}`,
      ...rule,
    }));
}
