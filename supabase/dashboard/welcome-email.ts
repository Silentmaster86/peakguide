// @ts-nocheck
// GENERATED: node scripts/build_welcome_dashboard.mjs
// Paste this entire file into Supabase Dashboard as index.ts.
// Function name: welcome-email. Verify JWT with legacy secret: OFF.
// Source modules are type-checked separately; this bundle contains no secrets.

// supabase/functions/welcome-email/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.107.0";
import nodemailer from "npm:nodemailer@10.4.0";

// supabase/templates/account-emails/messages.mjs
var replyTo = "przemyslaw.pietkun@gmail.com";
var siteUrl = "https://peak-guide.netlify.app";
var messages = {
  pl: {
    greeting: "Cześć!",
    open: "Otwórz PeakGuide",
    team: "Zespół PeakGuide",
    fallbackLink: "Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:",
    welcome: {
      subject: "Witaj w PeakGuide!",
      preview: "Dziękuję za dołączenie do PeakGuide!",
      paragraphs: [
        "Dziękuję, że zakładasz konto i tworzysz swój profil w PeakGuide. Cieszę się, że dołączasz do mojego projektu!",
        "Jako twórca PeakGuide chciałbym Cię serdecznie powitać. Mam nadzieję, że znajdziesz tutaj informacje, których szukasz, oraz inspirację do kolejnych górskich wypraw.",
        "Życzę Ci przyjemnego korzystania ze strony i wielu udanych wędrówek."
      ],
      farewell: "Do zobaczenia na szlaku!",
      signature: "Przemysław — twórca PeakGuide",
      reply: "Chcesz się ze mną skontaktować? Możesz odpowiedzieć bezpośrednio na tę wiadomość.",
      footer: "Wiadomość wysłana automatycznie po utworzeniu konta w PeakGuide. Jeśli to nie Ty zakładasz konto, możesz zignorować tę wiadomość."
    },
    recovery: {
      subject: "PeakGuide — ustaw nowe hasło",
      preview: "Otrzymaliśmy prośbę o zmianę hasła do Twojego konta.",
      paragraphs: ["Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta PeakGuide. Aby ustawić nowe hasło, użyj przycisku poniżej.", "Link jest jednorazowy. Jeśli wygaśnie, poproś o nowy na stronie logowania."],
      button: "Ustaw nowe hasło",
      footer: "Jeśli to nie Ty wysyłasz tę prośbę, zignoruj wiadomość. Samo jej otrzymanie nie zmienia hasła."
    },
    password_changed: {
      subject: "PeakGuide — Twoje hasło zostało zmienione",
      preview: "Zmiana hasła do Twojego konta została zakończona.",
      paragraphs: ["Hasło do Twojego konta PeakGuide zostało zmienione. Od teraz do logowania używaj nowego hasła — poprzednie nie będzie już działać.", "Jeśli to Ty zmieniasz hasło, nie musisz nic więcej robić.", "Jeśli to nie Twoja zmiana: otwórz samodzielnie PeakGuide i skorzystaj z opcji „Nie pamiętasz hasła?”, aby odzyskać kontrolę nad kontem. Sprawdź również zabezpieczenia swojej skrzynki e-mail."],
      footer: "To automatyczne powiadomienie dotyczące bezpieczeństwa konta. Nigdy nie przesyłaj nikomu swojego hasła."
    }
  },
  en: {
    greeting: "Hi!",
    open: "Open PeakGuide",
    team: "The PeakGuide team",
    fallbackLink: "If the button does not work, copy this address into your browser:",
    welcome: {
      subject: "Welcome to PeakGuide!",
      preview: "Thank you for joining PeakGuide!",
      paragraphs: ["Thank you for creating your account and profile on PeakGuide. I’m glad you’ve joined my project!", "As the creator of PeakGuide, I’d like to give you a warm welcome. I hope you find the information you’re looking for and inspiration for your next mountain adventures.", "Enjoy exploring the site, and I wish you many wonderful hikes."],
      farewell: "See you on the trail!",
      signature: "Przemysław — creator of PeakGuide",
      reply: "Would you like to get in touch? You can reply directly to this email.",
      footer: "This email was sent automatically after a PeakGuide account was created. If you did not create this account, you can ignore this message."
    },
    recovery: {
      subject: "PeakGuide — reset your password",
      preview: "We received a request to reset your account password.",
      paragraphs: ["We received a request to reset the password for your PeakGuide account. Use the button below to set a new password.", "This link can only be used once. If it expires, request a new one from the sign-in page."],
      button: "Set a new password",
      footer: "If you did not request this, ignore this email. Receiving it does not change your password."
    },
    password_changed: {
      subject: "PeakGuide — your password has been changed",
      preview: "Your account password has been changed successfully.",
      paragraphs: ["The password for your PeakGuide account has been changed. Use your new password to sign in — your previous password will no longer work.", "If you made this change, you do not need to do anything else.", "If you did not make this change, open PeakGuide yourself and use “Forgot your password?” to regain control of your account. Check the security of your email account as well."],
      footer: "This is an automated account security notification. Never send your password to anyone."
    }
  },
  uk: {
    greeting: "Привіт!",
    open: "Відкрити PeakGuide",
    team: "Команда PeakGuide",
    fallbackLink: "Якщо кнопка не працює, скопіюйте цю адресу в браузер:",
    welcome: {
      subject: "Ласкаво просимо до PeakGuide!",
      preview: "Дякую, що приєдналися до PeakGuide!",
      paragraphs: ["Дякую, що створили обліковий запис і свій профіль у PeakGuide. Радий, що ви приєдналися до мого проєкту!", "Як творець PeakGuide, хочу щиро вас привітати. Сподіваюся, ви знайдете тут потрібну інформацію та натхнення для наступних гірських мандрівок.", "Бажаю приємного користування сайтом і багатьох чудових походів."],
      farewell: "До зустрічі на стежці!",
      signature: "Przemysław — творець PeakGuide",
      reply: "Хочете зв’язатися зі мною? Просто дайте відповідь на цей лист.",
      footer: "Цей лист надіслано автоматично після створення облікового запису в PeakGuide. Якщо ви не створювали цей обліковий запис, можете проігнорувати лист."
    },
    recovery: {
      subject: "PeakGuide — установіть новий пароль",
      preview: "Ми отримали запит на скидання пароля вашого облікового запису.",
      paragraphs: ["Ми отримали запит на скидання пароля вашого облікового запису PeakGuide. Натисніть кнопку нижче, щоб установити новий пароль.", "Посилання можна використати лише один раз. Якщо термін його дії мине, запросіть нове на сторінці входу."],
      button: "Установити новий пароль",
      footer: "Якщо ви не надсилали цей запит, проігноруйте лист. Саме отримання цього листа не змінює ваш пароль."
    },
    password_changed: {
      subject: "PeakGuide — ваш пароль змінено",
      preview: "Пароль вашого облікового запису успішно змінено.",
      paragraphs: ["Пароль вашого облікового запису PeakGuide змінено. Відтепер використовуйте новий пароль для входу — попередній більше не працюватиме.", "Якщо ви самі змінили пароль, більше нічого робити не потрібно.", "Якщо це зробили не ви, самостійно відкрийте PeakGuide та скористайтеся функцією «Забули пароль?», щоб відновити контроль над обліковим записом. Також перевірте безпеку своєї електронної пошти."],
      footer: "Це автоматичне сповіщення про безпеку облікового запису. Ніколи нікому не надсилайте свій пароль."
    }
  },
  zh: {
    greeting: "你好！",
    open: "打开 PeakGuide",
    team: "PeakGuide 团队",
    fallbackLink: "如果按钮无法使用，请将以下地址复制到浏览器中：",
    welcome: {
      subject: "欢迎加入 PeakGuide！",
      preview: "感谢你加入 PeakGuide！",
      paragraphs: ["感谢你在 PeakGuide 注册账号并创建个人资料。很高兴你加入我的项目！", "作为 PeakGuide 的创建者，我想向你表示热烈欢迎。希望你能在这里找到所需的信息，并为下一次山野之行获得灵感。", "祝你使用愉快，也祝你每一次徒步都收获美好的回忆。"],
      farewell: "山路上见！",
      signature: "Przemysław — PeakGuide 创建者",
      reply: "想与我联系吗？你可以直接回复这封邮件。",
      footer: "这封邮件是在 PeakGuide 账号创建后自动发送的。如果你没有创建此账号，请忽略这封邮件。"
    },
    recovery: {
      subject: "PeakGuide — 重设密码",
      preview: "我们收到了重设你的账号密码的请求。",
      paragraphs: ["我们收到了重设你的 PeakGuide 账号密码的请求。请点击下方按钮设置新密码。", "此链接只能使用一次。如果链接已过期，请在登录页面重新申请。"],
      button: "设置新密码",
      footer: "如果你没有发起此请求，请忽略这封邮件。收到这封邮件并不会更改你的密码。"
    },
    password_changed: {
      subject: "PeakGuide — 你的密码已更改",
      preview: "你的账号密码已成功更改。",
      paragraphs: ["你的 PeakGuide 账号密码已更改。请使用新密码登录，旧密码将不再有效。", "如果这是你本人的操作，则无需采取其他措施。", "如果这不是你本人的操作，请自行打开 PeakGuide，通过“忘记密码？”功能重新获得账号的控制权。同时，请检查你的电子邮箱账号的安全设置。"],
      footer: "这是一封自动发送的账号安全通知。请勿向任何人发送你的密码。"
    }
  }
};

// supabase/templates/account-emails/render.mjs
function emailLocale(value) {
  if (value === "ua") return "uk";
  return ["pl", "en", "uk", "zh"].includes(value) ? value : "pl";
}
var escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
})[c]);
function renderEmail(kind, language) {
  if (!["welcome", "recovery", "password_changed"].includes(kind)) throw new Error("Unknown email kind");
  const locale = emailLocale(language);
  const copy = messages[locale];
  const msg = copy[kind];
  const url2 = kind === "recovery" ? "{{ .ConfirmationURL }}" : kind === "password_changed" ? "{{ .SiteURL }}" : siteUrl;
  const button = msg.button || copy.open;
  const closing = kind === "welcome" ? [msg.farewell, msg.signature, msg.reply] : [copy.team];
  const text = [msg.subject, copy.greeting, ...msg.paragraphs, ...closing, `${button}: ${url2}`, msg.footer].join("\n\n");
  const html = `<!doctype html>
<html lang="${locale === "zh" ? "zh-Hans" : locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(msg.subject)}</title></head>
<body style="margin:0;padding:0;background:#f2f5f3;color:#182a24;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(msg.preview)}</div>
<table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background:#fff;">
<tr><td style="padding:28px 24px;background:#183f32;color:#fff;font-size:24px;font-weight:bold;">PeakGuide</td></tr>
<tr><td style="padding:28px 24px;font-size:16px;line-height:1.6;">
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;">${escapeHtml(msg.subject)}</h1>
${[copy.greeting, ...msg.paragraphs, ...closing].map((p) => `<p>${escapeHtml(p)}</p>`).join("\n")}
<p style="margin:28px 0;"><a href="${url2}" style="display:inline-block;padding:14px 22px;background:#246547;color:#fff;text-decoration:none;font-weight:bold;border-radius:6px;">${escapeHtml(button)}</a></p>
<p style="font-size:14px;color:#475b51;">${escapeHtml(msg.footer)}</p>
${kind === "recovery" ? `<p style="font-size:13px;overflow-wrap:anywhere;">${escapeHtml(copy.fallbackLink)}<br><a href="${url2}">${url2}</a></p>` : ""}
</td></tr></table></td></tr></table>
</body></html>
`;
  return { locale, subject: msg.subject, html, text, ...kind === "welcome" ? { replyTo } : {} };
}

// supabase/functions/welcome-email/handler.mjs
var json = (status, value) => new Response(JSON.stringify(value), {
  status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
});
async function sameSecret(actual, expected) {
  const encode = new TextEncoder();
  const [a, b] = await Promise.all([actual, expected].map((value) => crypto.subtle.digest("SHA-256", encode.encode(value))));
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}
function smtpFailureOutcome(error) {
  if (Number.isInteger(error?.responseCode) && error.responseCode >= 400 && error.responseCode < 500) return "retry";
  if (Number.isInteger(error?.responseCode) && error.responseCode >= 500 && error.responseCode < 600) return "failed";
  return "uncertain";
}
function createWelcomeEmailHandler({ secret: secret2, enabled: enabled2, getClient, sendMail: sendMail2 }) {
  return async (request) => {
    if (request.method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
    if (!secret2 || secret2.length < 32) return json(503, { error: "NOT_CONFIGURED" });
    const supplied = request.headers.get("x-welcome-secret") || "";
    if (supplied.length > 512 || !await sameSecret(supplied, secret2)) return json(401, { error: "UNAUTHORIZED" });
    if (!enabled2) return json(200, { status: "paused" });
    let client, job;
    try {
      client = getClient();
      const result = await client.rpc("claim_welcome_email");
      if (result.error) throw result.error;
      job = result.data?.[0];
    } catch {
      return json(503, { error: "QUEUE_UNAVAILABLE" });
    }
    if (!job) return json(200, { status: "empty" });
    const finish = async (outcome) => {
      const { data, error } = await client.rpc("finish_welcome_email", {
        p_user_id: job.user_id,
        p_claim_token: job.claim_token,
        p_outcome: outcome
      });
      if (error || data !== true) throw new Error("Could not record outcome");
      return json(200, { status: outcome });
    };
    try {
      let lookup;
      try {
        lookup = await client.auth.admin.getUserById(job.user_id);
      } catch {
        return await finish("retry");
      }
      if (lookup.error) return await finish(lookup.error.status === 404 ? "cancelled" : "retry");
      const user = lookup.data?.user;
      if (!user || user.id !== job.user_id || !user.email_confirmed_at || user.is_anonymous || typeof user.email !== "string" || !/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(user.email)) {
        return await finish("cancelled");
      }
      const message = renderEmail("welcome", user.user_metadata?.locale);
      let outcome;
      try {
        await sendMail2({ to: user.email, ...message });
        outcome = "sent";
      } catch (error) {
        outcome = smtpFailureOutcome(error);
      }
      return await finish(outcome);
    } catch {
      return json(503, { error: "DELIVERY_STATE_UNAVAILABLE" });
    }
  };
}

// supabase/functions/welcome-email/gmail.mjs
function createGmailSender({ gmailUser, appPassword, createTransport }) {
  if (typeof gmailUser !== "string" || !/^[^\s<>@,;]+@gmail\.com$/i.test(gmailUser) || typeof appPassword !== "string" || !appPassword.trim()) throw new Error("Invalid Gmail configuration");
  const transport = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: appPassword.replace(/\s/g, "") },
    connectionTimeout: 1e4,
    greetingTimeout: 1e4,
    socketTimeout: 2e4,
    disableFileAccess: true,
    disableUrlAccess: true
  });
  return async ({ to, subject, html, text, replyTo: replyTo2 }) => {
    const result = await transport.sendMail({
      from: { name: "Przemysław — PeakGuide", address: gmailUser },
      to: [{ address: to }],
      replyTo: [{ address: replyTo2 }],
      subject,
      html,
      text
    });
    if (!result.accepted?.includes(to)) throw new Error("SMTP acceptance not confirmed");
  };
}

// supabase/functions/welcome-email/index.ts
var secret = Deno.env.get("WELCOME_WORKER_SECRET");
var url = Deno.env.get("SUPABASE_URL");
var serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
var enabled = Deno.env.get("WELCOME_EMAIL_ENABLED") === "true";
var sendMail;
try {
  sendMail = createGmailSender({
    gmailUser: Deno.env.get("GMAIL_USER"),
    appPassword: Deno.env.get("GMAIL_APP_PASSWORD"),
    createTransport: nodemailer.createTransport
  });
} catch {
}
var handler = createWelcomeEmailHandler({
  secret,
  enabled,
  getClient: () => createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  }),
  sendMail
});
Deno.serve((request) => {
  if (enabled && (!sendMail || !url || !serviceKey)) return new Response('{"error":"SMTP_NOT_CONFIGURED"}', {
    status: 503,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
  return handler(request);
});
