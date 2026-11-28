# Kolejne wydania PeakGuide — plan wykonawczy

Stan: 28 listopada 2026. Agent przygotowuje kod, backend, testy, dokumentację i PR-y.
Właściciel sprawdza i scala PR-y. Produkcyjne SQL/sekrety wymagają właściciela;
nie wykonywać ich w tle. Brak informacji właściciela nie oznacza zgody na merge.

## Bieżące przekazanie — merge #50 potwierdzony

#50 scalony 28 listopada (`9ccbc0a`), potwierdzenie właściciela i GitHub.
Suchawa i Lesista Wielka: kod gotowy, **SQL partii 07 nadal odłożony**.
Nowa partia 08: Wołek, Trzy Korony, Zamkowa Góra (Góry Opawskie), Srebrna Kopa.
Cztery trasy/POI, 32 tłumaczenia i 842 próbki profili. Nie zmienia tożsamości szczytów.

Wspólne przyszłe okno: `docs/catalogue/nonkgp-07-08/README.md`, jeden `apply.sql`
i jeden `verify.sql`. Razem 6 tras, 6 POI, 48 tłumaczeń, 1089 nowych próbek.
To **przygotowane pakiety**, nie potwierdzenie importu. Na razie tylko merge.
Nie prosić o ponowienie zakończonych importów #37/#38/#40 ani merge #45–#50.
Na produkcji pozostaje 9 profili / 1278 próbek; kod przygotowuje 15 / 2367,
z czego 6 profili czeka na SQL 07/08. Publiczny audyt nadal: poza KGP 32 bez
trasy i 35 bez POI; przygotowanych pakietów nie odejmować od tych braków.


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

## Profile wysokościowe — wdrożone

#46 scalony (`571b7f0`): Łysina z Pcimia, Śnieżnica z Gruszowca, Żar z Za Roztoki
oraz Leskowiec z Rzyk — 530 rzeczywistych próbek. #47 scalony (`2ed0488`):
początkowe grupowanie i przybliżanie markerów. GitHub i właściciel potwierdzili merge.
Agent sprawdził produkcję 25 listopada: cztery wykresy, klawiatura, Light/Dark,
telefon/komputer oraz trzy osobne markery po wyborze Beskidu Śląskiego.
[Wynik odczytu](../catalogue/elevation-profiles/production-rollout-46-47.json).
To zakończone wydania; nie prosić o ponowny merge lub SQL.

#48 scalony 28 listopada (`0a85cd2`): Stóg Izerski,
Wysoki Kamień, Czarna Góra, Kalenica i Wieżyca. Ich trasy są już wdrożone z #40.
Pięć źródeł zawiera komplet 748 wysokości; pełne fingerprinty i geometrie
ponownie porównano 28 listopada z pierwotnymi przeglądami.
[Zapis kontroli źródeł](../catalogue/elevation-profiles/source-verification-2026-11-28.json). Wdrożono **9 profili / 1278 próbek**.
Dzisiejszy odczyt publicznego katalogu potwierdził 9/9 zgodnych powiązań:
[wynik](../catalogue/elevation-profiles/production-binding-2026-11-28.json).
Merge potwierdzili właściciel i GitHub. Publiczny przegląd potwierdził pięć nowych
wykresów, koniec suwaka klawiaturą, cztery języki, Light/Dark i 320/390/1440 px:
[raport produkcyjny](../catalogue/elevation-profiles/production-rollout-48.json).
Nie ma zaległego merge ani SQL dla #48.

Utrzymanie: `python scripts/build_elevation_profiles.py --check` porównuje
artefakty i tożsamości z jawną listą partii nonkgp-01, nonkgp-05, nonkgp-06 oraz przygotowanymi nonkgp-07 i nonkgp-08.
`--check --check-sources` dodatkowo czyta przejrzane publiczne GPX i odmawia
po zmianie pełnego fingerprintu lub próbek. Nie przyjmuje dowolnej ścieżki partii.
`docs/catalogue/elevation-profiles/review.json` zawiera sprawdzone wysokości
z oznaczeniem partii; `peakguide_front/src/features/elevation/data/` to pliki
generowane. Wcześniejsze cztery artefakty profili pozostają identyczne.
Zmian wysokości nie zatwierdzać samym przeliczeniem hashy — wymagają źródła.
Przerwy w danych/segmentach nie dostają łączników; dystans Haversine śladu jest
osobny od opublikowanego dystansu i nie zmienia parametrów w bazie.

Pakiet LinkedIn (jeden tekst PL/EN/UA/ZH, screeny produkcji, opisy alternatywne)
został przekazany właścicielowi. Publikacja pozostaje jego działaniem.

#40 scalony (`bd830f4`), SQL wykonany i potwierdzony przez właściciela
25 listopada: 5/5 zgodnych wierszy, po trasie/POI/geometrii i cztery języki.
[Zapis verify](../catalogue/nonkgp-05-06/production-verification.json).
Nie ponawiać wspólnego ani osobnych importów 05/06.

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
Zapisywania/zdobywania szczytów nadal nie wdrożono. Dziewięć profili wysokościowych
jest na produkcji z #46/#48. Istniejące pola elevation_gain_m i dwuwymiarowe
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

## Partia nonkgp-05 — wdrożona

[Pakiet](../catalogue/nonkgp-05/README.md): Stóg Izerski i Wysoki Kamień,
2 trasy z GPX, 2 POI, 16 tekstów. Bez edycji szczytów. Iwinka, Postawna
i Anielska Kopa wymagają weryfikacji dokładnego wariantu i dostępu, nie są importowane.

Właściciel chce zbiorczego wgrywania po zebraniu większej liczby pakietów.
Aktualizować [kolejkę](pending-rollout.md), kontynuować źródła i testy kolejnych
niezależnych partii. Wspólne okno 05-06 opisane poniżej jest zakończone;
nie prosić o jego powtórzenie.

## Rozszerzenie #40 — partie 05 + 06 wdrożone

Dodana partia 06: Kalenica, Wieżyca, Czarna Góra. Łącznie z 05 pięć nowych
par trasa/POI w czterech językach, bez zmian rekordów szczytów. Dzikowiec
wymaga osobnego przeglądu pasma i tożsamości dwóch wież.
#40 scalony i wdrożony. Właściciel przekazał 25 listopada 5/5 zgodnych wierszy
zbiorczego verify: po trasie/POI/geometrii, cztery języki i obie kontrole true.
[Historia wdrożenia](../catalogue/nonkgp-05-06/README.md).
Nie ponawiać wspólnego ani osobnych importów 05/06.


## Aktualizacja po #49 i kolejna partia

#49 scalony 28 listopada (`3f41a11`); menu klawiaturą, aktywne opcje, Light/Dark
oraz 4 języki sprawdzono na produkcji w 8 widokach. [Raport](../audit/2026-11-28/production-rollout-49.json).

[Partia 07](../catalogue/nonkgp-07/README.md) przygotowuje Suchawę i Lesistą Wielką:
2 trasy z GPX, 2 POI, 16 tekstów, 247 próbek i 2 profile. Bez edycji szczytów.
Właściciel scala kod; SQL odkładamy do większego wspólnego okna. To przygotowanie,
nie potwierdzenie wdrożenia. Po wykonaniu importu możliwe będzie 11 profili / 1525
próbek; obecnie produkcja ma 9 profili. [Kolejka i pliki](pending-rollout.md).

[Świeży audyt](../audit/2026-11-28/catalogue-coverage.json) nadal wykazuje 32 szczyty
poza KGP bez trasy i 35 bez POI. Źródła/tożsamości następnych rekordów należy
sprawdzać oddzielnie; liczniki nie potwierdzają jakości ani dostępności szlaków.
