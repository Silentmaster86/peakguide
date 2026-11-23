# Poza KGP — partia 03

**Przygotowany import, jeszcze bez wykonania na produkcji.** Ćwilin (72), Łyżka
(71, zachowany slug `lakowa-wyspowy`), Mała Babia Góra (61), Polica (62), Halicz
(64): **5 tras/GPX, 5 POI, 40 tekstów PL/EN/UA/ZH, 1203 punkty źródłowe**.
Każda trasa to jeden kierunek wejścia. Trasy nie zmieniają rekordów szczytów.

Poprzednią partię `nonkgp-02` / PR #36 właściciel wdrożył i potwierdził 23 listopada:
4/4 review_matches=true oraz package_applied=true, trasy/POI/geometrie po 1,
cztery języki. Nie uruchamiać ponownie starych importów ani ich rollbacków.

## Wdrożenie po merge

1. Zachowaj aktualną kopię bazy. Otwórz Supabase SQL Editor i uruchom cały
   `docs/catalogue/nonkgp-03/apply.sql` jako właściciel.
2. W nowym zapytaniu uruchom cały `docs/catalogue/nonkgp-03/verify.sql`.
3. Oczekuj 5 wierszy: trails=1, pois=1, mapped_trails=1, oba zestawy języków
   `[en,pl,ua,zh]`, review_matches=true i package_applied=true.
4. Odśwież stronę i sprawdź trasy, POI oraz ich przebiegi na mapie.

Sam merge publikuje pliki, nie wykonuje SQL na produkcji. Agent nie ma połączenia
administracyjnego z Supabase. `rollback.sql` to narzędzie awaryjne, nie następny
krok wdrożenia. SQL jest ASCII-only; znaki narodowe zapisano w JSON Unicode.
Nie poprawiaj wygenerowanych plików ręcznie.

## Dokładne warianty — źródła sprawdzone 23 listopada 2026

| Szczyt | Zakres | Parametry wejścia z karty | Źródło / GPX |
| --- | --- | --- | --- |
| Ćwilin | Gruszowiec → Pod Ćwilinem → Ćwilin, niebieski i końcowy wspólny żółty. | 2 km, 394 m, 70 min | [15kp3](https://mapa-turystyczna.pl/route/15kp3), [136 punktów GPX](https://mapa-turystyczna.pl/route/15kp3.gpx) |
| Łyżka | Węzeł Przyszowa → Pod Łyżką → Łyżka, czarny i końcowy wspólny zielony. | 4,4 km, 399 m, 105 min | [3vfnn](https://mapa-turystyczna.pl/route/3vfnn), [175 punktów GPX](https://mapa-turystyczna.pl/route/3vfnn.gpx) |
| Mała Babia Góra | Schronisko Markowe Szczawiny → Brona → Mała Babia Góra, czerwony, dalej niebieski/zielony. | 1,8 km, 323 m, 55 min | [3bm9s](https://mapa-turystyczna.pl/route/3bm9s), [149 punktów GPX](https://mapa-turystyczna.pl/route/3bm9s.gpx) |
| Polica | Przełęcz Krowiarki → Cyl Hali Śmietanowej → Polica, czerwony. | 6,9 km, 481 m, 150 min | [my5](https://mapa-turystyczna.pl/route/my5), [225 punktów GPX](https://mapa-turystyczna.pl/route/my5.gpx) |
| Halicz | Wołosate, punkt 49.066051/22.680646 → węzeł Wołosate → Przełęcz Bukowska → Rozsypaniec → Halicz. Początkowy wspólny czerwony/niebieski, dalej czerwony. | 10,6 km, 660 m, 224 min | [fz6f](https://mapa-turystyczna.pl/route/fz6f), [518 punktów GPX](https://mapa-turystyczna.pl/route/fz6f.gpx) |

Wszystkie ślady są pełne, w oryginalnym kierunku, każdy ma jeden segment.
Zachowano wszystkie punkty źródłowe, bez upraszczania i dopisywania łączników.
GPX pozostają u dostawcy. Geometria bazy jest 2D; wysokości w GPX nie oznaczają,
że strona ma już profil wysokościowy. `difficulty=null`: kolor szlaku nie jest
skalą trudności. Czasy są opublikowanymi szacunkami, nie pomiarem użytkownika.

### Granice wariantów i odrzucone źródła

- **Mała Babia Góra:** start jest już przy schronisku, nie w dolinie. Dojście do
  schroniska i powrót wymagają osobnego planu. Każda wersja językowa o tym mówi.
  Nie obejmuje Diablaka ani Perci Akademików.
- **Halicz:** pełne 10,6 km zaczyna się w punkcie podanym w tabeli. Węzeł nazwany
  Wołosate jest dalej o około 0,6 km; nie mieszamy tego wariantu z trasą 10 km
  liczoną od węzła. Nie deklarujemy, że punkt jest parkingiem. Tarnica, pętla
  przez przełęcz Goprowską i zejście nie są częścią wybranej trasy.
- **Łyżka:** starszy [PTTK 129](https://malopolska.szlaki.pttk.pl/129-pttk-malopolska-przyszowa-lyzka)
  podaje 4,3 km / 408 m / 110 min, a jego GPX kończy się przy 49.641779/20.465309,
  przed wierzchołkiem. Nie przedłużono go ręcznie. Wybrano oddzielny, kompletny
  wariant 3vfnn do punktu 49.642731/20.462198, z jego własnymi parametrami.
  Odrzucono też wariant zaczynający się 34 m nieoznaczonym dojściem do węzła.
- **Polica:** Hala Krupowa i droga powrotna są poza zakresem.
- Wysokości w etykietach dostawców bywają różne od bazy (np. 800/803 m Łyżki,
  1517/1516 m Małej Babiej). Nie zmieniamy rekordów szczytów przy imporcie tras.
  Zachowano też istniejące adresy `lakowa-wyspowy` i `maly-babia-gora`.

[geometry-review.json](geometry-review.json) zawiera odciski źródeł i współrzędnych,
liczby punktów, końce i daty. Kontrola eksportów Mapa Turystyczna normalizuje tylko
wspólne przesunięcie generowanych czasów; wysokości, współrzędne, względne czasy,
nazwy i odnośniki nadal muszą być zgodne. Przy Łyżce eksport parametrowy i 3vfnn
miały identyczny ślad, lecz różny link źródłowy w GPX. Raport przypięto do pobranego
pliku 3vfnn; reguły kontroli nie zostały osłabione i oba warianty nie są traktowane
jako identyczne dokumenty.

## POI i ich położenie

| Szczyt | POI / typ / pozycja | Źródło i dokładność |
| --- | --- | --- |
| Ćwilin | Polana Michurowa, rejon wierzchołka / viewpoint / 49.688740, 20.191897 | [PTTK 2020](https://malopolska.szlaki.pttk.pl/2020-pttk-malopolska-cwilin). Położenie obszaru dawnej polany pasterskiej, nie wyznaczone granice ani infrastruktura. |
| Łyżka | Rejon dawnego grodu / attraction / 49.642726, 20.462113 | [PTTK 2099](https://malopolska.szlaki.pttk.pl/2099-pttk-malopolska-lyzka). Pozostałości osadnictwa, murów i form ziemnych; bez obietnicy muzeum lub trasy po ruinach. |
| Mała Babia Góra | Schronisko Markowe Szczawiny / shelter / 49.587448, 19.517191 | [PTTK 1345](https://malopolska.szlaki.pttk.pl/1345-pttk-malopolska-schronisko-gorskie-pttk-na-markowych-szczawinach). Przy początku odcinka; dojście z doliny poza nim. |
| Polica | Rejon upamiętnienia katastrofy / attraction / 49.623685, 19.619426 | [Powiat Suski](https://visit.powiatsuski.pl/polica/). Źródłowy punkt rejonu szczytu z krzyżem; oddzielny pomnik stoi przy czerwonym szlaku w stronę Krowiarek. Nie podajemy tej samej pinezki jako precyzyjnej lokalizacji obu obiektów. |
| Halicz | Panorama z Halicza / viewpoint / 49.072102, 22.768811 | [Archiwalny opis BdPN](https://archiwum.bdpn.pl/index.php?id=61&option=com_content&task=view), [pozycja Mapa Turystyczna](https://mapa-turystyczna.pl/node/halicz). Obszar przy końcu trasy, bez infrastruktury usługowej. |

Wszystkie POI są przypisane do szczytów (`trail_id=null`). Pinezki obszarów
nie wyznaczają granic ani dokładnej lokalizacji każdego opisanego elementu.
Nie publikujemy niesprawdzonych cen, godzin, parkingów, toalet, pojemności czy
aktualnej dostępności noclegów. Schronisko należy potwierdzić u gospodarza.
Opis Halicza w archiwum parku jest użyty wyłącznie do stałych cech panoramy,
nie aktualnych przepisów lub dostępności. Strona deklaruje ISO-8859-2 i została
odczytana w tym kodowaniu, bez naprawiania treści przez zgadywanie znaków.

## Zasady i komunikaty parków

- [Komunikat BgPN](https://bgpn.gov.pl/komunikat-turystyczny) odczytany 23 listopada
  ostrzega przed śniegiem i lodem w wyższych partiach. Nie przepisujemy historycznego
  stanu otwarcia innych szlaków jako gwarancji dla wybranej trasy. Notatki Małej
  Babiej wskazują wiatr, śnieg/lód oraz konieczność sprawdzenia parku/GOPR.
- Mała Babia i Polica mają na kartach tras odcinki z zakazem wprowadzania psów.
  Notatki odsyłają do zasad BgPN; nie rozszerzają wyjątków na całą trasę.
- [Aktualny komunikat BdPN](https://bdpn.gov.pl/komunikat-turystyczny) ostrzegał
  przed marznącym deszczem i śliskimi szlakami. Notatka Halicza wskazuje długi,
  odsłonięty odcinek, zapas czasu i wyposażenie. Nie jest alertem na żywo.
- [Pies w BdPN](https://bdpn.gov.pl/pies-w-parku): wyjątki dotyczą wybranych
  odcinków, nie wejścia na Halicz. Karta fz6f wskazuje zakaz na tym wariancie.

GPX i data sprawdzenia źródeł **nie potwierdzają otwarcia ani bezpieczeństwa**.
Nowe wpisy nie zmieniają wcześniejszych ostrzeżeń Krywania ani usług pogody.

## Transakcja i testy

Jedna transakcja, prywatny rejestr `nonkgp-03`, pełne migawki 10 rekordów i tekstów.
Import sprawdza tożsamość rodziców i pasm, odmawia istniejących treści (także
szkiców), konfliktów slugów i niejednoznacznych typów POI. Ponowienie nie nadpisuje
późniejszych edycji. Cofanie kontroluje FK, także przyszłe CASCADE/SET NULL,
i zachowuje pozostałe partie oraz wszystkie pola szczytów.

```sh
python scripts/build_nonkgp_03.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Wyłącznie dedykowana lokalna baza nonkgp_03_test:
python supabase/tests/nonkgp_03_test.py
# Publiczni dostawcy GPX, bez zapisu do Supabase:
python scripts/build_nonkgp_03.py --check --check-sources
```

Integracja sprawdza pełne 40 tekstów, PostGIS, typed verify, powtórzenie/cofanie,
późniejsze edycje/zależności, szkice, błąd ostatniego tłumaczenia, zmianę tożsamości,
publiczne RLS/granty i brak zmian szczytów. Osobny scenariusz importuje nonkgp-02,
następnie nonkgp-03 i cofa tylko nową partię, sprawdzając pełną zgodność poprzedniej.
Fixture nie zastępuje odtworzenia prywatnej kopii Supabase. E2E używa tekstów
partii w atrapach API; produkcję potwierdzi dopiero wynik verify właściciela.

Wyniki lokalne: 16 testów Python, test transakcyjny PostGIS z poprzednią partią,
pełne `npm run check` (lint, testy backendu/Node, 141 testów komponentów, build),
osiem scenariuszy Chromium desktop/mobile w 4 językach oraz pięć widoków
Light/Dark bez błędów JavaScript, naruszeń Axe w głównej treści i poziomego
przepełnienia. Obejrzano m.in. Ćwilin PL Light, Małą Babią EN Dark i Halicz ZH
Light. To lokalne testy treści partii w atrapach API, nie wdrożenie danych.
