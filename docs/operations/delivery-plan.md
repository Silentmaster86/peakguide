# Kolejne wydania PeakGuide — plan wykonawczy

Stan: 25 listopada 2026. Agent przygotowuje kod, backend, testy, dokumentację i PR-y.
Właściciel sprawdza i scala PR-y. Produkcyjne SQL/sekrety wymagają właściciela;
nie wykonywać ich w tle. Brak informacji właściciela nie oznacza zgody na merge.

## Pięć etapów frontendu — ukończone

| Etap | Zakres | Stan |
| --- | --- | --- |
| 1 | Sticky navbar, telefon, mapa od góry, historia i kotwice | #41 scalony |
| 2 | Spójne kafelki i markery map | #42 scalony |
| 3 | Karty pogody MET i wschodu/zachodu słońca w 4 językach | #43 scalony; #44 poprawia zakładki/linki tras |
| 4 + 5 | Backend Open-Meteo oraz /weather: miasta/szczyty, zakres dni, navbar i homepage | #45 scalony 25 listopada, main `9baaaf3` |

Merge #45 potwierdzony przez właściciela i GitHub. Publiczny odczyt produkcji
25 listopada: `/weather` odpowiada 200, walidacja wyszukiwania zwraca JSON 400,
a prognoza Rysów zwraca 15 dni z Open-Meteo. Istniejąca flaga pogody wystarcza;
MET nadal obsługuje krótką prognozę w szczegółach. Brak SQL dla tych wydań.

## Teraz — profile wysokościowe, bez SQL

Podejmujemy pozycję 20 poniższego planu, podczas gdy importy są odłożone.
Pierwsza partia obejmuje cztery już wdrożone trasy: Łysina z Pcimia, Śnieżnica
z Gruszowca, Żar z Za Roztoki i Leskowiec z Rzyk. 530/530 punktów ma wysokości
w GPX. Źródła porównano 25 listopada ze wcześniejszymi pełnymi fingerprintami;
przebieg i kierunek są zgodne z istniejącymi rekordami nonkgp-01. Publiczny odczyt
Supabase potwierdził 4/4 zgodnych geometrii i adresów źródeł; wynik zapisano w
`docs/catalogue/elevation-profiles/production-verification.json`. To potwierdza
przygotowanie danych, nie wdrożenie interfejsu profili.

- Agent: generuje profile z rzeczywistych próbek, implementuje wykres/suwak/tabelę,
  cztery języki, Light/Dark i testy. Nie wylicza wykresu z sumy podejść.
- Właściciel: merge gotowego PR po CI. Bez SQL, sekretów i zmian konfiguracji.
- Pozostałe trasy: dopiero po weryfikacji właściwych GPX i wysokości; nie obiecujemy
  jeszcze profilu całego katalogu. Znaczniki mapy i dane szczytów bez zmian.
- LinkedIn: można przygotować materiały z wdrożonego frontendu po kontroli strony.
  Publikacja pozostaje działaniem właściciela; nie publikować w tle.

Utrzymanie profili: `python scripts/build_elevation_profiles.py --check` sprawdza
artefakty i tożsamości względem nonkgp-01. `--check --check-sources` dodatkowo
czyta cztery publiczne GPX i odmawia po zmianie pełnego fingerprintu lub próbek.
`docs/catalogue/elevation-profiles/review.json` zawiera sprawdzone wysokości;
`peakguide_front/src/features/elevation/data/` to generowane pliki. Zmian wysokości
nie zatwierdzać wyłącznie ponownym wygenerowaniem hashy — wymagają odczytu źródła.
Przerwy w danych/segmentach nie dostają łączników. Dystans Haversine ze śladu jest
osobną wartością od opublikowanego dystansu trasy; nie zmienia parametrów w bazie.

#40 scalony (`bd830f4`), SQL nadal odłożony. Później wyłącznie zbiorcze
[apply.sql](../catalogue/nonkgp-05-06/apply.sql) → [verify.sql](../catalogue/nonkgp-05-06/verify.sql),
5 zgodnych wierszy. Nie uruchamiać osobnych 05/06 dodatkowo.

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

Historyczny stan przed #33/#34: frontend nie zawierał integracji pogodowej.
Zapisywania/zdobywania szczytów nadal nie wdrożono. Profile wysokościowe są
w przygotowaniu jako oddzielny PR; nie są jeszcze na produkcji. Istniejące pola elevation_gain_m i dwuwymiarowe
route_geometry nie stanowią same w sobie profilu. Sprawdzenie: aktualny main 397e464,
przeszukanie źródeł i zależności, bez założenia nieistnienia funkcji tylko na
podstawie jej niewidoczności na stronie.

Opcjonalne później: porównywanie tras, eksport karty wycieczki, plan wyjazdu,
zdjęcia/relacje z moderacją. Nie są częścią obecnych 24 pozycji.

## Pierwsze przygotowane wydania

- [#32 — audyt i kolejka](https://github.com/Silentmaster86/peakguide/pull/32): merge.
- [#33 — pogoda, frontend i backend](https://github.com/Silentmaster86/peakguide/pull/33):
  merge; aktywacja dostawcy po przeczytaniu/akceptacji warunków i jednej zmiennej
  Netlify. Bez SQL. Bez aktywacji dostawca nie jest wywoływany.
- [#34 — światło dzienne](https://github.com/Silentmaster86/peakguide/pull/34): merge.

To trzy niezależne PR-y; punkt 5 planu został podzielony na dwa, żeby lokalne
obliczenia słońca nie zależały od akceptacji zewnętrznego dostawcy. Liczba 24
pozostaje budżetem roboczym, nie limitem ani obietnicą zakończenia w jednym wydaniu.


## Partia nonkgp-01 — wdrożona

[nonkgp-01](../catalogue/nonkgp-01/README.md): Łysina, Śnieżnica, Góra Żar,
Leskowiec — 4 trasy z GPX i 4 POI w czterech językach. Śnieżnica otrzymuje poprawne
pasmo Wyspowy, bez zmian współrzędnych lub opisów szczytu. PR #35 scalony;
właściciel potwierdził SQL wynikiem 4/4 review_matches/package_applied=true
23 listopada. Nie ponawiać importu. Ostry Wierch z pierwszej piątki ma sprzeczną tożsamość
w danych; pozostaje osobnym zadaniem, nie został automatycznie podmieniony.
PR #32/#33/#34 są już scalone; właściciel potwierdził działanie pogody i światła.


## Partia nonkgp-02 — wdrożona

[Pakiet](../catalogue/nonkgp-02/README.md): Rotunda, Niemcowa, Barania Góra,
Klimczok — cztery pary trasa/POI, GPX, 32 teksty, bez edycji rekordów szczytów.
PR #36 scalony. Właściciel wykonał SQL i potwierdził 4/4 review_matches oraz
package_applied=true. Nie ponawiać importu.
Wielki Rogal z drugiej piątki pozostaje do kontroli nazwy/tożsamości.
Pogoda i światło dzienne z #33/#34 są już scalone i zgłoszone jako działające;
wcześniejsze opisy stanu main 397e464 powyżej są historyczne.


## Partie nonkgp-03 i nonkgp-04 — zamknięte

PR #37/#38 scalone. Właściciel przekazał 24 listopada pełne verify: 5/5 i 4/4
wierszy, po trasie/POI/geometrii, cztery języki, obie kontrole true. Nie ponawiać
SQL. Srebrna Góra pozostaje poza importem 04 ze względu na tożsamość.
#39 scalony: spójny czas na kafelkach i w szczegółach, bez SQL.

## Następna partia — nonkgp-05

[Pakiet](../catalogue/nonkgp-05/README.md): Stóg Izerski i Wysoki Kamień,
2 trasy z GPX, 2 POI, 16 tekstów. Bez edycji szczytów. Iwinka, Postawna
i Anielska Kopa wymagają weryfikacji dokładnego wariantu i dostępu, nie są importowane.

Właściciel chce zbiorczego wgrywania po zebraniu większej liczby pakietów.
Aktualizować [kolejkę](pending-rollout.md), kontynuować źródła i testy kolejnych
niezależnych partii. Przy wspólnym oknie używać zbiorczego 05-06 opisanego poniżej. Nie prosić teraz o powtarzanie zamkniętych importów.

## Rozszerzenie #40 — wspólne wgranie 05 + 06

Dodana partia 06: Kalenica, Wieżyca, Czarna Góra. Łącznie z 05 pięć nowych
par trasa/POI w czterech językach, bez zmian rekordów szczytów. Dzikowiec
wymaga osobnego przeglądu pasma i tożsamości dwóch wież.
#40 scalony; przy przyszłym imporcie nonkgp-05-06/apply.sql → verify.sql, 5 zgodnych wierszy.
Wspólny apply jest atomowy. [Instrukcja](../catalogue/nonkgp-05-06/README.md).
SQL niewykonany; osobnych 05/06 nie uruchamiać jako kolejnych kroków.
