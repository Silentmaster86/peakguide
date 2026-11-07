import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import AdminUsersSection from './AdminUsersSection';
import * as api from './api';
vi.mock('./api', () => ({ adminFetchUsers: vi.fn(), adminToggleAdmin: vi.fn(), adminDeleteUser: vi.fn() }));
vi.mock('../../hooks/useMedia', () => ({ useMedia: () => false }));
beforeEach(() => vi.resetAllMocks());
it('ends the loading state on failure and can retry', async () => {
  api.adminFetchUsers.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ items: [] });
  render(<AdminUsersSection />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
  expect(screen.queryByText('Loading users…')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(api.adminFetchUsers).toHaveBeenCalledTimes(2);
});
it('keeps the user visible and reports a role update failure', async () => {
  api.adminFetchUsers.mockResolvedValue({ items: [{ id: 'one', email: 'test@example.com', is_admin: false }] });
  api.adminToggleAdmin.mockRejectedValue(new Error('denied'));
  render(<AdminUsersSection />);
  await userEvent.click(await screen.findByRole('button', { name: 'Make admin' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
  expect(screen.getByText('test@example.com')).toBeVisible();
  expect(screen.queryByText('Active')).not.toBeInTheDocument();
});
