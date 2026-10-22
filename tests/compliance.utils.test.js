import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '@modules/_index.js';

const { compliance } = modules;
const { computeScore, bandForScore } = compliance.utils.scoring;
const { alignResults, buildCompliancePrompt } = compliance.utils.prompt;

const rules = [
  { ruleId: 'R01', ruleName: 'Margins', description: '1 inch margins' },
  { ruleId: 'R02', ruleName: 'Font', description: '12pt Times New Roman' },
  { ruleId: 'R03', ruleName: 'Spacing', description: 'Double spacing' },
];

describe('scoring', () => {
  test('score is passed / total, rounded', () => {
    const result = computeScore([{ status: 'Passed' }, { status: 'Passed' }, { status: 'Failed' }]);
    assert.equal(result.complianceScore, 67);
    assert.equal(result.rulesPassed, 2);
    assert.equal(result.rulesFailed, 1);
  });

  test('band boundaries: 85 and 60 are inclusive lower bounds', () => {
    assert.equal(bandForScore(100), 'Full Compliance');
    assert.equal(bandForScore(85), 'Full Compliance');
    assert.equal(bandForScore(84), 'Partial Compliance');
    assert.equal(bandForScore(60), 'Partial Compliance');
    assert.equal(bandForScore(59), 'Non-Compliant');
    assert.equal(bandForScore(0), 'Non-Compliant');
  });

  test('empty results score 0 instead of dividing by zero', () => {
    assert.equal(computeScore([]).complianceScore, 0);
  });

  test('the brief example: 5 of 8 passed is 63 (Partial)', () => {
    const results = Array.from({ length: 8 }, (_, i) => ({ status: i < 5 ? 'Passed' : 'Failed' }));
    const { complianceScore, complianceBand } = computeScore(results);
    assert.equal(complianceScore, 63);
    assert.equal(complianceBand, 'Partial Compliance');
  });
});

describe('alignResults', () => {
  const verdict = (ruleName, status = 'Passed') => ({ ruleName, status, reasoning: 'ok' });

  test('matches by rule name regardless of order and ignores case/whitespace', () => {
    const out = alignResults(rules, {
      results: [verdict(' spacing ', 'Failed'), verdict('MARGINS'), verdict('font')],
    });
    assert.deepEqual(out.map((r) => [r.ruleName, r.status]), [
      ['Margins', 'Passed'], ['Font', 'Passed'], ['Spacing', 'Failed'],
    ]);
  });

  test('falls back to position only when counts agree', () => {
    const out = alignResults(rules, { results: [verdict('a'), verdict('b', 'Failed'), verdict('c')] });
    assert.deepEqual(out.map((r) => r.status), ['Passed', 'Failed', 'Passed']);
  });

  test('rejects an incomplete answer instead of inventing verdicts', () => {
    assert.throws(() => alignResults(rules, { results: [verdict('Margins')] }), { code: 'AI_RESULTS_INCOMPLETE' });
  });

  test('rejects an invalid status', () => {
    assert.throws(
      () => alignResults(rules, { results: [verdict('Margins', 'Maybe'), verdict('Font'), verdict('Spacing')] }),
      { code: 'AI_RESULTS_INCOMPLETE' }
    );
  });

  test('rejects garbage', () => {
    assert.throws(() => alignResults(rules, null), { code: 'AI_RESULTS_INCOMPLETE' });
    assert.throws(() => alignResults(rules, { results: 'nope' }), { code: 'AI_RESULTS_INCOMPLETE' });
  });

  test('uses the stored rule name, not the model\'s, and truncates reasoning', () => {
    const long = 'x'.repeat(5000);
    const out = alignResults([rules[0]], { results: [{ ruleName: 'margins', status: 'Passed', reasoning: long }] });
    assert.equal(out[0].ruleName, 'Margins');
    assert.equal(out[0].reasoning.length, 1000);
  });
});

describe('buildCompliancePrompt', () => {
  test('contains numbered rules, text and the formatting profile', () => {
    const prompt = buildCompliancePrompt({
      rules,
      documentText: 'Body text here',
      formattingProfile: { bodyFont: 'Times New Roman', unresolved: [] },
    });
    assert.match(prompt, /1\. \[R01\] Margins — 1 inch margins/);
    assert.match(prompt, /3\. \[R03\] Spacing — Double spacing/);
    assert.match(prompt, /Body text here/);
    assert.match(prompt, /"bodyFont": "Times New Roman"/);
    assert.ok(!prompt.includes('{{'), 'no unreplaced placeholders');
  });

  test('document text containing $ patterns and placeholder-like text is inserted verbatim', () => {
    const text = 'Costs $& and $1 and {{FORMATTING_PROFILE}}';
    const prompt = buildCompliancePrompt({ rules, documentText: text, formattingProfile: {} });
    assert.ok(prompt.includes(text));
  });
});
