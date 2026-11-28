# Kolejka wdrożeń — merge i SQL osobno

Stan: 28 listopada 2026. Właściciel potwierdził verify #37 (5/5) i #38 (4/4):
po 1 trasie, POI i geometrii, PL/EN/UA/ZH, review_matches/package_applied=true.
**Nie ma już zaległego SQL z #37/#38. Nie powtarzać importów.** #39 scalony, bez SQL.

## Import #40 — zakończony

Właściciel przekazał 25 listopada pełny wynik zbiorczego verify: **5/5 wierszy**.
Stóg Izerski, Wysoki Kamień, Czarna Góra, Kalenica i Wieżyca mają po jednej trasie,
POI i geometrii, oba zestawy języków `[en,pl,ua,zh]`, `review_matches=true` oraz
`package_applied=true`. [Zapis wyniku](../catalogue/nonkgp-05-06/production-verification.json).

**Nie ma zaległego SQL dla partii 05/06. Nie ponawiać wspólnego ani osobnych importów.**
`apply.sql`, `verify.sql` i rollbacki pozostają dokumentacją/narzędziami utrzymania,
a nie kolejnymi zadaniami właściciela. #37/#38 również są już zamknięte.

Przyszłe pakiety nadal zbieramy do wspólnego okna. Agent przygotowuje źródła,
kod, testy i PR-y; właściciel scala oraz wykonuje ewentualny nowy produkcyjny SQL.
Zakończenie #40 nie oznacza uruchomienia następnych importów w tle.

## Profile wysokościowe — wdrożone

#46 i #47 są już scalone; produkcyjne wykresy i grupowanie sprawdzono 25 listopada.
Nie są zaległymi merge ani importami. [Wynik kontroli](../catalogue/elevation-profiles/production-rollout-46-47.json).

#48 scalony 28 listopada (`0a85cd2`), potwierdzony przez właściciela i GitHub.
Publiczny przegląd produkcji potwierdził pięć dalszych profili: Stóg Izerski,
Wysoki Kamień, Czarna Góra, Kalenica, Wieżyca. Sprawdzono wykresy, koniec suwaka
klawiaturą, cztery języki, Light/Dark i szerokości 320/390/1440 px.
[Raport](../catalogue/elevation-profiles/production-rollout-48.json).
Łącznie wdrożono 9 profili / 1278 próbek. **Bez zaległego merge lub SQL dla #48.**

## Nawigacja #49 — wdrożona

#49 scalony 28 listopada (`3f41a11`), potwierdzony przez właściciela i GitHub.
Publiczny przegląd produkcji: strzałki, Tab/Shift+Tab, Escape, aktywny język/motyw,
PL/EN/UA/ZH, Light/Dark, 390/1440 px i Axe otwartej nawigacji.
[Raport](../audit/2026-11-28/production-rollout-49.json). Bez zaległego merge/SQL.

## Partia 07 — przygotowana, SQL odłożony

#50 scalony (`9ccbc0a`, 28 listopada), potwierdzenie właściciela i GitHub.
`feat/nonkgp-catalogue-07`: Suchawa i Lesista Wielka, 2 trasy z GPX, 2 POI,
16 tekstów i 2 profile wysokości z 247 rzeczywistych próbek. Bez edycji szczytów.
**Nie są jeszcze wdrożone w bazie.** Merge przygotowuje kod i pliki; SQL może
poczekać na większe wspólne okno. Nowe profile pozostają ukryte do importu.

Osobne pliki partii 07 (alternatywa dla wspólnego okna poniżej):

1. `docs/catalogue/nonkgp-07/verify.sql` — odczyt przed importem.
2. `docs/catalogue/nonkgp-07/apply.sql` — transakcja tylko nowej partii.
3. `docs/catalogue/nonkgp-07/verify.sql` — 2/2 wiersze, trasa/POI/geometria po 1,
   języki `[en,pl,ua,zh]`, `review_matches=true`, `package_applied=true`.
4. Kontrola publicznej mapy i profili; nie utożsamiać merge z wykonanym SQL.

[Zakres, źródła i testy](../catalogue/nonkgp-07/README.md).
[Odczyt przed wdrożeniem](../catalogue/nonkgp-07/public-baseline.json).
[Pełny raport katalogu](../audit/2026-11-28/catalogue-coverage.json): 88 aktywnych
szczytów, KGP 28/28 z trasą/POI/geometrią/dostępem; poza KGP 32 bez trasy,
35 bez POI. To obecny publiczny stan, bez doliczania przygotowanej partii 07.

## Partia 08 i wspólne okno 07–08 — przygotowane, bez importu

Wołek, Trzy Korony, Zamkowa Góra w Górach Opawskich i Srebrna Kopa:
4 trasy/POI, 32 teksty PL/EN/UA/ZH, 842 punkty GPX i 4 profile.
[Zakres i źródła](../catalogue/nonkgp-08/README.md),
[publiczny stan przed importem](../catalogue/nonkgp-08/public-baseline.json).
Nie zmieniają szczytów ani danych partii 07. Na razie właściciel tylko scala kod.

**Docelowy pojedynczy import obejmuje sześć szczytów, nie wymaga osobnych wkleiń:**

1. `docs/catalogue/nonkgp-07-08/verify.sql` — 6 wierszy przed importem.
2. `docs/catalogue/nonkgp-07-08/apply.sql` — jedna transakcja obu partii.
3. Ponownie wspólne `verify.sql` — 6/6 wierszy z trasą/POI/geometrią po 1,
   oba zestawy języków `[en,pl,ua,zh]`, obie flagi `true`.
4. Publiczny przegląd sześciu kart/profili. Dopiero wtedy potwierdzamy wdrożenie.

[Pełna instrukcja wspólnego okna](../catalogue/nonkgp-07-08/README.md).
SQL nadal odłożony. Nie ponawiać #37/#38/#40. Kod przygotowuje 15 profili / 2367
próbek; produkcja ma 9 / 1278 do wykonania nowego SQL.
Po udanym imporcie sześciu nowych par liczby braków powinny spaść z 32/35 do
26/29 (trasy/POI poza KGP); wymaga to potwierdzenia, nie jest obecnym wynikiem.

## Potwierdzone — nie ponawiać

- KGP: 28/28 ma trasę z geometrią/GPX i POI w 4 językach; karty dostępu 28/28,
  parkingi 25/28. To nie komplet wszystkich możliwych tras i usług.
- `twenty-peaks`, batch-04, gpx-completion, coordinate-review, lysica-review,
  utf8-repair: właściciel wykonał i zweryfikował wcześniejsze poprawki.
- `foreign-gpx-01`: Howerla i Krywań — geometria/GPX potwierdzone; ostrzeżenie
  sezonowe Krywania również potwierdzone osobno.
- `nonkgp-01` / #35: 4/4 wiersze zgodne, Śnieżnica ma pasmo Wyspowy.
- `nonkgp-02` / #36: 4/4 wiersze zgodne, komplet tras/POI/geometrii i 4 języków.
- `nonkgp-03` / #37: 5/5 wierszy zgodnych, właściciel przekazał verify 24 listopada.
- `nonkgp-04` / #38: 4/4 wiersze zgodne, właściciel przekazał verify 24 listopada.
- `nonkgp-05` + `nonkgp-06` / #40: właściciel potwierdził 25 listopada 5/5 zgodnych wierszy.
- #39: scalona poprawka formatowania czasu, nie wymaga SQL.
- #41/#42: navbar, przewijanie, kafelki mapy i spójne markery scalone; bez SQL.
- #43/#44: nowe karty pogody/słońca i poprawka zakładek scalone; bez SQL.
- #45: pełna strona /weather i backend scalone 25 listopada; publiczna prognoza działa.
- #46/#47: pierwsze cztery profile i poprawka grup markerów scalone; publiczny UI zweryfikowany.
- #33/#34: pogoda i światło dzienne zgłoszone przez właściciela jako działające.

## Przy następnej awarii lub odłożeniu wdrożenia

1. Zapisz numer PR i faktyczny stan merge, osobno stan SQL.
2. Podaj dokładne ścieżki/linki apply.sql i verify.sql oraz oczekiwany wynik.
3. Dopisz zależności i kolejność. Zależny kod przygotowuj na wyraźnie oznaczonej
   gałęzi; niezależne zmiany kontynuuj na aktualnym main.
4. Kontynuuj frontend, backend, źródła, lokalne testy i kolejne PR-y. Nie kończ
   pracy tylko dlatego, że właściciel chwilowo nie może wykonać SQL.
5. Po otrzymaniu verify zaktualizuj tę kolejkę i handoff; nie utożsamiaj merge
   ani testowej bazy z produkcyjnym wdrożeniem.

Nie proś o hasła ani dump bazy w czacie. Backup/restore:
[Windows](windows-backup.md), [izolowane odtwarzanie](remaining-work.md).
SQL nowych partii jest ASCII-only z Unicode JSON. Przy innych plikach zawierających
znaki narodowe i kopiowaniu z Windows używaj jawnego UTF-8:

```powershell
Get-Content .\SCIEZKA\PLIK.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Dalsze zadania i źródła: [handoff](../handoff/NEXT-AGENT.md),
[plan wykonawczy](delivery-plan.md). Pełny restore prywatnego backupu nadal nie jest
potwierdzony; test na fixture i odczyt spisu archiwum go nie zastępują.
