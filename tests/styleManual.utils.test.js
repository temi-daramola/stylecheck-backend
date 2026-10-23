import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '@modules/_index.js';
import { common } from '@common/_index.js';

const { buildRuleExtractionPrompt, normalizeRules, findUncoveredReferences } = modules.styleManual.utils.ruleExtraction;
const { escapeHtml } = common.utilities;

describe('normalizeRules', () => {
  test('keeps well-formed rules, assigns ids itself and clamps unknown field values', () => {
    const out = normalizeRules({
      rules: [
        { ruleId: 'ZZZ', sourceRef: ' [1] ', category: 'formatting', verifiability: 'formatting', ruleName: ' Margins ', description: ' 1 inch ' },
        { ruleId: 'ZZZ', ruleName: 'Font', description: '12pt', category: 'nonsense', verifiability: 'whatever' },
      ],
    });
    assert.deepEqual(out, [
      { ruleId: 'R001', sourceRef: '[1]', category: 'formatting', verifiability: 'formatting', ruleName: 'Margins', description: '1 inch' },
      { ruleId: 'R002', sourceRef: '', category: 'content', verifiability: 'both', ruleName: 'Font', description: '12pt' },
    ]);
  });

  test('drops malformed items and exact duplicates', () => {
    const out = normalizeRules({
      rules: ['junk', null, { ruleName: '', description: 'x' }, { ruleName: 'A' }, { ruleName: 'B', description: 'ok' }, { ruleName: 'b', description: 'OK' }],
    });
    assert.deepEqual(out.map((r) => r.ruleName), ['B']);
  });

  test('returns an empty list for unusable output', () => {
    assert.deepEqual(normalizeRules(null), []);
    assert.deepEqual(normalizeRules({}), []);
    assert.deepEqual(normalizeRules({ rules: 'x' }), []);
  });

  test('caps the number of rules and the text lengths', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ ruleName: `r${i}`, description: 'd'.repeat(5000) }));
    const out = normalizeRules({ rules: many });
    assert.equal(out.length, 400);
    assert.equal(out[0].description.length, 1500);
    assert.equal(out[399].ruleId, 'R400');
  });
});

describe('findUncoveredReferences', () => {
  const manual = '[1] Margins. [2] Font. [ 3 ] Spacing. [4] Indent. [5] Title. [6] Notes.';
  test('lists numbers no rule cites, tolerating spaces inside brackets', () => {
    const rules = [{ sourceRef: '[1]' }, { sourceRef: '2(a)' }, { sourceRef: '[4]' }, { sourceRef: 'Section 5.6' }];
    assert.deepEqual(findUncoveredReferences(manual, rules), ['[3]', '[5]', '[6]']);
  });

  test('does nothing for manuals that do not number rules this way', () => {
    assert.deepEqual(findUncoveredReferences('Plain text with [1] one marker.', []), []);
  });
});

describe('buildRuleExtractionPrompt', () => {
  test('inserts the manual text verbatim, including $ sequences', () => {
    const text = 'Margins are $& 1 inch $1';
    const prompt = buildRuleExtractionPrompt(text);
    assert.ok(prompt.endsWith(text));
    assert.ok(!prompt.includes('{{'));
  });

  test('the follow-up variant names the uncovered items', () => {
    const prompt = buildRuleExtractionPrompt('text', { onlyReferences: ['[3]', '[5]'] });
    assert.match(prompt, /\[3\], \[5\]/);
  });
});

describe('escapeHtml', () => {
  test('escapes markup so user text cannot inject HTML into emails', () => {
    assert.equal(escapeHtml('<script>alert("x")</script> & \'y\''), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
    assert.equal(escapeHtml(null), '');
  });
});
