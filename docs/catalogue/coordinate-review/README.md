# Trzy pinezki szczytów — korekta wyłącznie lokalizacji

Przygotowano 17.11.2026; bez zapisów produkcyjnych. Koryguje `latitude`, `longitude` oraz odpowiadający im punkt PostGIS `geom`, tak aby pinezki Śnieżnika, Rudawca i Lackowej odpowiadały potwierdzonym punktom szczytowym, a nie pobliskim zboczom. Nie zmienia wysokości, klasyfikacji pasma/KGP, opisów, slugów, tras, POI ani relacji użytkowników.

## Dowody i zakres

Wartości przed pochodzą z ponownego odczytu publicznego API PeakGuide 17.11.2026. Każdy punkt po pochodzi z karty konkretnego szczytu Mapa Turystyczna — to dane kartograficzne, nie własny pomiar geodezyjny. `changes.json` zawiera dokładne wartości przed/po i źródła, w tym EWKB `geom`.

| Szczyt | Punkt przed (lat, lon) | Punkt po (lat, lon) | Przesunięcie przybliżone | Źródło |
| --- | --- | --- | --- | --- |
| Śnieżnik, id 2 | 50.206667, 16.844167 | 50.207423, 16.847394 | 244 m | [karta Śnieżnika](https://mapa-turystyczna.pl/node/snieznik) |
| Rudawiec, id 4 | 50.243056, 16.979722 | 50.244770, 16.976879 | 277 m | [karta Rudawca](https://mapa-turystyczna.pl/node/rudawiec) |
| Lackowa, id 23 | 49.428333, 21.096111 | 49.426496, 21.102539 | 500 m | [karta Lackowej](https://mapa-turystyczna.pl/node/lackowa) |

Dodatkowa kontrola: każdy punkt po znajduje się w odległości poniżej 100 m od końca niezależnego GPX PTTK, przygotowanego już w partiach 02/03/04. Dla Lackowej [PTTK 2254](https://malopolska.szlaki.pttk.pl/2254-pttk-malopolska-lackowa) podaje punkt 49.426363 / 21.102584, zgodny w granicach kilkunastu metrów. Dla Rudawca [zielony GPX PTTK 675](https://dolnoslaskie.szlaki.pttk.pl/item/gpx/675), wybrany w partii 03, kończy się przy 50.244765 / 16.976835. Punkt Śnieżnika jest blisko końca zielonego podejścia partii 02 i okolicy wieży, bez utożsamiania samej wieży z dokładnym punktem kartograficznym szczytu.

Nie rozstrzygamy rozbieżności wysokości: karta Rudawca podaje inną wysokość/klasyfikację niż wykaz KGP, a Śnieżnika 1426 m zamiast obecnych 1425 m. Ten patch dotyczy wyłącznie położenia. Nie przenosi niepotwierdzonej Łysicy i nie zmienia pinezki Wysokiej Kopy na Sine Skałki.

## Wdrożenie po świeżym backupie

1. Merge udostępni dokumentację i SQL — nie zapisze bazy.
2. W SQL Editor uruchom `verify.sql` (odczyt) i porównaj lokalizacje z tabelą. Odczyt pokazuje też wysokości, liczniki relacji i zgodność `geom`.
3. Wykonaj świeży backup, następnie cały `apply.sql`. To ręczna operacja danych, nie automatyczna migracja.
4. Ponownie `verify.sql`: punkty po mają być jak w tabeli, `geometry_matches_coordinates=true`, wysokości i relacje pozostają takie same. Sprawdź pozycję pinezek względem tras na publicznej mapie.

Skrypt blokuje trzy rekordy w jednej transakcji. Inna tożsamość, zmieniony stan publikacji/KGP lub nowsza zmiana współrzędnych przerywa całość bez częściowych zapisów. Ponowienie jest no-op. Zmiana opisu lub wysokości nie jest nadpisywana — pola te nie są aktualizowane.

`rollback.sql` przywraca wyłącznie poprzednie współrzędne i odpowiadający im `geom`; odmawia cofania nowszej korekty położenia. Nie cofa późniejszych opisów. Niezależne od partii 01–04, uzupełnienia GPX i korekty Łysicy: rejestry partii zawierają trasy/POI, nie snapshoty pinezek szczytów.

## Testy

`python scripts/build_coordinate_review.py --check`; `python supabase/tests/coordinate_review_test.py` na dedykowanym PostGIS `coordinate_review_test` (obsługuje `--docker NAZWA`). Test potwierdza dokładne współrzędne i geometrię, zgodność z niezależnymi końcami GPX, zachowanie wysokości, 12 tłumaczeń i relacji, idempotencję, cofnięcie, atomowe odrzucenie nowszej korekty i zachowanie późniejszej edycji tekstu. Osobny workflow CI ogranicza konflikt z innymi PR-ami. Nie wykonuje zapisów produkcyjnych.
