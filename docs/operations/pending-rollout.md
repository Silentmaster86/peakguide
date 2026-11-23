# Kolejka wdrożeń — merge i SQL osobno

Stan: 23 listopada 2026. Właściciel zgłosił niedostępność Supabase i odłożył SQL.
Agent kontynuuje niezależne prace, a tutaj pozostawia kolejność i dokładne pliki.
**Scalony PR oraz zielone CI nie potwierdzają importu danych do produkcji.**

## Do wykonania, gdy Supabase wróci

| Kolejność | Pakiet i merge | SQL w Supabase SQL Editor | Oczekiwany wynik verify |
| --- | --- | --- | --- |
| 1 | **[#37](https://github.com/Silentmaster86/peakguide/pull/37) scalony**; `nonkgp-03`. SQL odłożony przez właściciela, brak potwierdzenia wykonania. | Cały [apply.sql](../catalogue/nonkgp-03/apply.sql), następnie cały [verify.sql](../catalogue/nonkgp-03/verify.sql). | 5 wierszy: po 1 trasie, POI i geometrii; oba zestawy 4 języków; review_matches=true, package_applied=true. |
| 2 | `nonkgp-04`, [PR gałęzi data/nonkgp-04](https://github.com/Silentmaster86/peakguide/pulls?q=is%3Apr+head%3Adata%2Fnonkgp-04). Najpierw merge po zielonym CI. **SQL nie jest wykonany.** | Cały [apply.sql](../catalogue/nonkgp-04/apply.sql), następnie cały [verify.sql](../catalogue/nonkgp-04/verify.sql). | 4 wiersze z tymi samymi warunkami. Zakres Krzemienia kończy się na szlaku pod wierzchołkiem; Jaworzyny — na polanie. |

Przy kopiowaniu z GitHuba: otwórz plik → **Raw** → skopiuj całą treść do nowego
zapytania SQL Editor. Zachowaj aktualny backup. Nie uruchamiaj rollback.sql jako
kolejnego kroku wdrożenia. Jeśli kontrola konfliktu/edycji zatrzyma import, zachowaj
komunikat i nie omijaj zabezpieczeń. `Success` bez wyniku verify nie zamyka zadania.

Pakiety dotyczą różnych rekordów. Lokalnie przetestowano obie kolejności importu
03/04 oraz cofnięcie wyłącznie nowej partii. Powyższa kolejność służy czytelnemu
odrabianiu zaległości; brak SQL #37 nie blokuje przygotowania ani merge kolejnego PR.
Nie oznaczać żadnej z tych partii jako wdrożonej bez wyniku właściciela.

## Potwierdzone — nie ponawiać

- KGP: 28/28 ma trasę z geometrią/GPX i POI w 4 językach; karty dostępu 28/28,
  parkingi 25/28. To nie komplet wszystkich możliwych tras i usług.
- `twenty-peaks`, batch-04, gpx-completion, coordinate-review, lysica-review,
  utf8-repair: właściciel wykonał i zweryfikował wcześniejsze poprawki.
- `foreign-gpx-01`: Howerla i Krywań — geometria/GPX potwierdzone; ostrzeżenie
  sezonowe Krywania również potwierdzone osobno.
- `nonkgp-01` / #35: 4/4 wiersze zgodne, Śnieżnica ma pasmo Wyspowy.
- `nonkgp-02` / #36: 4/4 wiersze zgodne, komplet tras/POI/geometrii i 4 języków.
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
