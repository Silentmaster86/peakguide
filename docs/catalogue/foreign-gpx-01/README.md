# Howerla i Krywań — geometria dwóch istniejących tras

Przygotowano 21 listopada 2026 po [wspólnym przeglądzie sześciu tras](../foreign-gpx-review/README.md).
**To gotowy pakiet do ręcznego wdrożenia, nie potwierdzenie zapisu produkcyjnego.**
Nie zmienia pozostałych czterech tras, KGP ani pinezek szczytów.

| Istniejąca trasa | Zakres i źródło | Punkty |
| --- | --- | ---: |
| Howerla, id 8 | [Publiczna mapa aktualnej strony parku](https://karpatskyi-park.in.ua/en/route/hoverla-mount/) wskazuje [GPX](https://karpatskyi-park.in.ua/wp-content/uploads/2021/01/Na-horu-Hoverla-1.gpx). Pełne dojście od punktu kontrolnego w rejonie Zavoie do szczytu, przez dolinę Prutu i rejon Zarosliaka. Bez powrotu. | 252 |
| Krywań, id 10 | [Pętla źródłowa](https://mapa-turystyczna.pl/route/31p2a), [GPX](https://mapa-turystyczna.pl/route/31p2a.gpx): Tri studničky → podejście zielonym → Krivánsky žľab → szczyt → Jamské pleso → Tri studničky. | 939 |

## Zakres zmian

Tylko cztery pola na tych dwóch rekordach: `route_geometry`, `gpx_url`,
`geometry_source_url`, `geometry_verified_at`. Zachowane są identyfikatory,
relacje użytkowników i POI, aktywność, typy tras, nazwy początku/końca, wszystkie
teksty PL/EN/UA/ZH, metryki i dotychczasowe źródła parametrów. Natywne triggery
mogą zmienić `updated_at`. Nie tworzymy nowych tras ani kopii tłumaczeń.

- Howerla: pozostaje 10,5 km / 300 min, bez potwierdzonej sumy podejść.
- Krywań: pozostaje 360 min / 1354 m podejść, bez potwierdzonego dystansu.
- Długości polilinii (ok. 10,814 i 14,901 km) są kontrolą geometrii, nie nowymi
  parametrami wycieczek. Czasy planistyczne w eksporcie GPX nie zastępują opisów źródłowych.

Każdy GPX zawiera jeden segment. Wszystkie współrzędne i ich kolejność są
zachowane bez interpolacji, odwracania, łączenia lub skracania. Geometria ma
postać MultiLineString. Nie dodano dojścia do pinezki, odcinków powrotnych Howerli
ani innego wariantu Krywania. Odległość pinezki Krywania w starszym katalogu
od rejonu przejścia GPX przez szczyt wymaga osobnego przeglądu współrzędnych;
nie dopasowywano do niej źródłowego śladu.

## Pochodzenie i dostępność plików

Pliki GPX pozostają na serwerach dostawców. `gpx_url` prowadzi do oryginału,
nie do nowej kopii w repo. Mapa już pokazuje link `geometry_source_url` w dymku
trasy. Obecny starszy `map_url` Howerli pozostaje bez zmian; źródło geometrii
wskazuje aktualną stronę parku, która potwierdza pełne 10,5 km w jedną stronę.

Manifest zachowuje źródło i atrybut creator: Mapa Turystyczna oraz AllTrails.com
w pliku hostowanym przez park. Nie przedstawiać współrzędnych jako własnego
pomiaru PeakGuide lub nowego pomiaru parku. Sprawdzono publiczne pobieranie,
warunki dostawcy Mapa Turystyczna i pochodzenie pliku parku. Nie przypisano
plikom ani danym nowej licencji i nie skopiowano opisów/zdjęć dostawców.

Zapisano SHA-256 pobranego pliku oraz stabilny odcisk zawartości. Eksport
Mapa Turystyczna przesuwa datę metadanych i wszystkie czasy planistyczne
przy każdym pobraniu. Kontrola normalizuje je względem czasu eksportu, zachowując
odstępy między punktami, metadane, wysokości, współrzędne i atrybucję. Zmiana
współrzędnych, względnych czasów lub informacji o pochodzeniu przerywa kontrolę.
Dla Howerli nie normalizuje się dat. Testy obejmują te różnice.

Adresy dostawców są zewnętrzne i mogą z czasem przestać działać lub zmienić
zawartość. Przed wdrożeniem agent sprawdził zgodność każdego punktu mapy z
ponownie pobranymi plikami. Kolejne kontrole można wykonać poleceniem z sekcji testów.
Nie jest to potwierdzenie bieżącego otwarcia szlaków ani pomiar terenowy.

## Bezpieczeństwo aktualizacji

`apply.sql` wymaga istniejącej tabeli rejestrów katalogu i tożsamości aktywnych
szczytów/trasy. Sprawdza cały zrecenzowany rekord oraz komplet tłumaczeń przed
zapisem. Ignoruje wyłącznie wcześniejszy `updated_at`, aby ponowienie po naszym
rollbacku było możliwe; żadne pole treści nie jest ignorowane.

Późniejsze edycje, istniejący GPX/geometria lub niezgodna tożsamość przerywają
całą transakcję. Rejestr `foreign-gpx-01` zapisuje pełne snapshoty przed/po.
Chronione ponowienie jest no-op dla niezmienionych rekordów. Pozostałe
rejestry katalogu (w tym KGP i naprawa UTF-8) są nietknięte.

`rollback.sql` najpierw sprawdza oba snapshoty po aktualizacji, następnie
przywraca tylko te cztery pola. Nie usuwa rekordów ani relacji. Odmawia cofnięcia
późniejszej edycji i nie przywraca starego znacznika wersji. Ponowienie po poprawnym
cofnięciu działa. Klienci anon/authenticated nie mają dostępu do prywatnego rejestru.

## Ręczne wdrożenie po merge i z aktualnym backupem

Merge ani Netlify nie uruchamiają SQL. Właściciel ma kopie sprzed i po poprzednich
wdrożeniach; należy zachować je prywatnie. W głównym katalogu repo:

```powershell
git pull --ff-only
Get-Content .\docs\catalogue\foreign-gpx-01\verify.sql -Encoding UTF8 -Raw | Set-Clipboard
```

W SQL Editor wykonać kontrolę. Przed importem oczekiwane: dwa właściwe rekordy,
`has_geometry=false`, `upgrade_applied=false`, języki en/pl/ua/zh.
Następnie skopiować i wykonać w nowym zapytaniu:

```powershell
Get-Content .\docs\catalogue\foreign-gpx-01\apply.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Po sukcesie wykonać ponownie `verify.sql`. Oba rekordy powinny mieć
`has_geometry=true`, `geometry_matches_review=true`, `gpx_matches_review=true`
i `upgrade_applied=true`, z zachowaniem typów/metryk/języków.
Po SQL odświeżyć stronę. Sprawdzić mapę po zaznaczeniu warstwy tras, szczegóły obu szczytów i GPX.
Pętla Krywania wraca do początku; Howerla kończy się przy szczycie.

Wszystkie wygenerowane pliki SQL są ASCII-only, niezależnie od kodowania
PowerShell. Mimo tego nadal jawnie podawać `-Encoding UTF8`.

## Testy dla agenta / CI

```sh
python scripts/build_foreign_gpx_01.py --check
python scripts/build_foreign_gpx_01.py --check --check-sources
python supabase/tests/foreign_gpx_01_test.py --docker NAZWA_KONTENERA
```

Kontrola źródeł pobiera publiczne pliki, nie zapisuje bazy. Nie jest wymagana
instalacja Pythona u właściciela do wykonania SQL. CI sprawdza deterministyczne
SQL i integrację na dedykowanej bazie `foreign_gpx_01_test`; nie pobiera plików
z internetu. Test resetuje wyłącznie tę nazwaną bazę. Sprawdza 1191 punktów,
pętlę i pełny start Howerli, ASCII, atomowy późny konflikt, ochronę wcześniejszego
GPX, brak zmiany ID/tekstów/metryk/relacji/innych rejestrów, ponowienie,
cofanie/ponowne zastosowanie oraz odmowę operacji dla ról klienckich.
