const labels = {
  pl: {
    forgot: 'Nie pamiętam hasła', request: 'Wyślij link do zmiany hasła',
    reset: 'Ustaw nowe hasło', email: 'E-mail', password: 'Nowe hasło',
    confirm: 'Powtórz hasło', save: 'Zapisz hasło', loading: 'Ładowanie…',
    sent: 'Jeśli istnieje konto z tym adresem, otrzymasz wiadomość z linkiem do zmiany hasła.',
    invalid: 'Link jest nieprawidłowy lub wygasł. Poproś o nowy link.',
    mismatch: 'Hasła muszą być takie same i mieć co najmniej 6 znaków.',
    done: 'Hasło zostało zmienione.', login: 'Przejdź do logowania', panel: 'Przejdź do panelu',
    logoutFailed: 'Nie udało się wylogować. Spróbuj ponownie.',
  },
  en: {
    forgot: 'Forgot password', request: 'Send password reset link',
    reset: 'Set a new password', email: 'Email', password: 'New password',
    confirm: 'Confirm password', save: 'Save password', loading: 'Loading…',
    sent: 'If an account exists for this email, you will receive a password reset link.',
    invalid: 'This link is invalid or expired. Request a new link.',
    mismatch: 'Passwords must match and contain at least 6 characters.',
    done: 'Your password has been changed.', login: 'Go to sign in', panel: 'Go to your panel',
    logoutFailed: 'Could not sign out. Please try again.',
  },
  ua: {
    forgot: 'Забули пароль?', request: 'Надіслати посилання для зміни пароля',
    reset: 'Установити новий пароль', email: 'Електронна пошта', password: 'Новий пароль',
    confirm: 'Повторіть пароль', save: 'Зберегти пароль', loading: 'Завантаження…',
    sent: 'Якщо обліковий запис із цією адресою існує, ви отримаєте посилання для зміни пароля.',
    invalid: 'Посилання недійсне або прострочене. Запросіть нове.',
    mismatch: 'Паролі мають збігатися і містити щонайменше 6 символів.',
    done: 'Пароль змінено.', login: 'Перейти до входу', panel: 'Перейти до панелі',
    logoutFailed: 'Не вдалося вийти. Спробуйте ще раз.',
  },
  zh: {
    forgot: '忘记密码', request: '发送密码重置链接',
    reset: '设置新密码', email: '邮箱', password: '新密码',
    confirm: '确认密码', save: '保存密码', loading: '加载中…',
    sent: '如果此邮箱对应的账户存在，您将收到密码重置链接。',
    invalid: '链接无效或已过期，请重新申请。',
    mismatch: '两次输入的密码必须相同，且至少包含6个字符。',
    done: '密码已更改。', login: '前往登录', panel: '前往个人面板',
    logoutFailed: '无法退出登录，请重试。',
  },
};

export function accountLabels(lang) { return labels[lang] || labels.pl; }
