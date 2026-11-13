// Copy shared by preview files, native Auth templates and the future welcome sender.
export const replyTo = 'przemyslaw.pietkun@gmail.com';
export const siteUrl = 'https://peak-guide.netlify.app';
export const messages = {
  pl: {
    greeting: 'Cześć!', open: 'Otwórz PeakGuide', team: 'Zespół PeakGuide',
    fallbackLink: 'Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:',
    welcome: {
      subject: 'Witaj w PeakGuide!', preview: 'Dziękuję za dołączenie do PeakGuide!',
      paragraphs: [
        'Dziękuję, że zakładasz konto i tworzysz swój profil w PeakGuide. Cieszę się, że dołączasz do mojego projektu!',
        'Jako twórca PeakGuide chciałbym Cię serdecznie powitać. Mam nadzieję, że znajdziesz tutaj informacje, których szukasz, oraz inspirację do kolejnych górskich wypraw.',
        'Życzę Ci przyjemnego korzystania ze strony i wielu udanych wędrówek.',
      ],
      farewell: 'Do zobaczenia na szlaku!', signature: 'Przemysław — twórca PeakGuide',
      reply: 'Chcesz się ze mną skontaktować? Możesz odpowiedzieć bezpośrednio na tę wiadomość.',
      footer: 'Wiadomość wysłana automatycznie po utworzeniu konta w PeakGuide. Jeśli to nie Ty zakładasz konto, możesz zignorować tę wiadomość.',
    },
    recovery: {
      subject: 'PeakGuide — ustaw nowe hasło', preview: 'Otrzymaliśmy prośbę o zmianę hasła do Twojego konta.',
      paragraphs: ['Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta PeakGuide. Aby ustawić nowe hasło, użyj przycisku poniżej.', 'Link jest jednorazowy. Jeśli wygaśnie, poproś o nowy na stronie logowania.'],
      button: 'Ustaw nowe hasło',
      footer: 'Jeśli to nie Ty wysyłasz tę prośbę, zignoruj wiadomość. Samo jej otrzymanie nie zmienia hasła.',
    },
    password_changed: {
      subject: 'PeakGuide — Twoje hasło zostało zmienione', preview: 'Zmiana hasła do Twojego konta została zakończona.',
      paragraphs: ['Hasło do Twojego konta PeakGuide zostało zmienione. Od teraz do logowania używaj nowego hasła — poprzednie nie będzie już działać.', 'Jeśli to Ty zmieniasz hasło, nie musisz nic więcej robić.', 'Jeśli to nie Twoja zmiana: otwórz samodzielnie PeakGuide i skorzystaj z opcji „Nie pamiętasz hasła?”, aby odzyskać kontrolę nad kontem. Sprawdź również zabezpieczenia swojej skrzynki e-mail.'],
      footer: 'To automatyczne powiadomienie dotyczące bezpieczeństwa konta. Nigdy nie przesyłaj nikomu swojego hasła.',
    },
  },
  en: {
    greeting: 'Hi!', open: 'Open PeakGuide', team: 'The PeakGuide team',
    fallbackLink: 'If the button does not work, copy this address into your browser:',
    welcome: {
      subject: 'Welcome to PeakGuide!', preview: 'Thank you for joining PeakGuide!',
      paragraphs: ['Thank you for creating your account and profile on PeakGuide. I’m glad you’ve joined my project!', 'As the creator of PeakGuide, I’d like to give you a warm welcome. I hope you find the information you’re looking for and inspiration for your next mountain adventures.', 'Enjoy exploring the site, and I wish you many wonderful hikes.'],
      farewell: 'See you on the trail!', signature: 'Przemysław — creator of PeakGuide',
      reply: 'Would you like to get in touch? You can reply directly to this email.',
      footer: 'This email was sent automatically after a PeakGuide account was created. If you did not create this account, you can ignore this message.',
    },
    recovery: {
      subject: 'PeakGuide — reset your password', preview: 'We received a request to reset your account password.',
      paragraphs: ['We received a request to reset the password for your PeakGuide account. Use the button below to set a new password.', 'This link can only be used once. If it expires, request a new one from the sign-in page.'],
      button: 'Set a new password',
      footer: 'If you did not request this, ignore this email. Receiving it does not change your password.',
    },
    password_changed: {
      subject: 'PeakGuide — your password has been changed', preview: 'Your account password has been changed successfully.',
      paragraphs: ['The password for your PeakGuide account has been changed. Use your new password to sign in — your previous password will no longer work.', 'If you made this change, you do not need to do anything else.', 'If you did not make this change, open PeakGuide yourself and use “Forgot your password?” to regain control of your account. Check the security of your email account as well.'],
      footer: 'This is an automated account security notification. Never send your password to anyone.',
    },
  },
  uk: {
    greeting: 'Привіт!', open: 'Відкрити PeakGuide', team: 'Команда PeakGuide',
    fallbackLink: 'Якщо кнопка не працює, скопіюйте цю адресу в браузер:',
    welcome: {
      subject: 'Ласкаво просимо до PeakGuide!', preview: 'Дякую, що приєдналися до PeakGuide!',
      paragraphs: ['Дякую, що створили обліковий запис і свій профіль у PeakGuide. Радий, що ви приєдналися до мого проєкту!', 'Як творець PeakGuide, хочу щиро вас привітати. Сподіваюся, ви знайдете тут потрібну інформацію та натхнення для наступних гірських мандрівок.', 'Бажаю приємного користування сайтом і багатьох чудових походів.'],
      farewell: 'До зустрічі на стежці!', signature: 'Przemysław — творець PeakGuide',
      reply: 'Хочете зв’язатися зі мною? Просто дайте відповідь на цей лист.',
      footer: 'Цей лист надіслано автоматично після створення облікового запису в PeakGuide. Якщо ви не створювали цей обліковий запис, можете проігнорувати лист.',
    },
    recovery: {
      subject: 'PeakGuide — установіть новий пароль', preview: 'Ми отримали запит на скидання пароля вашого облікового запису.',
      paragraphs: ['Ми отримали запит на скидання пароля вашого облікового запису PeakGuide. Натисніть кнопку нижче, щоб установити новий пароль.', 'Посилання можна використати лише один раз. Якщо термін його дії мине, запросіть нове на сторінці входу.'],
      button: 'Установити новий пароль',
      footer: 'Якщо ви не надсилали цей запит, проігноруйте лист. Саме отримання цього листа не змінює ваш пароль.',
    },
    password_changed: {
      subject: 'PeakGuide — ваш пароль змінено', preview: 'Пароль вашого облікового запису успішно змінено.',
      paragraphs: ['Пароль вашого облікового запису PeakGuide змінено. Відтепер використовуйте новий пароль для входу — попередній більше не працюватиме.', 'Якщо ви самі змінили пароль, більше нічого робити не потрібно.', 'Якщо це зробили не ви, самостійно відкрийте PeakGuide та скористайтеся функцією «Забули пароль?», щоб відновити контроль над обліковим записом. Також перевірте безпеку своєї електронної пошти.'],
      footer: 'Це автоматичне сповіщення про безпеку облікового запису. Ніколи нікому не надсилайте свій пароль.',
    },
  },
  zh: {
    greeting: '你好！', open: '打开 PeakGuide', team: 'PeakGuide 团队',
    fallbackLink: '如果按钮无法使用，请将以下地址复制到浏览器中：',
    welcome: {
      subject: '欢迎加入 PeakGuide！', preview: '感谢你加入 PeakGuide！',
      paragraphs: ['感谢你在 PeakGuide 注册账号并创建个人资料。很高兴你加入我的项目！', '作为 PeakGuide 的创建者，我想向你表示热烈欢迎。希望你能在这里找到所需的信息，并为下一次山野之行获得灵感。', '祝你使用愉快，也祝你每一次徒步都收获美好的回忆。'],
      farewell: '山路上见！', signature: 'Przemysław — PeakGuide 创建者',
      reply: '想与我联系吗？你可以直接回复这封邮件。',
      footer: '这封邮件是在 PeakGuide 账号创建后自动发送的。如果你没有创建此账号，请忽略这封邮件。',
    },
    recovery: {
      subject: 'PeakGuide — 重设密码', preview: '我们收到了重设你的账号密码的请求。',
      paragraphs: ['我们收到了重设你的 PeakGuide 账号密码的请求。请点击下方按钮设置新密码。', '此链接只能使用一次。如果链接已过期，请在登录页面重新申请。'],
      button: '设置新密码',
      footer: '如果你没有发起此请求，请忽略这封邮件。收到这封邮件并不会更改你的密码。',
    },
    password_changed: {
      subject: 'PeakGuide — 你的密码已更改', preview: '你的账号密码已成功更改。',
      paragraphs: ['你的 PeakGuide 账号密码已更改。请使用新密码登录，旧密码将不再有效。', '如果这是你本人的操作，则无需采取其他措施。', '如果这不是你本人的操作，请自行打开 PeakGuide，通过“忘记密码？”功能重新获得账号的控制权。同时，请检查你的电子邮箱账号的安全设置。'],
      footer: '这是一封自动发送的账号安全通知。请勿向任何人发送你的密码。',
    },
  },
};
