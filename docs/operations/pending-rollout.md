# Kolejka wdrożeń — merge i SQL osobno

Stan: 24 listopada 2026. Właściciel potwierdził verify #37 (5/5) i #38 (4/4):
po 1 trasie, POI i geometrii, PL/EN/UA/ZH, review_matches/package_applied=true.
**Nie ma już zaległego SQL z #37/#38. Nie powtarzać importów.** #39 scalony, bez SQL.

## Kolejne pakiety — zbieramy do wspólnego wgrywania

Właściciel poprosił o kontynuację i informację o wgrywaniu dopiero po zebraniu
większej liczby gotowych pakietów. Nie prosić o SQL przy każdej małej partii.
Agent przygotowuje kolejne PR-y/testy i aktualizuje tę tabelę; właściciel nadal
sam scala PR-y i wykonuje produkcyjny SQL. Nie tworzyć automatycznego harmonogramu.

| Pakiet / merge | SQL przy wspólnym wdrożeniu | Oczekiwany wynik |
| --- | --- | --- |
| `nonkgp-05`, [PR gałęzi data/nonkgp-05](https://github.com/Silentmaster86/peakguide/pulls?q=is%3Apr+head%3Adata%2Fnonkgp-05). Przygotowany; najpierw merge po zielonym CI. **SQL niewykonany; do zbiorczego okna.** | Cały [apply.sql](../catalogue/nonkgp-05/apply.sql), potem [verify.sql](../catalogue/nonkgp-05/verify.sql). | 2 wiersze: Stóg Izerski i Wysoki Kamień; trails/pois/mapped_trails=1, oba zestawy 4 języków, review_matches/package_applied=true. |

Przy kopiowaniu: GitHub → plik → **Raw** → cała treść do nowego zapytania SQL Editor.
Zachowaj aktualny backup. Nie uruchamiaj rollback.sql jako kolejnego kroku.
Konfliktu/edycji nie omijaj; zachowaj komunikat. `Success` bez verify nie zamyka zadania.
Merge i zielone CI nie oznaczają importu do produkcji. Pakiet 05 nie wymaga ponownego
uruchomienia 04; obie kolejności testowano na lokalnej bazie.

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
- #39: scalona poprawka formatowania czasu, nie wymaga SQL.
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
