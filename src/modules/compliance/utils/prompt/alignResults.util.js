import { common } from '@common/_index.js';
import { ComplianceConstants } from '@modules/compliance/constants/compliance.constants.js';

const { ExternalServiceError } = common.errors;
const { Layer } = common.constants;
const {
  STATUS,
  MESSAGES,
  CODES,
  NOT_VERIFIABLE_VERIFIABILITY,
  NOT_VERIFIABLE_REASON,
  MISSING_VERDICT_REASON,
  MISSING_VERDICT_TOLERANCE,
  MAX_REASONING_LENGTH,
} = ComplianceConstants;

const normalize = (value) => String(value ?? '').trim().toLowerCase();
const ALLOWED = [STATUS.PASSED, STATUS.FAILED, STATUS.NOT_VERIFIABLE];
const STATUS_BY_KEY = new Map(ALLOWED.map((status) => [normalize(status), status]));

const normalizeStatus = (status) => STATUS_BY_KEY.get(normalize(status).replace(/[-_]/g, ' ')) ?? null;

const build = (rule, status, reasoning) => ({
  ruleId: rule.ruleId,
  ruleName: rule.ruleName,
  sourceRef: rule.sourceRef ?? '',
  status,
  reasoning,
});

/**
 * Pairs the AI's verdicts with the stored rules so there is exactly one result per rule, in rule order.
 * - Rules marked not-verifiable were never sent: they get "Not verifiable" without asking the AI.
 * - The AI's output is untrusted: verdicts are matched by rule ID (rule name as a fallback) and only the
 *   three known outcomes are accepted.
 * - A rule the AI skipped becomes "Not verifiable" (it is excluded from the score, so the student is not
 *   penalised). If too many are missing the answer is unreliable and the whole run is rejected.
 */
export function alignResults(rules, geminiResult) {
  const verdicts = Array.isArray(geminiResult?.results) ? geminiResult.results : [];
  const byId = new Map(verdicts.map((verdict) => [normalize(verdict?.ruleId), verdict]));
  const byName = new Map(verdicts.map((verdict) => [normalize(verdict?.ruleName), verdict]));

  const sent = rules.filter((rule) => rule.verifiability !== NOT_VERIFIABLE_VERIFIABILITY);
  let missing = 0;

  const aligned = rules.map((rule) => {
    if (rule.verifiability === NOT_VERIFIABLE_VERIFIABILITY) return build(rule, STATUS.NOT_VERIFIABLE, NOT_VERIFIABLE_REASON);
    const verdict = byId.get(normalize(rule.ruleId)) ?? byName.get(normalize(rule.ruleName));
    const status = normalizeStatus(verdict?.status);
    if (!status) {
      missing += 1;
      return build(rule, STATUS.NOT_VERIFIABLE, MISSING_VERDICT_REASON);
    }
    const reasoning = typeof verdict.reasoning === 'string' ? verdict.reasoning.trim().slice(0, MAX_REASONING_LENGTH) : '';
    return build(rule, status, reasoning);
  });

  const allowedMissing = Math.max(MISSING_VERDICT_TOLERANCE.minimum, Math.floor(sent.length * MISSING_VERDICT_TOLERANCE.share));
  if (sent.length > 0 && missing > allowedMissing) {
    throw new ExternalServiceError(MESSAGES.RESULTS_INCOMPLETE, {
      layer: Layer.EXTERNAL_API,
      code: CODES.RESULTS_INCOMPLETE,
    });
  }

  return aligned;
}
