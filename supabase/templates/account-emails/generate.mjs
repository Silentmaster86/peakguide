import { mkdir, writeFile } from 'node:fs/promises';
import { renderEmail, nativeTemplate } from './render.mjs';
import { replyTo, siteUrl } from './messages.mjs';

const root = new URL('./', import.meta.url);
const subjects = {};
for (const locale of ['pl', 'en', 'uk', 'zh']) {
  await mkdir(new URL(`${locale}/`, root), { recursive: true });
  subjects[locale] = {};
  for (const kind of ['welcome', 'recovery', 'password_changed']) {
    const mail = renderEmail(kind, locale);
    subjects[locale][kind] = mail.subject;
    await writeFile(new URL(`${locale}/${kind}.html`, root), mail.html);
    await writeFile(new URL(`${locale}/${kind}.txt`, root), mail.text + '\n');
  }
}
for (const kind of ['recovery', 'password_changed']) {
  await writeFile(new URL(`${kind}.html`, root), nativeTemplate(kind));
  // Subject templates are separate from body HTML for the dashboard fields.
  await writeFile(new URL(`${kind}.subject.txt`, root), nativeTemplate(kind, 'subject').replaceAll('\n', '') + '\n');
}
await writeFile(new URL('welcome.html', root), renderEmail('welcome', 'pl').html);
await writeFile(new URL('subjects.json', root), JSON.stringify(subjects, null, 2) + '\n');
await writeFile(new URL('welcome-delivery.json', root), JSON.stringify({
  replyTo, siteUrl, localeMetadataKey: 'locale', defaultLocale: 'pl',
}, null, 2) + '\n');
