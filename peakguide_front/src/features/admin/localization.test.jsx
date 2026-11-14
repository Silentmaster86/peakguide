import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AdminPeaksSection from '../adminPeaks/AdminPeaksSection';
import AdminMessagesSection from '../adminMessages/AdminMessagesSection';
import AdminUsersSection from '../adminUsers/AdminUsersSection';
import { adminError, adminText } from './text';
import { adminFetchPeaks } from '../adminPeaks/api';
import { adminFetchMessages } from '../../api/messages';
import { adminFetchUsers } from '../adminUsers/api';
vi.mock('../adminPeaks/api', () => ({adminFetchPeaks: vi.fn(), adminCreatePeak: vi.fn(), adminUpdatePeak: vi.fn(), adminDeletePeak: vi.fn()}));
vi.mock('../../api/peakguide', () => ({fetchRanges: vi.fn(async()=>[]), fetchSubranges: vi.fn(async()=>[])}));
vi.mock('../../api/messages', () => ({adminFetchMessages: vi.fn(), adminDeleteMessage: vi.fn(), adminSetMessageStatus: vi.fn()}));
vi.mock('../adminUsers/api', () => ({adminFetchUsers: vi.fn(), adminToggleAdmin: vi.fn(), adminDeleteUser: vi.fn()}));
vi.mock('../../hooks/useMedia', () => ({useMedia:()=>false}));
beforeEach(()=> {
 vi.clearAllMocks();
 adminFetchPeaks.mockResolvedValue({items:[]});
 adminFetchMessages.mockResolvedValue({items:[]});
 adminFetchUsers.mockResolvedValue({items:[]});
});
afterEach(cleanup);
for (const [lang, title, name, missing] of [
 ['pl','Dodaj szczyt','Nazwa','Dodaj przynajmniej jedno tłumaczenie z nazwą.'],
 ['en','Add Peak','Name','Add at least one named translation.'],
 ['ua','Додати вершину','Назва','Додайте хоча б один переклад із назвою.'],
 ['zh','添加山峰','名称','请至少添加一个包含名称的翻译。'],
]) {
 it(`localizes the peak editor and validation in ${lang}`, async()=>{
  const t=adminText(lang);
  render(<AdminPeaksSection lang={lang}/>);
  await screen.findAllByText(t('No results'));
  await userEvent.click(screen.getByRole('button',{name:t('+ Add peak')}));
  expect(screen.getByRole('dialog',{name:title})).toBeVisible();
  expect(screen.getByRole('textbox',{name})).toBeVisible();
  expect(screen.getByRole('button',{name:t('Close')})).toBeVisible();
  expect(adminError(new Error('Add at least one named translation.'),lang)).toBe(missing);
  expect(adminError(new Error('Add a name for the ZH translation.'),lang)).toContain('ZH');
  expect(adminError(new Error('SQL backend detail'),lang)).toBe(t('Save failed'));
 });
 it(`localizes users and messages in ${lang}`, async()=>{
  const t=adminText(lang);
  adminFetchUsers.mockRejectedValue(new Error('private backend detail'));
  render(<><AdminUsersSection lang={lang}/><AdminMessagesSection lang={lang}/></>);
  expect(await screen.findByRole('alert')).toHaveTextContent(t('Could not load users. Please try again.'));
  expect(await screen.findByText(t('No messages.'))).toBeVisible();
  expect(screen.getByRole('button',{name:t('Archived')})).toBeVisible();
 });
}
it('updates an existing error when the UI language changes', async()=>{
 adminFetchUsers.mockRejectedValue(new Error('offline'));
 const {rerender}=render(<AdminUsersSection lang="en"/>);
 expect(await screen.findByRole('alert')).toHaveTextContent('Could not load users');
 rerender(<AdminUsersSection lang="pl"/>);
 expect(screen.getByRole('alert')).toHaveTextContent('Nie udało się wczytać użytkowników');
});
