import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '@modules/_index.js';
import { common } from '@common/_index.js';

const { buildRuleExtractionPrompt, normalizeRules } = modules.styleManual.utils.ruleExtraction;
const { escapeHtml } = common.utilities;

describe('normalizeRules', () => {
  test('keeps well-formed rules and assigns sequential ids itself', () => {
    const out = normalizeRules({
      rules: [
        { ruleId: 'ZZZ', ruleName: ' Margins ', description: ' 1 inch ' },
        { ruleId: 'ZZZ', ruleName: 'Font', description: '12pt' },
      ],
    });
    assert.deepEqual(out, [
      { ruleId: 'R01', ruleName: 'Margins', description: '1 inch' },
      { ruleId: 'R02', ruleName: 'Font', description: '12pt' },
    ]);
  });

  test('drops items that are malformed or empty', () => {
    const out = normalizeRules({ rules: ['junk', null, { ruleName: '', description: 'x' }, { ruleName: 'A' }, { ruleName: 'B', description: 'ok' }] });
    assert.deepEqual(out.map((r) => r.ruleName), ['B']);
    assert.equal(out[0].ruleId, 'R01');
  });

  test('returns an empty list for unusable output', () => {
    assert.deepEqual(normalizeRules(null), []);
    assert.deepEqual(normalizeRules({}), []);
    assert.deepEqual(normalizeRules({ rules: 'x' }), []);
  });

  test('caps the number of rules and the text lengths', () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ ruleName: `r${i}`, description: 'd'.repeat(5000) }));
    const out = normalizeRules({ rules: many });
    assert.equal(out.length, 200);
    assert.equal(out[0].description.length, 1000);
    assert.equal(out[199].ruleId, 'R200');
  });
});

describe('buildRuleExtractionPrompt', () => {
  test('inserts the manual text verbatim, including $ sequences', () => {
    const text = 'Margins are $& 1 inch $1';
    const prompt = buildRuleExtractionPrompt(text);
    assert.ok(prompt.endsWith(text));
    assert.ok(!prompt.includes('{{STYLE_MANUAL_TEXT}}'));
  });
});

describe('escapeHtml', () => {
  test('escapes markup so user text cannot inject HTML into emails', () => {
    assert.equal(escapeHtml('<script>alert("x")</script> & \'y\''), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
    assert.equal(escapeHtml(null), '');
  });
});
