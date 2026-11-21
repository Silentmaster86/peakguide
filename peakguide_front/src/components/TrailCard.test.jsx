import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {expect, it} from 'vitest';
import TrailCard from './TrailCard';

const base = {
  name: 'Śnieżnik: od schroniska', slug: 'snieznik-trail', peak_slug: 'snieznik',
  peak_name: 'Śnieżnik', country_name: 'Polska', range_name: 'Masyw Śnieżnika',
  region_name: null, difficulty: null, route_type: 'point-to-point',
};
const show = (trail, lang='pl') => render(<MemoryRouter><TrailCard trail={trail} lang={lang}/></MemoryRouter>);

it.each(['pl','en','ua','zh'])('omits empty difficulty pills and missing location separators in %s', lang => {
  const {container} = show(base, lang);
  expect(screen.getByText('Polska · Masyw Śnieżnika')).toBeInTheDocument();
  expect([...container.querySelectorAll('span')].filter(node => !node.textContent.trim())).toHaveLength(0);
  expect(screen.getByRole('link')).toHaveAttribute('href','/peaks/snieznik?tab=trails&trail=snieznik-trail');
});

it('omits absent route type and location rather than displaying empty labels', () => {
  const {container} = show({...base, route_type:null, country_name:'', range_name:null});
  expect(screen.queryByText(/Trasa:/)).not.toBeInTheDocument();
  expect(container.textContent).not.toContain('·');
  expect([...container.querySelectorAll('p, span')].filter(node => !node.textContent.trim())).toHaveLength(0);
});

it('preserves supplied location, difficulty, route type and zero-valued metrics', () => {
  show({...base,region_name:'Dolny Śląsk',difficulty:'easy',distance_km:0,elevation_gain_m:0,time_min:60});
  expect(screen.getByText('Polska · Masyw Śnieżnika · Dolny Śląsk')).toBeInTheDocument();
  expect(screen.getByText('łatwa')).toBeInTheDocument();
  expect(screen.getByText(/Trasa: z punktu A do B/)).toBeInTheDocument();
  expect(screen.getByText(/0 km/)).toBeInTheDocument();
  expect(screen.getByText(/0 m suma podejść/)).toBeInTheDocument();
  expect(screen.getByText(/1 h/)).toBeInTheDocument();
});
