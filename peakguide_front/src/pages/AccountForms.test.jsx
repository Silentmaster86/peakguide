import { HelmetProvider } from 'react-helmet-async';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { useAuth } from '../auth/useAuth';
import { requestPasswordReset, updatePassword } from '../api/auth';
import RegisterPage from './RegisterPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import ResetPasswordPage from './ResetPasswordPage';
vi.mock('../auth/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../api/auth', () => ({ requestPasswordReset: vi.fn(), updatePassword: vi.fn() }));
const register = vi.fn();
const finishRecovery = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  useAuth.mockReturnValue({ status: 'guest', register, finishRecovery });
});
it('accepts a one-character name and explains email confirmation', async () => {
  register.mockResolvedValue({ requiresConfirmation: true });
  render(<HelmetProvider><MemoryRouter><RegisterPage lang='en' /></MemoryRouter></HelmetProvider>);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('First name'), '明');
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'test-password');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Check your email');
  expect(register).toHaveBeenCalledOnce();
});
it('shows a translated registration failure without leaking server details', async () => {
  register.mockRejectedValue(new Error('internal SQL error'));
  render(<HelmetProvider><MemoryRouter><RegisterPage lang='en' /></MemoryRouter></HelmetProvider>);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('First name'), 'Test');
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.type(screen.getByLabelText('Password'), 'test-password');
  await user.click(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByRole('alert')).not.toHaveTextContent('SQL');
});
it('does not reveal whether a reset email belongs to an account', async () => {
  requestPasswordReset.mockResolvedValue(undefined);
  render(<HelmetProvider><MemoryRouter><ForgotPasswordPage lang='en' /></MemoryRouter></HelmetProvider>);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Send password reset link' }));
  expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
});
it('rejects mismatched passwords before making an API call, then saves matching passwords', async () => {
  useAuth.mockReturnValue({ status: 'authed', finishRecovery });
  updatePassword.mockResolvedValue(undefined);
  render(<HelmetProvider><MemoryRouter><ResetPasswordPage lang='en' /></MemoryRouter></HelmetProvider>);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('New password'), 'test-password');
  await user.type(screen.getByLabelText('Confirm password'), 'different-password');
  await user.click(screen.getByRole('button', { name: 'Save password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Passwords must match');
  expect(updatePassword).not.toHaveBeenCalled();
  await user.clear(screen.getByLabelText('Confirm password'));
  await user.type(screen.getByLabelText('Confirm password'), 'test-password');
  await user.click(screen.getByRole('button', { name: 'Save password' }));
  expect(await screen.findByRole('status')).toHaveTextContent('password has been changed');
  expect(finishRecovery).toHaveBeenCalledOnce();
});
it('offers a new recovery link when no authenticated recovery session exists', () => {
  render(<HelmetProvider><MemoryRouter><ResetPasswordPage lang='en' /></MemoryRouter></HelmetProvider>);
  expect(screen.getByRole('alert')).toHaveTextContent('invalid or expired');
  expect(screen.getByRole('link', { name: 'Send password reset link' })).toHaveAttribute('href', '/forgot-password');
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
});
