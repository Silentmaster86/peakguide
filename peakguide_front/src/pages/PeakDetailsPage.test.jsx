import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PeakDetailsPage from './PeakDetailsPage';

vi.mock('../api/peakguide', () => ({
  fetchPeakBySlug: vi.fn().mockResolvedValue({
    id: 1,
    slug: 'test-peak',
    name: 'Test Peak',
    elevation_m: 1000,
    latitude: null,
    longitude: null,
    description: 'Test description',
    country_code: 'GB',
  }),
  fetchPeakTrailsBySlug: vi.fn().mockResolvedValue([]),
  fetchPeakPoisBySlug: vi.fn().mockResolvedValue([]),
  fetchNearbyPeaksBySlug: vi.fn().mockResolvedValue([]),
}));

vi.mock('../seo/SEO', () => ({
  PeakSEO: () => null,
}));

vi.mock('../hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

vi.mock('../components/PeakMap', () => ({
  default: () => null,
}));

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderPage(initialUrl = '/peaks/test-peak') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <LocationDisplay />
      <Routes>
        <Route path="/peaks/:slug" element={<PeakDetailsPage lang="en" />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PeakDetailsPage navigation', () => {
  it('changes tabs and keeps the URL in sync', async () => {
    const user = userEvent.setup();
    renderPage();

    const overview = await screen.findByRole('button', {
      name: 'Overview',
    });
    const trails = screen.getByRole('button', {
      name: /Trails/,
    });
    const pois = screen.getByRole('button', {
      name: /Points \(POI\)/,
    });

    expect(overview).toHaveAttribute('aria-pressed', 'true');
    expect(trails).toHaveAttribute('aria-pressed', 'false');

    await user.click(trails);

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/peaks/test-peak?tab=trails');
    });

    expect(trails).toHaveAttribute('aria-pressed', 'true');
    expect(overview).toHaveAttribute('aria-pressed', 'false');

    await user.click(pois);

    expect(screen.getByTestId('location')).toHaveTextContent('/peaks/test-peak?tab=pois');
    expect(pois).toHaveAttribute('aria-pressed', 'true');

    await user.click(overview);

    expect(screen.getByTestId('location')).toHaveTextContent('/peaks/test-peak');
    expect(overview).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the correct tab from a direct URL', async () => {
    renderPage('/peaks/test-peak?tab=trails');

    const trails = await screen.findByRole('button', {
      name: /Trails/,
    });

    expect(trails).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('location')).toHaveTextContent('?tab=trails');
  });
});
