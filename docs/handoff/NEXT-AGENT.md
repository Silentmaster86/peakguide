# PeakGuide — przekazanie dalszych prac

Aktualizacja 14 listopada 2026. Repo: Silentmaster86/peakguide.
Produkcja: https://peak-guide.netlify.app/ — React/Vite + Supabase.
Frontend: peakguide_front. Języki UI/danych pl/en/ua/zh; poczta pl/en/uk/zh.

## Potwierdzone przez właściciela

- PR #1–#3 scalone: naprawy audytu, poczta powitalna, limit tematów Auth.
- Wdrożone admin-delete-user, migracje 011/012/013, welcome-email i harmonogram.
- Rejestracja, logowanie, usuwanie konta, reset i odrzucenie starego hasła działają.
- Dodanie/edycja/usunięcie kontrolnego szczytu działa.
- Powitania PL/EN, reset i powiadomienie Password changed działają.
- PR #4 scalony: osobne jasne kafelki FAQ/How, **oryginalne zdjęcie i krycie tła**.
  Właściciel potwierdził działanie. Nie wracać do wcześniejszego pomysłu
  rozjaśniania całej fotografii.

## Przygotowane teraz — sprawdź status PR przed dalszą pracą

1. **PR #5 — korekty katalogu.** Źródłowy przegląd aktualnych publicznych rekordów.
   Łyżka: 803 m i 49.642726,20.462113, opis Łyżki zamiast Łakowej. Stary slug
   zachowany. Osiem opisów Łyżki/Waligóry i dwadzieścia dopisków zakresu metryk tras.
   Dystans Kriváňa, suma podejść Hoverli i metryki Huangshan pozostają nieznane.
   docs/audit/2026-11-14 zawiera źródła, before/after, apply.sql i rollback.sql.
   **Merge nie uruchamia SQL. Produkcja nie została zmieniona.** Pakiet transakcyjny,
   blokady, warunki na stare wartości, idempotencja, ochrona przed konfliktem.
   Testy w izolowanym PostGIS oraz CI przeszły.
2. **PR #6 — panel PL/EN/UA/ZH i klawiatura.** Formularz szczytu, użytkownicy,
   wiadomości, daty, błędy, focus/Escape. Naprawiono też wyścig: opóźnione
   wyszukiwanie mogło przywrócić kolekcję po wyczyszczeniu filtrów.
   101 testów Vitest; Chromium desktop/mobile, Firefox i WebKit w CI.
   Atrapy API, żadnych zapisów do produkcji.
3. **PR #7 — utrzymanie.** Odczytowy supabase/operations/email_health.sql oraz
   docs/operations/remaining-work.md. Procedura odtworzenia backupu i zaległe testy.
4. **Gałąź perf/defer-home-route — optymalizacja.** Osobny PR bazujący na #6.
   HomePage lazy: katalog pobiera ~31 kB mniej JS, login ~48 kB mniej. Strona główna
   ma dodatkowy request i ~2,3 kB więcej gzip. Nie deklarować poprawy LCP/INP.
   docs/performance opisuje pomiar manifestu i test faktycznie pobieranych modułów.

## Kolejność wydania

1. Sprawdzić aktualny status CI i zakres PR #5–#7. Nie opierać się wyłącznie na tej
   karcie; user mógł już scalić lub wdrożyć część zmian.
2. Po przeglądzie #5: świeży backup, próba apply/rollback w izolacji, następnie
   uzgodnione wykonanie apply.sql w SQL Editor. Porównać mapę i cztery języki.
3. Scalić #6, sprawdzić Netlify i panel na kontrolowanym koncie właściciela.
4. Scalić dokumentację #7. Uruchomić email_health.sql i ocenić wyniki agregatów.
5. PR wydajności: po #6 zmienić bazę na main, sprawdzić CI i dopiero wydać.
   Nie scalać do gałęzi #6 po jej zamknięciu.

Właściciel dotąd wykonywał merge i operacje SQL sam. Nowy agent ma sprawdzić
aktualne polecenie i uprawnienia; ta karta sama nie upoważnia do zapisów produkcji.
Przygotować konkretne zmiany przed prośbą o zatwierdzenie. Podawać krótkie kroki
z linkiem do właściwego pliku; właściciel często używa telefonu.

## Nadal otwarte / granice weryfikacji

- Pełny backup produkcji nie został odtworzony. Właściciel ma dump z 9 listopada
  (997418 B), ale sprawdzono tylko pg_restore --list. Nie prosić o dane osobowe
  z dumpa w czacie ani nie dodawać go do repo. Potrzebne zgodne izolowane środowisko.
- Brak kompletnego bazowego schematu produkcji. Nie nazywać testowego fixture
  pełnym stagingiem. PostgreSQL/PostGIS w testach weryfikuje wskazane kontrakty.
- Kontrola rzeczywistych uprawnień wszystkich tabel, Storage i Edge Functions
  wymaga izolowanej kopii lub dostępu administracyjnego. Publiczne API nie wystarczy.
- Rzeczywisty odbiór powitań UK/ZH i przycisk Odpowiedz wymagają testu właściciela.
  SMTP sent nie dowodzi dostawy. Nie ponawiać uncertain automatycznie.
- clever-service: najpierw sprawdzić użycie/logi i zachować źródło. Nie usuwać
  funkcji tylko dlatego, że nie ma jej wywołania w repo.
- Braki tras są celowo null, gdy nie ma dostatecznego źródła. Wysokość Waligóry
  934/936 m wymaga osobnego rozstrzygnięcia. Pełnych 89 szczytów nie zweryfikowano.
- WebKit CI nie jest testem Safari na fizycznym iPhonie. Pełny audyt czytnikiem
  ekranu i wszystkie kombinacje stanów wymagają dalszej pracy.
- SEO: językowe URL/prerender to osobny projekt ze strategią przekierowań,
  canonical/hreflang i odświeżania danych. Nie zmieniać URL po cichu.
- Wydajność: nie zebrano reprezentatywnych terenowych LCP/CLS/INP.

## Narzędzia i testy

- npm ci; npm run check w peakguide_front.
- npm run test:e2e — Chromium; PLAYWRIGHT_CROSS_BROWSER=1 udostępnia projekty
  firefox/webkit. Lokalne Chromium: PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium.
- .github/workflows/quality.yml opisuje testy transakcji, poczty i przeglądarek.
- Testy katalogu: scripts/build_catalogue_patch.py --check oraz
  supabase/tests/catalogue_patch_integration.py (osobna baza catalogue_review_test).
- Preview Netlify może używać produkcyjnego API. Nie wykonywać tam zapisów
  w automatycznych testach; stosować atrapy API.
