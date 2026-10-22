import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { modules } from '@modules/_index.js';

const { generateTempPassword, buildInviteLink, buildInviteEmailHtml, toSupervisorDto } = modules.admin.utils;

describe('admin utils', () => {
  test('temporary passwords are long, random and different every time', () => {
    const first = generateTempPassword();
    const second = generateTempPassword();
    assert.ok(first.length >= 24);
    assert.notEqual(first, second);
  });

  test('invite link points at the set-password page with the token and invite flag', () => {
    const link = buildInviteLink('abc 123');
    assert.match(link, /\/reset-password\?token=abc%20123&invite=1$/);
  });

  test('invite email escapes the supervisor name and link', () => {
    const html = buildInviteEmailHtml({ supervisorName: '<b>Ada</b>', link: 'http://x/?a=1&b="2"' });
    assert.ok(!html.includes('<b>Ada</b>'));
    assert.ok(html.includes('&lt;b&gt;Ada&lt;/b&gt;'));
    assert.ok(html.includes('&amp;b=&quot;2&quot;'));
  });

  test('supervisor dto never exposes the password hash', () => {
    const dto = toSupervisorDto({ _id: '1', name: 'A', email: 'a@x.edu', role: 'admin', isActive: true, createdAt: 'd', passwordHash: 'secret' });
    assert.deepEqual(Object.keys(dto).sort(), ['createdAt', 'email', 'id', 'isActive', 'name', 'role']);
  });
});
