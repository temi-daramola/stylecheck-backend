import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ExternalServiceError } = common.errors;
const { Layer } = common.constants;
const { STATUS, MESSAGES, CODES } = ComplianceConstants;
const MAX_REASONING_LENGTH = 1000;

const normalizeName = (name) => String(name ?? '').trim().toLowerCase();
const normalizeStatus = (status) => (status === STATUS.PASSED ? STATUS.PASSED : status === STATUS.FAILED ? STATUS.FAILED : null);

/**
 * Pairs Gemini's verdicts with the stored rules so there is exactly one result per rule.
 * Gemini output is untrusted: matching is by rule name, falling back to position only when the
 * counts agree. If any rule has no usable verdict we reject the whole run, because silently
 * defaulting a missing verdict to "Failed" would unfairly lower the student's score.
 */
export function alignResults(rules, geminiResult) {
  const verdicts = Array.isArray(geminiResult?.results) ? geminiResult.results : [];
  const byName = new Map(verdicts.map((verdict) => [normalizeName(verdict?.ruleName), verdict]));
  const canUsePosition = verdicts.length === rules.length;

  const aligned = rules.map((rule, index) => {
    const verdict = byName.get(normalizeName(rule.ruleName)) ?? (canUsePosition ? verdicts[index] : undefined);
    const status = normalizeStatus(verdict?.status);
    if (!status) return null;
    return {
      ruleName: rule.ruleName,
      status,
      reasoning: typeof verdict.reasoning === 'string' ? verdict.reasoning.trim().slice(0, MAX_REASONING_LENGTH) : '',
    };
  });

  if (aligned.some((item) => item === null)) {
    throw new ExternalServiceError(MESSAGES.RESULTS_INCOMPLETE, {
      layer: Layer.EXTERNAL_API,
      code: CODES.RESULTS_INCOMPLETE,
    });
  }

  return aligned;
}
