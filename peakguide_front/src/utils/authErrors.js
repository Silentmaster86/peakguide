const messages = {
  pl: {
    invalid_credentials: 'Nieprawidłowy e-mail lub hasło.',
    email_not_confirmed: 'Potwierdź adres e-mail, korzystając z linku w otrzymanej wiadomości.',
    profile_unavailable: 'Nie udało się pobrać profilu. Spróbuj ponownie.',
    generic: 'Nie udało się wykonać operacji. Spróbuj ponownie.',
  },
  en: {
    invalid_credentials: 'Incorrect email or password.',
    email_not_confirmed: 'Confirm your email using the link in your inbox.',
    profile_unavailable: 'Could not load your profile. Please try again.',
    generic: 'Could not complete the operation. Please try again.',
  },
  ua: {
    invalid_credentials: 'Неправильна адреса електронної пошти або пароль.',
    email_not_confirmed: 'Підтвердьте електронну адресу за посиланням у листі.',
    profile_unavailable: 'Не вдалося завантажити профіль. Спробуйте ще раз.',
    generic: 'Не вдалося виконати дію. Спробуйте ще раз.',
  },
  zh: {
    invalid_credentials: '邮箱或密码不正确。',
    email_not_confirmed: '请通过邮件中的链接确认邮箱。',
    profile_unavailable: '无法加载个人资料，请重试。',
    generic: '无法完成操作，请重试。',
  },
};

export function authErrorMessage(error, lang = 'pl') {
  if (!error) return '';
  const labels = messages[lang] || messages.pl;
  return labels[error.code] || labels.generic;
}
