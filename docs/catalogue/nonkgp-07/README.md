# Poza KGP — partia 07: Suchawa i Lesista Wielka

Przygotowane 28 listopada 2026, **jeszcze niewdrożone do bazy**. Dwie trasy,
dwa POI, 16 tekstów PL/EN/UA/ZH, 247 punktów GPX oraz dwa profile wysokości.
Nie zmienia szczytów, ich pinezek, wysokości, pasm, uprawnień ani starych importów.

## Zakres tras

| Szczyt | Dokładny wariant w jedną stronę | Parametry źródła | GPX |
| --- | --- | --- | --- |
| Suchawa, id 48 | Rejon Andrzejówki 50.685368/16.278288 → Rozdroże pod Waligórą → punkt na niebieskim szlaku 50.6805463/16.2664411 | 1,9 km / 132 m podejścia / 43 min | [Karta](https://mapa-turystyczna.pl/route?q=50.6853590,16.2783265;50.6805980,16.2664580), [88 punktów](https://mapa-turystyczna.pl/route/export?q=50.6853590,16.2783265;50.6805980,16.2664580) |
| Lesista Wielka, id 47 | Mieroszów 50.666706/16.186379 → dojście drogą do żółtego szlaku przy cmentarzu → Lesista Wielka 1, 50.702665/16.191591 | 4,8 km / 350 m podejścia / 108 min | [Karta](https://mapa-turystyczna.pl/route/kmo2), [159 punktów](https://mapa-turystyczna.pl/route/kmo2.gpx) |

Oba pełne, pojedyncze segmenty zachowano punkt po punkcie. Nie dopisano powrotów,
łączników do istniejących pinezek szczytów ani dojścia do szczeliny. Początek
Suchawy został przez dostawcę dopasowany do węzła szlakowego; zapisano faktyczne
punkty eksportu, nie wejściowe współrzędne zapytania. Krótkie początkowe odcinki
mają wspólne kolory szlaków, dalej podejście prowadzi niebieskim. `difficulty=null`;
kolor nie jest oceną trudności. Dystans i czas to wartości karty tego wariantu,
nie suma na wejście i zejście ani nowe pomiary PeakGuide.

[PTTK Suchawa](https://dolnoslaskie.szlaki.pttk.pl/2345-dolnoslaskie-suchawa)
potwierdza położenie w Górach Suchych, w obrębie Gór Kamiennych.
[PTTK Lesista Wielka](https://dolnoslaskie.szlaki.pttk.pl/2009-dolnoslaskie-lesista-wielka)
potwierdza Góry Kamienne i szczeliny na zboczach. Karta PTTK Lesistej podaje różne
wysokości w nagłówku i opisie (856/860 m), Mapa Turystyczna 851 m. Pakiet nie
rozstrzyga tej różnicy i nie nadpisuje istniejących 851 m szczytu.

Fingerprinty pełnych GPX, wszystkich współrzędnych, wysokości i względnych czasów:
[geometry-review.json](geometry-review.json). Kolejne pobranie jest porównywane
z tym przeglądem, bez akceptowania zmiany samym przeliczeniem hasha.

## POI i pochodzenie lokalizacji

- **Suchawa — Schronisko PTTK Andrzejówka**, `shelter`, 50.684767/16.277919.
  [Karta PTTK](https://dolnoslaskie.szlaki.pttk.pl/1120-dolnoslaskie-schronisko-andrzejowka)
  publikuje ten punkt i opis węzła na Przełęczy Trzech Dolin. Zachowano znacznik
  źródłowy; nie jest to nowy pomiar obrysu budynku. Nie obiecujemy dostępności
  noclegów, usług ani parkowania. To osobna karta przy Suchawie, nie edycja POI
  przypisanych do Waligóry.
- **Lesista Wielka — mała szczelina wiatrowa**, `attraction`, 50.7024/16.2037.
  [GeoSudety, obiekt 187](https://geosudety.pl/objects/show/187) publikuje ten
  społecznościowy punkt z opisem i fotografią. W danych użyto dokładnie czterech
  miejsc dziesiętnych widocznych na karcie, bez pozornej precyzji binarnych liczb
  w JSON-LD. PTTK potwierdza zjawisko szczelin w tym masywie, ale nie ten konkretny
  punkt. Cztery języki jawnie podają społecznościowe źródło lokalizacji. Nie
  deklarujemy formalnego statusu pomnika przyrody na podstawie tagu GeoSudety.
  Punkt leży około 0,85 km na wschód od końca wybranej trasy; dojścia nie ma w GPX.

Oba POI mają `trail_id=null`: nie są deklaracją, że ślad przechodzi przez każdy
obiekt. Nie kopiowano fotografii ani opisów źródłowych; teksty kart napisano
osobno. Nie dodano opłat, godzin, parkingów ani rozkładów bez ich przeglądu.

## Profile wysokościowe i frontend

Wszystkie 247 punktów GPX zawierają rzeczywiste wartości `ele`. Rejestr
`docs/catalogue/elevation-profiles/review.json` oraz generator obejmują teraz
partię 07. Dwa pliki danych są ładowane na żądanie. Wykres pozostaje ukryty,
jeśli slug, peak_id, źródło, GPX lub choć jeden punkt geometrii nie zgadzają się
z przejrzanym rekordem. Dziewięć wcześniej wdrożonych profili pozostaje bez zmian.

Po merge kod będzie przygotowany na **11 profili / 1525 próbek**, ale nowe dwa
staną się widoczne dopiero po wykonaniu importu. Zapis produkcyjnego odczytu
[public-baseline.json](public-baseline.json) potwierdza brak widocznych aktywnych
tras/POI dla tych dwóch szczytów; nie wyklucza ukrytych szkiców. SQL sprawdza je
oddzielnie i odmawia dopisania duplikatów.

## Wdrożenie — można odłożyć do większego wspólnego okna

Właściciel scala PR. **Nie ma potrzeby wykonywania SQL od razu.** Nie ponawiać
zamkniętych #37/#38/#40 ani ich importów. W nowym oknie, z aktualną kopią bazy:

1. [verify.sql](verify.sql) — odczyt stanu przed importem.
2. [apply.sql](apply.sql) — jedna transakcja nowej partii 07.
3. [verify.sql](verify.sql) — dwa wiersze, po jednej trasie/POI/geometrii,
   języki `[en,pl,ua,zh]`, `review_matches=true`, `package_applied=true`.
4. Publiczny przegląd mapy, POI i dwóch wykresów po imporcie.

Pliki SQL są ASCII-only z Unicode wewnątrz JSON. Do schowka Windows:

```powershell
Get-Content .\docs\catalogue\nonkgp-07\apply.sql -Encoding UTF8 -Raw | Set-Clipboard
```

[rollback.sql](rollback.sql) to narzędzie awaryjne. Odmawia cofania po późniejszych
edycjach lub dodaniu zależnych rekordów, także przez przyszłe FK CASCADE/SET NULL.
Import chroni tożsamości i pełne typowane rekordy/tłumaczenia. Nie uruchamia
poczty, sieci, crona ani starszych partii. Fixture testowa nie zastępuje restore
prywatnego backupu produkcyjnego.

## Sprawdzenia

```sh
python scripts/build_nonkgp_07.py --check --check-sources
python scripts/build_elevation_profiles.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Wyłącznie dedykowana lokalna baza nonkgp_07_test:
python supabase/tests/nonkgp_07_test.py
# Z peakguide_front:
npx playwright test e2e/nonkgp-catalogue-07.spec.mjs
```

Testy obejmują pełne teksty 4 języków, źródła i zakresy, brak łącznika do POI,
profile i klawiaturę, transakcję po późnym błędzie, powtórzenie, cofanie, późniejsze
edycje, ukryte treści i niezależność wdrażania wobec zamkniętej partii 06.
