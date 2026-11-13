import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderEmail, emailLocale } from '../templates/account-emails/render.mjs';

for (const locale of ['pl', 'en', 'uk', 'zh']) {
  test(`welcome ${locale}: sender identity and reply routing are ready for the mail adapter`, () => {
    const mail = renderEmail('welcome', locale);
    assert.equal(mail.replyTo, 'przemyslaw.pietkun@gmail.com');
    assert.ok(mail.html.includes('Przemysław'));
    assert.ok(mail.text.includes('Przemysław'));
    assert.ok(!mail.html.includes('{{'));
    assert.ok(mail.html.includes(`lang="${locale === 'zh' ? 'zh-Hans' : locale}"`));
  });
  test(`generated ${locale} files match the current copy`, async () => {
    for (const kind of ['welcome', 'recovery', 'password_changed']) {
      const mail = renderEmail(kind, locale);
      const file = await readFile(new URL(`../templates/account-emails/${locale}/${kind}.html`, import.meta.url), 'utf8');
      assert.equal(file, mail.html);
    }
  });
}
test('unsupported language values use Polish; Ukrainian UI code is normalized', () => {
  for (const value of [undefined, null, '', 'fr', {}, 7, '__proto__', 'constructor', '<script>']) {
    assert.equal(emailLocale(value), 'pl');
    assert.equal(renderEmail('welcome', value).locale, 'pl');
  }
  assert.equal(emailLocale('ua'), 'uk');
});
test('reset mail keeps the Auth link; changed-password notice contains no reset link', () => {
  for (const locale of ['pl', 'en', 'uk', 'zh']) {
    assert.ok(renderEmail('recovery', locale).html.includes('href="{{ .ConfirmationURL }}"'));
    assert.ok(!renderEmail('password_changed', locale).html.includes('.ConfirmationURL'));
  }
});
