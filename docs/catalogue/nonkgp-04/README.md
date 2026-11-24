# Poza KGP — partia 04

**PR #38 scalony i wdrożony.** Właściciel przekazał verify 24 listopada 2026:
4/4 zgodne wiersze z trasą/POI/geometrią i PL/EN/UA/ZH, obie kontrole true.
Nie ponawiać SQL; kroki poniżej zachowano jako procedurę pakietu. Krzemień (63), Jaworzyna
Kamienicka (66), Kudłoń (65), Jelenia Kopa (141): 4 trasy z GPX/geometrią, 4 POI,
32 teksty PL/EN/UA/ZH, **835 punktów źródłowych**. Rekordów szczytów nie zmienia.
Srebrna Góra (54) pozostaje poza importem ze względu na sprzeczną tożsamość.

#37/nonkgp-03 również ma potwierdzone verify 5/5. [Aktualna kolejka](../../operations/pending-rollout.md)
zbiera wyłącznie nowe pakiety do przyszłego wspólnego okna. Obie kolejności 03/04
sprawdzono lokalnie; nie jest potrzebne powtórzenie ich w produkcji.

## Procedura pakietu — już wykonana

1. Zachowaj aktualny backup. Uruchom cały `docs/catalogue/nonkgp-04/apply.sql`
   jako właściciel w Supabase SQL Editor.
2. Uruchom w nowym zapytaniu cały `docs/catalogue/nonkgp-04/verify.sql`.
3. Oczekuj 4 wierszy: trails=1, pois=1, mapped_trails=1, oba zestawy języków
   `[en,pl,ua,zh]`, review_matches=true oraz package_applied=true.
4. Odśwież stronę i sprawdź trasy/POI/mapę. Dopiero verify potwierdza produkcję.

Oba pakiety zostały już wykonane. Mają rozłączne rekordy i osobne rejestry.
Merge publikuje pliki, nie wykonuje SQL. Rollback jest narzędziem awaryjnym,
nie następnym krokiem. SQL jest ASCII-only; teksty mają Unicode JSON.

## Źródła i dokładne końce — 23 listopada 2026

| Szczyt | Wybrany odcinek w jednym kierunku | Parametry z jego karty | GPX |
| --- | --- | --- | --- |
| Krzemień | Wołosate → przełęcz pod Tarnicą → Goprowska → punkt na niebieskim szlaku **pod wierzchołkiem**, 49.086537/22.737598. | 5,4 km / 692 m / 153 min | [Karta](https://mapa-turystyczna.pl/route?q=49.0621450,22.6862450;49.0865370,22.7375980), [339 punktów](https://mapa-turystyczna.pl/route/export?q=49.0621450,22.6862450;49.0865370,22.7375980) |
| Jaworzyna Kamienicka | Schronisko Turbacz → Gabrowska → Trzy Kopce → **polana**, 49.549650/20.158676; czerwony i zielony. | 3,6 km / 117 m / 63 min | [3n28c](https://mapa-turystyczna.pl/route/3n28c), [161 punktów](https://mapa-turystyczna.pl/route/3n28c.gpx) |
| Kudłoń | Punkt przy Przysłopie 49.5936992/20.2245662 → Podskały → Gorc Troszacki → Kudłoń. Głównie żółty, końcówka wspólna z zielonym/czarnym. | 5,6 km / 592 m / 144 min | [Karta](https://mapa-turystyczna.pl/route?q=49.5937260,20.2245920;49.5725870,20.1762270), [242 punkty](https://mapa-turystyczna.pl/route/export?q=49.5937260,20.2245920;49.5725870,20.1762270) |
| Jelenia Kopa | Przełęcz Kłodzka → punkt na niebieskim szlaku w rejonie Jeleniej Kopy 50.447812/16.757833. | 2,2 km / 289 m / 60 min | [Karta](https://mapa-turystyczna.pl/route?q=50.4313700,16.7649340;50.4478120,16.7578330), [93 punkty](https://mapa-turystyczna.pl/route/export?q=50.4313700,16.7649340;50.4478120,16.7578330) |

Trzy GPX to publiczne eksporty parametrowe dostawcy, jeden ma adres skrócony.
Nie zamieniaj adresów samodzielnie: metadane GPX wiążą ślad z jego wariantem.
Wszystkie punkty zachowano, każdy ślad ma jeden segment, bez przycinania,
upraszczania i dopisywania dojść. Geometria jest 2D; nie deklarujemy profilu
wysokościowego. Czasy są szacunkami źródła; `difficulty=null`.

### Granice, których nie wolno zmieniać przez domysł

- **Krzemień:** to dojście do konkretnego punktu na znakowanym szlaku poniżej
  wierzchołka. Nie jest ofertą wejścia na szczyt. Wierzchołek, wejście na Tarnicę
  i powrót są wyłączone w każdej wersji językowej. Ślad nie ma łącznika do pinezki.
- **Jaworzyna:** celem jest polana na zboczu, nie wierzchołek 1288 m. Start jest
  już przy schronisku Turbacz; dojście z doliny i powrót nie są wliczone.
  Jest to przejście, a nie bezpośrednie wejście na szczyt. Nie użyto dłuższego
  wariantu PTTK 128 ani nie skopiowano z niego parametrów.
- **Kudłoń:** [PTTK 4](https://malopolska.szlaki.pttk.pl/4-pttk-malopolska-lubomierz-rzeki-granica-gpn-kudlon)
  zaczyna się w innym punkcie i podaje 4,6 km / 531 m / 130 min. Nie mieszamy
  tego starszego wariantu z wybranym pełnym śladem 5,6 km od Przysłopu.
- **Jelenia Kopa:** nie obejmuje dalszego odcinka do Kłodzkiej Góry i wieży.
  Nie mylić z inną Jelenią Kopą koło Nowej Morawy w Górach Bialskich.
- Nie poprawiamy wysokości ani współrzędnych rodziców przy imporcie tras.

## POI

| Szczyt | Punkt / typ / pozycja | Źródło i ograniczenia |
| --- | --- | --- |
| Krzemień | Wiata przy przełęczy Goprowskiej / shelter / 49.081097, 22.730772 | [Mapa Turystyczna](https://mapa-turystyczna.pl/node/wiata-przy-przeleczy-goprowskiej). Wiata szlakowa na wybranym odcinku, bez potwierdzenia obsługi, noclegu czy wyposażenia. |
| Jaworzyna | Polana i rejon kapliczki Bulandy / attraction / 49.549598, 20.158795 | [PTTK 1254](https://malopolska.szlaki.pttk.pl/1254-pttk-malopolska-polana-jaworzyna-kamienicka), [Gmina Ochotnica](https://turystyka.ochotnica.pl/miejsca/227). Punkt obszaru polany, nie obrys budynku. |
| Kudłoń | Podskały, rejon szałasów / attraction / 49.585423, 20.195796 | [PTTK 1711](https://malopolska.szlaki.pttk.pl/1711-pttk-malopolska-podskaly). Obszar polany z dawną zabudową pasterską, bez gwarancji wejścia do budynków lub noclegu. |
| Jelenia Kopa | Przełęcz Kłodzka, początek podejścia / trailhead / 50.431370, 16.764934 | [Mapa Turystyczna](https://mapa-turystyczna.pl/node/przelecz-klodzka). Punkt orientacyjny, nie karta parkingu ani rozkład komunikacji. |

POI są przypisane do szczytu (`trail_id=null`); każdy leży przy wybranym odcinku.
Punkty obszarowe nie oznaczają granic lub konkretnego szałasu. Nie dodano cen,
godzin, pojemności, parkingów, toalet ani dostępności usług bez źródeł.

## Dostęp i granice weryfikacji

- [Komunikat GPN](https://gpn.gov.pl/komunikat-turystyczny), odczytany 23 listopada,
  zawiera informację z 16 listopada o śniegu powyżej 1000 m i śliskich drewnianych
  elementach. Notatki odsyłają do aktualnych zasad i warunków; nie są alertem na żywo.
- [Regulamin GPN 2026](https://gpn.gov.pl/pliki-do-pobrania/otworz/10b07c0e-eba2-4e7e-9928-fac8f5fbed00.pdf)
  wskazuje poruszanie się po udostępnionych szlakach. Nie przedstawiamy starych,
  wiosennych ograniczeń nocnych jako potwierdzonego zamknięcia w listopadzie.
- [Zasady BdPN](https://bdpn.gov.pl/regulamin-i-oplaty), [wykaz szlaków](https://bdpn.gov.pl/szlaki)
  i komunikat parku należy sprawdzić przed wyjściem. Odczyt części stron parków
  zwracał 503/time-out; nie twierdzimy, że potwierdzono otwarcie na żywo.
  Punkt końcowy Krzemienia został wybrany **na oznakowanym niebieskim szlaku**,
  bez wejścia poza jego przebieg.

GPX i data sprawdzenia nie potwierdzają dostępności ani bezpieczeństwa.
Metadane oraz pełne fingerprinty GPX: [geometry-review.json](geometry-review.json).
Kontrola normalizuje jedynie wspólne przesunięcie generowanych czasów eksportu;
wszystkie współrzędne, wysokości, względne czasy, teksty i linki muszą pozostać zgodne.

Dane rodziców pochodzą z publicznego odczytu z 23 listopada, zachowanego przed
zgłoszoną awarią Supabase. Nie są świeżym odczytem podczas awarii. Import sprawdza
je ponownie w transakcji i odmówi po zmianie tożsamości lub dodaniu innych treści.
Nie ma dostępu administracyjnego agenta ani zapisu do produkcji.

## Srebrna Góra — osobna blokada

[unresolved.json](unresolved.json) zachowuje istniejącą tożsamość i źródło PTTK.
Rekord 54 łączy opis atrakcji historycznych i pasmo Bardzkie z pinezką znacznie
oddaloną od miejscowości/twierdzy Srebrna Góra. Nie dopinamy mu fortecznych POI,
nie zamieniamy miejscowości w szczyt i nie przesuwamy go automatycznie. Korekta
będzie osobnym, udokumentowanym zakresem, razem z pogodą, jeśli zmieni się położenie.

## Testy i transakcja

```sh
python scripts/build_nonkgp_04.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Wyłącznie dedykowana lokalna baza nonkgp_04_test:
python supabase/tests/nonkgp_04_test.py
python scripts/build_nonkgp_04.py --check --check-sources
```

Jedna transakcja, osobny prywatny rejestr i pełne migawki ośmiu rekordów/tekstów.
Odmowa szkiców i innych istniejących treści, konfliktów slugów, późniejszych edycji
oraz zmiany rodziców/pasm. Chronione cofanie wykrywa zależności FK, także później
dodane CASCADE/SET NULL; nie zmienia pól szczytów ani poprzednich importów.
Testy sprawdzają dokładne 32 teksty, geometrie PostGIS, uprawnienia publiczne,
ponowienie/cofanie, późny błąd transakcji i **obie kolejności wdrożenia 03/04**.
Fixture nie zastępuje prywatnego restore. Testy UI korzystają z treści partii
w atrapach API; produkcję potwierdza wynik verify właściciela.
