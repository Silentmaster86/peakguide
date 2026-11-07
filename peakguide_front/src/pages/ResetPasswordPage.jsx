import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Field, TextInput, PrimaryBtn } from '../components/AuthFormBits';
import { updatePassword } from '../api/auth';
import { useAuth } from '../auth/useAuth';
import { accountLabels } from '../i18n/account';
import { authErrorMessage } from '../utils/authErrors';

export default function ResetPasswordPage({ lang = 'pl' }) {
  const t = accountLabels(lang);
  const { status, finishRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  async function submit(event) {
    event.preventDefault();
    if (busy || status !== 'authed') return;
    if (password.length < 6 || password !== confirmation) { setError(t.mismatch); return; }
    setBusy(true);
    setError(null);
    try {
      await updatePassword(password);
      finishRecovery();
      setPassword('');
      setConfirmation('');
      setDone(true);
    } catch (failure) {
      setError(authErrorMessage(failure, lang));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthShell title={t.reset} error={error}>
      {status === 'loading' ? <p role='status'>{t.loading}</p> : status !== 'authed' ? (
        <><p role='alert'>{t.invalid}</p><Link to='/forgot-password'>{t.request}</Link></>
      ) : done ? <><p role='status'>{t.done}</p><Link to='/panel'>{t.panel}</Link></> : (
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <Field label={t.password}>
            <TextInput type='password' autoComplete='new-password' minLength={6} required
              value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} />
          </Field>
          <Field label={t.confirm}>
            <TextInput type='password' autoComplete='new-password' minLength={6} required
              value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} />
          </Field>
          <PrimaryBtn type='submit' disabled={busy}>{t.save}</PrimaryBtn>
        </form>
      )}
    </AuthShell>
  );
}
