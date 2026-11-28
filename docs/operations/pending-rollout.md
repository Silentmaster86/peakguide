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

## Następna poprawka — klawiatura w nawigacji

Gałąź `fix/navbar-keyboard-dismissal` poprawia otwieranie menu strzałkami,
zamykanie po Tab/Shift+Tab i wyjściu fokusu oraz początkowy fokus języka/motywu.
Problem odtworzono na produkcji; poprawka pozostaje w przygotowaniu.
[Zakres i dowody](../audit/2026-11-28/README.md). Tylko merge po testach, bez SQL.

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
