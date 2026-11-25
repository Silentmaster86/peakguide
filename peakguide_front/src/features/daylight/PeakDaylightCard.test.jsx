import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import PeakDaylightCard from './PeakDaylightCard';
import { daylightText } from './text';
it.each(['pl','en','ua','zh'])('calculates selected trip date and uses peak time zone in %s',lang=>{
  render(<PeakDaylightCard latitude={49.17} longitude={20.08} countryCode="PL" lang={lang}/>);
  const card=screen.getByRole('region',{name:daylightText[lang].title});
  const input=within(card).getByLabelText(daylightText[lang].date);
  fireEvent.change(input,{target:{value:'2026-06-21'}});
  expect(within(card).getByText('Europe/Warsaw')).toBeInTheDocument();
  expect(within(card).getByText(daylightText[lang].sunrise)).toBeInTheDocument();
  const times=card.querySelectorAll('time');
  expect(times).toHaveLength(4);
  expect(times[0].dateTime).toMatch(/^2026-06-21T/);
  expect(times[0].textContent).toMatch(/^\d{2}:\d{2}$/);
  const summerMinutes = Number(within(card).getByRole('meter').getAttribute('aria-valuenow'));
  fireEvent.change(input,{target:{value:'2026-12-21'}});
  expect(Number(within(card).getByRole('meter').getAttribute('aria-valuenow'))).toBeLessThan(summerMinutes);
  fireEvent.change(input,{target:{value:''}});
  expect(within(card).getByRole('status')).toHaveTextContent(daylightText[lang].invalid);
  fireEvent.click(within(card).getByRole('button',{name:daylightText[lang].today}));
  expect(card.querySelectorAll('time')).toHaveLength(4);
});
it('does not invent times for a missing location',()=>{
  render(<PeakDaylightCard latitude={null} longitude={null} lang="en"/>);
  expect(screen.getByText(daylightText.en.missing)).toBeInTheDocument();
  expect(document.querySelector('time')).toBeNull();
  expect(screen.queryByRole('meter')).not.toBeInTheDocument();
});
it('explains polar day and UTC fallback',()=>{
  render(<PeakDaylightCard latitude={78.2} longitude={15.6} lang="en"/>);
  fireEvent.change(screen.getByLabelText('Trip date'),{target:{value:'2026-06-21'}});
  expect(screen.getByText(daylightText.en.polarDay)).toBeInTheDocument();
  expect(screen.getByRole('region',{name:'Sunrise and sunset'})).toHaveTextContent(daylightText.en.utc);
  expect(document.querySelector('time')).toBeNull();
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow','1440');
  fireEvent.change(screen.getByLabelText('Trip date'),{target:{value:'2026-12-21'}});
  expect(screen.getByText(daylightText.en.polarNight)).toBeInTheDocument();
  expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow','0');
  expect(document.querySelector('time')).toBeNull();
});
it('shows the actual event date when UTC fallback crosses a calendar day',()=>{
  render(<PeakDaylightCard latitude={0} longitude={179} lang="en"/>);
  fireEvent.change(screen.getByLabelText('Trip date'),{target:{value:'2026-06-21'}});
  expect(document.querySelector('time').dateTime).toMatch(/^2026-06-20T/);
  expect(screen.getAllByText('20 Jun 2026').length).toBeGreaterThan(0);
});
