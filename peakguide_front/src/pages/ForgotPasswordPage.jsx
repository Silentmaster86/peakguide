import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Field, TextInput, PrimaryBtn } from '../components/AuthFormBits';
import { requestPasswordReset } from '../api/auth';
import { accountLabels } from '../i18n/account';
import { authErrorMessage } from '../utils/authErrors';

export default function ForgotPasswordPage({ lang = 'pl' }) {
  const t = accountLabels(lang);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (failure) {
      setError(authErrorMessage(failure, lang));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell title={t.forgot} error={error} footer={<Link to='/login'>{t.login}</Link>}>
      {sent ? <p role='status'>{t.sent}</p> : (
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <Field label={t.email}>
            <TextInput type='email' autoComplete='email' required maxLength={254}
              value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
          </Field>
          <PrimaryBtn type='submit' disabled={busy}>{t.request}</PrimaryBtn>
        </form>
      )}
    </AuthShell>
  );
}
