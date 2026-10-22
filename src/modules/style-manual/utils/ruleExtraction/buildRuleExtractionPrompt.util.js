import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { RULE_EXTRACTION_PROMPT, PROMPT_TEXT_PLACEHOLDER } = StyleManualConstants;

export function buildRuleExtractionPrompt(extractedText) {
  // Function replacer so "$" sequences in the manual text are never interpreted as patterns.
  return RULE_EXTRACTION_PROMPT.replace(PROMPT_TEXT_PLACEHOLDER, () => extractedText);
}
