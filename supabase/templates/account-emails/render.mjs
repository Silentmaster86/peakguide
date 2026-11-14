import { messages, replyTo, siteUrl } from './messages.mjs';

export function emailLocale(value) {
  // Only explicit language codes are accepted; do not infer from names or emails.
  if (value === 'ua') return 'uk';
  return ['pl', 'en', 'uk', 'zh'].includes(value) ? value : 'pl';
}

const escapeHtml = value => value.replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

// Pure renderer: no mail is sent here. Auth owns the token-bearing URLs.
export function renderEmail(kind, language) {
  if (!['welcome', 'recovery', 'password_changed'].includes(kind)) throw new Error('Unknown email kind');
  const locale = emailLocale(language);
  const copy = messages[locale];
  const msg = copy[kind];
  const url = kind === 'recovery' ? '{{ .ConfirmationURL }}' : kind === 'password_changed' ? '{{ .SiteURL }}' : siteUrl;
  const button = msg.button || copy.open;
  const closing = kind === 'welcome' ? [msg.farewell, msg.signature, msg.reply] : [copy.team];
  const text = [msg.subject, copy.greeting, ...msg.paragraphs, ...closing, `${button}: ${url}`, msg.footer].join('\n\n');
  const html = `<!doctype html>
<html lang="${locale === 'zh' ? 'zh-Hans' : locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(msg.subject)}</title></head>
<body style="margin:0;padding:0;background:#f2f5f3;color:#182a24;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(msg.preview)}</div>
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff;">
<tr><td style="padding:28px 24px;background:#183f32;color:#fff;font-size:24px;font-weight:bold;">PeakGuide</td></tr>
<tr><td style="padding:28px 24px;font-size:16px;line-height:1.6;">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;">${escapeHtml(msg.subject)}</h1>
${[copy.greeting, ...msg.paragraphs, ...closing].map(p => `<p>${escapeHtml(p)}</p>`).join('\n')}
<p style="margin:28px 0;"><a href="${url}" style="display:inline-block;padding:14px 22px;background:#246547;color:#fff;text-decoration:none;font-weight:bold;border-radius:6px;">${escapeHtml(button)}</a></p>
<p style="font-size:14px;color:#475b51;">${escapeHtml(msg.footer)}</p>
${kind === 'recovery' ? `<p style="font-size:13px;overflow-wrap:anywhere;">${escapeHtml(copy.fallbackLink)}<br><a href="${url}">${url}</a></p>` : ''}
</td></tr></table></td></tr></table>
</body></html>
`;
  return { locale, subject: msg.subject, html, text, ...(kind === 'welcome' ? { replyTo } : {}) };
}

// printf handles absent or non-string metadata without a template type error.
// Metadata selects copy only; it must never be used as an authorization check.
export function nativeTemplate(kind, field = 'html') {
  if (field === 'subject') {
    // Supabase validates the SOURCE template against 255 UTF-16 code units,
    // before rendering. Keep the shared brand outside the language branches.
    const prefix = 'PeakGuide — ';
    const suffix = locale => {
      const subject = renderEmail(kind, locale).subject;
      if (!subject.startsWith(prefix)) throw new Error('Subject must start with the shared brand');
      return subject.slice(prefix.length);
    };
    return '{{$l:=printf "%v" .Data.locale}}' + prefix
      + '{{if eq $l "en"}}' + suffix('en')
      + '{{else if or (eq $l "uk") (eq $l "ua")}}' + suffix('uk')
      + '{{else if eq $l "zh"}}' + suffix('zh')
      + '{{else}}' + suffix('pl') + '{{end}}';
  }
  return '{{ $locale := printf "%v" .Data.locale }}\n'
    + '{{ if eq $locale "en" }}' + renderEmail(kind, 'en')[field]
    + '{{ else if or (eq $locale "uk") (eq $locale "ua") }}' + renderEmail(kind, 'uk')[field]
    + '{{ else if eq $locale "zh" }}' + renderEmail(kind, 'zh')[field]
    + '{{ else }}' + renderEmail(kind, 'pl')[field] + '{{ end }}';
}
