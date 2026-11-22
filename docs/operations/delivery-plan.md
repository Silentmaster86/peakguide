# Kolejne wydania PeakGuide — plan wykonawczy

Stan: 22 listopada 2026. Agent przygotowuje kod, backend, testy, dokumentację i PR-y.
Właściciel sprawdza i scala PR-y. Produkcyjne SQL/sekrety wymagają właściciela;
nie wykonywać ich w tle. Brak informacji właściciela nie oznacza zgody na merge.

## Zakończone — nie wykonywać ponownie

- KGP 28/28: POI, trasa z geometrią/GPX, karty dostępu, cztery języki.
- Parkingi KGP 25/28, poprawione współrzędne, UTF-8 i ukryty duplikat Łysicy.
- GPX Howerli i Krywania; owner verify potwierdza oba patche.
- PR #30 (404 i metadane) i #31 (ostrzeżenie Krywania) są scalone.
- Właściciel potwierdził `krivan-seasonal-01`: 4/4 warning_matches_review oraz
  patch_applied=true. Nie ponawiać SQL ani wcześniejszych importów.
- Konta/poczta przetestowane przez właściciela; kolejne audyty nie wysyłają maili.

## Kolejność i przekazanie

Numery oznaczają pozycje planu, nie numery GitHub. Budżet 24 PR-ów jest szacunkiem;
nie tworzyć pustych PR-ów i łączyć zadania, które mają wspólny zakres/testy.
Niezależne PR-y bazować na main. Zależne jawnie oznaczyć wraz z kolejnością merge.

| Pozycja | Zakres i wynik | Działanie właściciela |
| --- | --- | --- |
| 1 | Raport każdego z 88 aktywnych szczytów; lista 60 spoza KGP; kolejka 12 partii i aktualny handoff | Merge |
| 2 | Procedura/test odtworzenia prywatnej kopii w izolacji. Nie deklarować sukcesu na fixture | Merge; właściwy dump pozostaje na komputerze właściciela |
| 3 | Parking Lackowej, Mogielicy, Lubomira; aktualne źródło i zgodny start | Merge + SQL tylko potwierdzonych danych |
| 4 | Cztery zagraniczne GPX: Ben Nevis, Yr Wyddfa, Scafell Pike, Huangshan | Merge + SQL po zgodności wariantu i praw do źródła |
| 5 | Pogoda i światło dzienne: położenie, wysokość, źródło, datowanie, lokalizacja, błędy/cache | Merge; konfiguracja usługi tylko jeśli konieczna |
| 6 | Ostrzeżenia i zasady: źródła, sezon, data weryfikacji, kontakty; brak udawanej informacji na żywo | Merge; SQL jeśli potrzebny |
| 7 | Zgłaszanie błędów: formularz, backend, panel, kontrola dostępu/nadużyć | Merge + SQL |
| 8–19 | Katalog poza KGP, do 12 partii po około 5: trasy, POI, dojazd i 4 języki | Merge → apply → verify, osobno dla każdej partii |
| 20 | Profil wysokościowy tylko dla danych z wysokością; brak sztucznego wykresu z samej sumy podejść | Merge; ewentualnie SQL |
| 21 | Zapisane/zdobyte szczyty, data i postęp; własność danych i RLS | Merge + SQL |
| 22 | Spójność Light/Dark, telefon, klawiatura, retry, 4 języki; naprawy oparte na znalezionych problemach | Merge |
| 23 | SEO/wydajność: pomiar, językowy routing/prerender, sitemap/canonical/hreflang razem | Merge; ewentualna konfiguracja Netlify |
| 24 | Aktualna instrukcja utrzymania, backup, poczta, dane, znane blokady i przekazanie | Merge |

Pogoda i poprawki UX nie muszą czekać na wszystkie partie katalogu.
Badanie brakującego źródła nie wstrzymuje niezależnych zadań.

## Kryteria gotowego PR

- Konkretny problem i wynik, zakres, zależności oraz wymagane czynności właściciela.
- Odpowiednie testy: frontend lint/unit/build i istotne E2E; backend walidacja,
  uprawnienia i obsługa błędów; SQL lokalna transakcja/idempotencja/verify/rollback.
- Cztery języki tam, gdzie użytkownik widzi nową funkcję.
- Brak produkcyjnych mutacji, sekretów w kodzie i wysyłki testów do użytkowników.
- Każdy raport rozróżnia: test lokalny, publiczny odczyt, potwierdzenie właściciela.

## Raport i blokady

[Raport 88 szczytów i kolejka 60](../audit/2026-11-22/README.md).
[Parkingi bez wystarczających źródeł](../catalogue/kgp-parking-02/unresolved.json).
[Odtwarzanie i utrzymanie](remaining-work.md).

Obecny frontend nie zawiera integracji pogodowej, zapisywania/zdobywania szczytów
ani profilu wysokościowego tras. Istniejące pola elevation_gain_m i dwuwymiarowe
route_geometry nie stanowią same w sobie profilu. Sprawdzenie: aktualny main 397e464,
przeszukanie źródeł i zależności, bez założenia nieistnienia funkcji tylko na
podstawie jej niewidoczności na stronie.

Opcjonalne później: porównywanie tras, eksport karty wycieczki, plan wyjazdu,
zdjęcia/relacje z moderacją. Nie są częścią obecnych 24 pozycji.
