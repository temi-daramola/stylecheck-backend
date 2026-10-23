import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '@modules/_index.js';

const { compliance } = modules;
const { computeScore, bandForScore } = compliance.utils.scoring;
const { alignResults, buildCompliancePrompt } = compliance.utils.prompt;

const rules = [
  { ruleId: 'R001', sourceRef: '[1]', verifiability: 'formatting', ruleName: 'Margins', description: '1 inch margins' },
  { ruleId: 'R002', sourceRef: '[2]', verifiability: 'formatting', ruleName: 'Font', description: '12pt Times New Roman' },
  { ruleId: 'R003', sourceRef: '[3]', verifiability: 'formatting', ruleName: 'Spacing', description: 'Double spacing' },
];

describe('scoring', () => {
  test('score is passed / (passed + failed), rounded', () => {
    const result = computeScore([{ status: 'Passed' }, { status: 'Passed' }, { status: 'Failed' }]);
    assert.equal(result.complianceScore, 67);
    assert.equal(result.rulesPassed, 2);
    assert.equal(result.rulesFailed, 1);
    assert.equal(result.rulesNotVerifiable, 0);
  });

  test('"Not verifiable" rules are left out of the score', () => {
    const result = computeScore([{ status: 'Passed' }, { status: 'Failed' }, { status: 'Not verifiable' }, { status: 'Not verifiable' }]);
    assert.equal(result.complianceScore, 50);
    assert.equal(result.rulesNotVerifiable, 2);
  });

  test('band boundaries: 85 and 60 are inclusive lower bounds', () => {
    assert.equal(bandForScore(100), 'Full Compliance');
    assert.equal(bandForScore(85), 'Full Compliance');
    assert.equal(bandForScore(84), 'Partial Compliance');
    assert.equal(bandForScore(60), 'Partial Compliance');
    assert.equal(bandForScore(59), 'Non-Compliant');
    assert.equal(bandForScore(0), 'Non-Compliant');
  });

  test('empty or all-unverifiable results score 0 instead of dividing by zero', () => {
    assert.equal(computeScore([]).complianceScore, 0);
    assert.equal(computeScore([{ status: 'Not verifiable' }]).complianceScore, 0);
  });

  test('the brief example: 5 of 8 passed is 63 (Partial)', () => {
    const results = Array.from({ length: 8 }, (_, i) => ({ status: i < 5 ? 'Passed' : 'Failed' }));
    const { complianceScore, complianceBand } = computeScore(results);
    assert.equal(complianceScore, 63);
    assert.equal(complianceBand, 'Partial Compliance');
  });
});

describe('alignResults', () => {
  const verdict = (ruleId, status = 'Passed') => ({ ruleId, status, reasoning: 'ok' });

  test('matches by rule id regardless of order and case', () => {
    const out = alignResults(rules, {
      results: [verdict('r003', 'Failed'), verdict('R001'), verdict('R002', 'Not verifiable')],
    });
    assert.deepEqual(out.map((r) => [r.ruleId, r.status]), [
      ['R001', 'Passed'], ['R002', 'Not verifiable'], ['R003', 'Failed'],
    ]);
  });

  test('falls back to the rule name when the id is missing', () => {
    const out = alignResults([rules[0]], { results: [{ ruleName: ' margins ', status: 'Failed', reasoning: 'x' }] });
    assert.equal(out[0].status, 'Failed');
  });

  test('rules marked not-verifiable are never sent and always come back Not verifiable', () => {
    const withPaper = [...rules, { ruleId: 'R004', verifiability: 'not-verifiable', ruleName: 'Paper', description: 'A4 paper' }];
    const prompt = buildCompliancePrompt({ rules: withPaper, documentText: 't', formattingProfile: {} });
    assert.ok(!prompt.includes('A4 paper'));
    const out = alignResults(withPaper, { results: [verdict('R001'), verdict('R002'), verdict('R003')] });
    assert.equal(out[3].status, 'Not verifiable');
  });

  test('a few missing verdicts become Not verifiable instead of failing the run', () => {
    const out = alignResults(rules, { results: [verdict('R001')] });
    assert.deepEqual(out.map((r) => r.status), ['Passed', 'Not verifiable', 'Not verifiable']);
  });

  test('too many missing verdicts reject the run', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ ruleId: `R${i + 1}`, ruleName: `n${i}`, description: 'd', verifiability: 'text' }));
    assert.throws(() => alignResults(many, { results: [] }), { code: 'AI_RESULTS_INCOMPLETE' });
  });

  test('an invalid status counts as missing', () => {
    const out = alignResults(rules, { results: [verdict('R001', 'Maybe'), verdict('R002'), verdict('R003')] });
    assert.equal(out[0].status, 'Not verifiable');
  });

  test('garbage input does not crash', () => {
    assert.equal(alignResults(rules, null).length, 3);
    assert.equal(alignResults(rules, { results: 'nope' }).length, 3);
  });

  test('uses the stored rule name, not the model\'s, and truncates reasoning', () => {
    const long = 'x'.repeat(5000);
    const out = alignResults([rules[0]], { results: [{ ruleId: 'R001', ruleName: 'other', status: 'Passed', reasoning: long }] });
    assert.equal(out[0].ruleName, 'Margins');
    assert.equal(out[0].reasoning.length, 1000);
  });
});

describe('buildCompliancePrompt', () => {
  test('contains the rules with ids, text and the formatting profile', () => {
    const prompt = buildCompliancePrompt({
      rules,
      documentText: 'Body text here',
      formattingProfile: { bodyFont: 'Times New Roman', unresolved: [] },
    });
    assert.match(prompt, /\[R001\] Margins — 1 inch margins/);
    assert.match(prompt, /\[R003\] Spacing — Double spacing/);
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
