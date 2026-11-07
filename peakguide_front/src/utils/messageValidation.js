export function messageValidation({ email, message }) {
  if (!/^\S+@\S+\.\S+$/.test(String(email || '').trim()) || String(email).length > 254) return 'emailError';
  const length = String(message || '').trim().length;
  if (length < 5 || length > 5000) return 'messageError';
  return null;
}
