# Co jest przygotowane i co wykonać po backupie

Stan: 17.11.2026. Nie wykonano przez agenta żadnego z poniższych zapisów produkcyjnych. Właściciel scalił PR #15, #16 i #17; scalanie kolejnych PR też samo nie uruchamia SQL.

## Teraz, bez komputera

Możesz przeglądać i scalać przygotowane PR-y. Kod i statyczne GPX trafiają wtedy do `main`. Dane w Supabase zmienią się dopiero po ręcznym wykonaniu odpowiednich skryptów. Nie uruchamiaj plików `apply.sql` tylko dlatego, że PR został scalony.

## Jedna kolejność po powrocie do komputera

Najpierw pobierz aktualny kod i wykonaj [backup](windows-backup.md). Zachowaj spisy i metadane kopii. Przed każdym etapem wykonaj jego `verify.sql`; jeśli stan różni się od oczekiwanego lub wystąpi konflikt, zatrzymaj ten etap i przejrzyj rekordy, zamiast usuwać zabezpieczenia albo importować ponownie na ślepo.

| Kolejność | Cel i PR | Co uruchomić w SQL Editor po weryfikacji |
| --- | --- | --- |
| 1 | 20 szczytów, [PR #15](https://github.com/Silentmaster86/peakguide/pull/15) | `docs/catalogue/twenty-peaks/apply.sql` — jeden wspólny plik, nie osobno 02 i 03 |
| 2 | 3 pozostałe pozycje KGP, [PR #17](https://github.com/Silentmaster86/peakguide/pull/17) | `docs/catalogue/batch-04/apply.sql` |
| 3 | 4 brakujące GPX pierwszej partii, [PR #18](https://github.com/Silentmaster86/peakguide/pull/18) | `docs/catalogue/gpx-completion/apply.sql` — aktualizacja istniejących tras, wymaga rejestru partii 01 |
| 4 | 3 poprawki pinezek, [PR #19](https://github.com/Silentmaster86/peakguide/pull/19) | `docs/catalogue/coordinate-review/apply.sql` |
| 5 | Ukrycie niepotwierdzonego wpisu Łysicy, [PR #16](https://github.com/Silentmaster86/peakguide/pull/16) | `docs/catalogue/lysica-review/apply.sql` |

Ścieżki mają sens dopiero po scaleniu odpowiednich PR do `main`. Każdy katalog zawiera własny `verify.sql`, `rollback.sql` oraz README ze źródłami i wyjątkami. Nie powtarzaj już wdrożonej migracji 014 ani pierwszego importu 01. Narzędzie backupu nie uruchamia żadnego SQL ani merge.

Etapy 3–5 są niezależne od importu 20; pokazana kolejność ułatwia kontrolę, ale korekta współrzędnych nie zmienia snapshotów tras/POI. Gdyby operacja była już wykonana, jej chronione powtórzenie jest no-op tylko dla niezmienionych rekordów; zawsze zacznij od verify.

## Wynik, którego oczekujemy

Po etapach 1–3 wszystkie 28 aktywnych pozycji KGP mają po co najmniej jednej trasie, przebiegu mapowym i POI. **Wysoka Kopa to dojście czerwonym szlakiem do Sinych Skałek, bez zamkniętego wierzchołka.** To pokrycie wybranymi trasami, a nie pełny zestaw wszystkich szlaków i atrakcji.

Po etapie 4 Śnieżnik, Rudawiec i Lackowa mają pinezki zgodne ze sprawdzonymi punktami. Po etapie 5 pozostaje jeden publiczny wpis Łysicy; dodatkowy id 83 jest nieaktywny, nie usunięty. Jeśli w międzyczasie nie było innych zmian, publiczny licznik wszystkich szczytów spadnie z 89 do 88, a Polski z 83 do 82.

Końcowa kontrola: mapa z warstwami tras i POI, pobranie GPX, PL/EN/UA/ZH, szczegóły kilku szczytów, zachowanie pierwszych pięciu tras. Nie uznawaj testów na fixture ani zielonego CI za dowód wykonania produkcyjnych importów.

## Cofanie

Cofaj konkretną operację, a nie całą bazę dla pojedynczej poprawki. Najpierw jej aktualny `rollback.sql`, który chroni późniejsze edycje. Dla pełnego cofania obowiązuje odwrotna kolejność zależności:

- uzupełnienie GPX przed cofnięciem całej partii 01;
- wspólny rollback pakietu 20 usuwa obie części 02 i 03; aby zachować 02, cofaj samą 03;
- cofnięcie ukrycia Łysicy wymaga także ponownego dodania jej URL do sitemap i wdrożenia strony.

Nie odtwarzaj starej kopii produkcji bez planu: nadpisałaby także inne późniejsze dane. Pełny restore sprawdzamy najpierw w izolacji według [procedury utrzymania](remaining-work.md).

## Co pozostaje poza tą serią

1. Kontrolowany test zapisu edytorów tras/POI na rzeczywistym środowisku stagingowym. Automatyczne testy mają atrapy API i osobne bazy.
2. Próbne odtworzenie świeżego backupu i odtwarzalny pełny schemat — wymagają prywatnej kopii i zgodnego środowiska; publiczne API nie wystarczy.
3. Pozostałe szczyty poza KGP, zdjęcia z udokumentowaną licencją, kolejne rzeczywiste trasy/POI. Nie kopiować niezweryfikowanych parametrów ani wymyślać geometrii.
4. Oddzielny projekt językowych URL/prerender SEO, pomiary wydajności i dostępności. Nie mieszać przebudowy routingu z operacjami danych.
5. Poczta i stara Edge Function: zdrowie kolejki/logi, bez wysyłania testów do cudzych kont i bez usuwania funkcji na podstawie samego braku odwołań w repo.
