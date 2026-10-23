import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { RULE_EXTRACTION_PROMPT, PROMPT_TEXT_PLACEHOLDER, PROMPT_FOCUS_PLACEHOLDER, FOCUS_INSTRUCTION } = StyleManualConstants;
const PLACEHOLDER_PATTERN = /\{\{[A-Z_]+\}\}/g;

/**
 * `onlyReferences` (optional): numbered items a first pass skipped, e.g. ["[12]", "[35]"].
 * Single-pass replacement so text inserted for one placeholder is never scanned for another.
 */
export function buildRuleExtractionPrompt(extractedText, { onlyReferences = [] } = {}) {
  const values = {
    [PROMPT_FOCUS_PLACEHOLDER]: onlyReferences.length ? FOCUS_INSTRUCTION(onlyReferences.join(', ')) : '',
    [PROMPT_TEXT_PLACEHOLDER]: extractedText,
  };
  return RULE_EXTRACTION_PROMPT.replace(PLACEHOLDER_PATTERN, (match) => values[match] ?? match);
}
