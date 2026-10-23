import { StyleManualConstants } from '@modules/style-manual/constants/styleManual.constants.js';

const { MARKER_PATTERN, MIN_MARKERS, MAX_FOLLOW_UP_MARKERS } = StyleManualConstants.COVERAGE;

/** Distinct numbers written as [12] (or [ 12 ]) in the manual, ascending. */
export function findNumberedMarkers(manualText) {
  const found = new Set();
  for (const match of manualText.matchAll(new RegExp(MARKER_PATTERN.source, 'g'))) {
    found.add(Number(match[1]));
  }
  return [...found].sort((a, b) => a - b);
}

// A number counts as cited when it appears as its own token: "[15](b)" and "15(b)" yes,
// but "2.3" must not cover the numbers 2 or 3.
const isCited = (number, sourceRefs) => {
  const token = new RegExp(`(?<![\\d.])${number}(?![\\d.])`);
  return sourceRefs.some((reference) => token.test(reference));
};

/**
 * Generic completeness check. If the manual numbers its rules like [1], [2], [3] ..., every such number
 * should be cited by at least one extracted rule's sourceRef. Returns the numbers no rule cites, as
 * "[n]" strings, or an empty list when the manual does not use this numbering (nothing to check against).
 */
export function findUncoveredReferences(manualText, rules) {
  const markers = findNumberedMarkers(manualText);
  if (markers.length < MIN_MARKERS) return [];

  const sourceRefs = rules.map((rule) => String(rule?.sourceRef ?? ''));
  const missing = markers.filter((number) => !isCited(number, sourceRefs));
  if (missing.length > MAX_FOLLOW_UP_MARKERS) return [];

  return missing.map((number) => `[${number}]`);
}
