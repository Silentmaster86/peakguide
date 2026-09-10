import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import TrailPracticalCard from './TrailPracticalCard';

const { fromMock } = vi.hoisted(() => ({
	fromMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
	supabase: {
		from: fromMock,
	},
}));

const languages = ['pl', 'en', 'ua', 'zh'];

function makeAccess() {
	return {
		id: 1,
		address: 'Victoria Terrace, Llanberis',
		google_maps_url:
			'https://www.google.com/maps/search/?api=1&query=Victoria+Terrace',
		source_url: 'https://eryri.gov.wales/walk/llanberis-path/',
		last_verified_at: '2026-09-10T12:00:00Z',
		trail_access_i18n: languages.map((lang) => ({
			lang,
			directions: `directions-${lang}`,
			warnings: `warnings-${lang}`,
		})),
	};
}

function makeParking() {
	return {
		id: 2,
		is_primary: true,
		paid: true,
		toilets: null,
		overnight_allowed: false,
		map_url:
			'https://www.google.com/maps/search/?api=1&query=53.117777,-4.116264',
		source_url: 'https://parcpadarn.cymru/plan-your-visit/',
		last_verified_at: '2026-09-10T12:00:00Z',
		trail_parking_i18n: languages.map((lang) => ({
			lang,
			name: `parking-${lang}`,
			description: `description-${lang}`,
			fee_info: `fee-${lang}`,
			notes: `notes-${lang}`,
		})),
	};
}

// Imituje łańcuch zapytania Supabase, bez połączenia z bazą.
function mockDatabase({
	access = makeAccess(),
	parking = [makeParking()],
	error = null,
} = {}) {
	fromMock.mockImplementation((table) => {
		const result = {
			data: table === 'trail_access' ? access : parking,
			error,
		};

		const query = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn(() => Promise.resolve(result)),
			then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
		};

		return query;
	});
}

beforeEach(() => {
	fromMock.mockReset();
	mockDatabase();
});

afterEach(() => {
	cleanup();
});

describe('TrailPracticalCard', () => {
	it.each(languages)('pokazuje właściwe tłumaczenie: %s', async (lang) => {
		render(<TrailPracticalCard trailId={6} lang={lang} />);

		expect(await screen.findByText(`directions-${lang}`)).toBeInTheDocument();

		expect(screen.getByText(`warnings-${lang}`)).toBeInTheDocument();
		expect(screen.getByText(`fee-${lang}`)).toBeInTheDocument();
		expect(screen.getByText(`notes-${lang}`)).toBeInTheDocument();

		for (const other of languages.filter((value) => value !== lang)) {
			expect(screen.queryByText(`directions-${other}`)).not.toBeInTheDocument();

			expect(screen.queryByText(`fee-${other}`)).not.toBeInTheDocument();
		}
	});

	it('pokazuje ładowanie podczas oczekiwania na bazę', () => {
		fromMock.mockImplementation(() => {
			const pending = new Promise(() => {});

			return {
				select() {
					return this;
				},
				eq() {
					return this;
				},
				order() {
					return this;
				},
				maybeSingle() {
					return pending;
				},
				then(resolve, reject) {
					return pending.then(resolve, reject);
				},
			};
		});

		render(<TrailPracticalCard trailId={6} lang='pl' />);

		expect(screen.getByRole('status')).toHaveTextContent(
			'Ładowanie informacji praktycznych',
		);
	});

	it('pokazuje komunikat przy braku danych', async () => {
		mockDatabase({ access: null, parking: [] });

		render(<TrailPracticalCard trailId={6} lang='pl' />);

		expect(
			await screen.findByText(
				'Informacje praktyczne nie zostały jeszcze dodane.',
			),
		).toBeInTheDocument();
	});

	it('nie zastępuje brakującego tłumaczenia innym językiem', async () => {
		const access = makeAccess();
		access.trail_access_i18n = access.trail_access_i18n.filter(
			(item) => item.lang === 'pl',
		);

		mockDatabase({ access, parking: [] });

		render(<TrailPracticalCard trailId={6} lang='en' />);

		expect(
			await screen.findAllByText(
				'Information in this language has not been added yet.',
			),
		).toHaveLength(2);

		expect(screen.queryByText('directions-pl')).not.toBeInTheDocument();
		expect(screen.queryByText('warnings-pl')).not.toBeInTheDocument();
	});

	it('odróżnia brak potwierdzenia od wartości nie', async () => {
		render(<TrailPracticalCard trailId={6} lang='pl' />);

		expect(
			await screen.findByText('Toalety: Brak potwierdzonych danych'),
		).toBeInTheDocument();

		expect(screen.getByText('Parkowanie nocą: Nie')).toBeInTheDocument();
		expect(screen.getByText('Parking płatny: Tak')).toBeInTheDocument();
	});

	it('zachowuje osobne linki startu i parkingu', async () => {
		render(<TrailPracticalCard trailId={6} lang='en' />);

		const links = await screen.findAllByRole('link', {
			name: 'Open map',
		});

		expect(links).toHaveLength(2);
		expect(links.map((link) => link.getAttribute('href'))).toEqual([
			makeAccess().google_maps_url,
			makeParking().map_url,
		]);

		for (const link of screen.getAllByRole('link')) {
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		}
	});

	it('nie renderuje niebezpiecznych linków', async () => {
		const access = makeAccess();
		access.google_maps_url = 'javascript:alert(1)';
		access.source_url = 'data:text/html,test';

		mockDatabase({ access, parking: [] });

		render(<TrailPracticalCard trailId={6} lang='en' />);

		await screen.findByText('directions-en');

		expect(screen.queryAllByRole('link')).toHaveLength(0);
		expect(screen.getByText('Source: Not confirmed')).toBeInTheDocument();
	});

	it('pokazuje źródła i daty weryfikacji', async () => {
		render(<TrailPracticalCard trailId={6} lang='en' />);

		const sources = await screen.findAllByRole('link', {
			name: 'Source',
		});

		expect(sources.map((link) => link.getAttribute('href'))).toEqual([
			makeAccess().source_url,
			makeParking().source_url,
		]);

		const dates = screen.getAllByText(/^Verified:/);
		expect(dates).toHaveLength(2);

		for (const date of dates) {
			expect(date).toHaveTextContent('2026');
			expect(date).not.toHaveTextContent('Not confirmed');
		}
	});

	it('nie wymyśla daty przy brakującej lub błędnej wartości', async () => {
		const access = makeAccess();
		const parking = makeParking();
		access.last_verified_at = null;
		parking.last_verified_at = 'invalid-date';

		mockDatabase({ access, parking: [parking] });

		render(<TrailPracticalCard trailId={6} lang='en' />);

		expect(await screen.findAllByText('Verified: Not confirmed')).toHaveLength(
			2,
		);
	});

	it('po błędzie pozwala ponowić pobieranie', async () => {
		const user = userEvent.setup();
		mockDatabase({ error: { message: 'Network error' } });

		render(<TrailPracticalCard trailId={6} lang='en' />);

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Could not load practical information.');

		mockDatabase();

		await user.click(within(alert).getByRole('button', { name: 'Try again' }));

		expect(await screen.findByText('directions-en')).toBeInTheDocument();

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('aktualizuje treść po zmianie języka', async () => {
		const { rerender } = render(<TrailPracticalCard trailId={6} lang='pl' />);

		await screen.findByText('directions-pl');

		rerender(<TrailPracticalCard trailId={6} lang='ua' />);

		expect(await screen.findByText('directions-ua')).toBeInTheDocument();

		expect(screen.queryByText('directions-pl')).not.toBeInTheDocument();
	});
});
