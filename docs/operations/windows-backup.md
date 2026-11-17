# Backup bazy PeakGuide na Windows

Gotowy skrypt: [`scripts/backup_database.ps1`](../../scripts/backup_database.ps1). Wymaga `pg_dump` i `pg_restore` w PATH, dostępu do internetu oraz hasła bazy. Node i Docker nie są potrzebne. Użytkownik wcześniej używał PostgreSQL 17.6; jeśli serwer jest nowszy od klienta, `pg_dump` odmówi eksportu — wtedy potrzebny jest klient zgodny z wersją serwera.

## Najkrótsza instrukcja dla właściciela

1. Otwórz PowerShell w lokalnym folderze repozytorium PeakGuide. Sprawdź `git status`; zachowaj własne niezapisane zmiany przed przełączaniem gałęzi.
2. Po scaleniu PR z narzędziem pobierz aktualny kod:

```powershell
git switch main
git pull --ff-only
.\scripts\backup_database.ps1
```

3. W Supabase otwórz **Connect → Session pooler**. Przepisz/skopiuj Host oraz User do pytań skryptu. Używany port to domyślnie 5432, baza `postgres`. Nie wklejaj całego connection string ani klucza API.
4. `pg_dump` zapyta o **hasło bazy**, nie hasło konta Supabase. Wpisz je lokalnie; znaki mogą nie być widoczne. Skrypt nie przyjmuje hasła jako argumentu ani nie zapisuje go do pliku.
5. Zaczekaj na komunikat `Export complete; archive list readable`. Odczytaj końcowe FullName, Length i SHA256. Do rozmowy wystarczy nazwa/rozmiar oraz ewentualny komunikat błędu — nie wysyłaj dumpa ani hasła.

Jeśli lokalna polityka PowerShell blokuje pliki `.ps1`, uruchom osobny proces dla pobranego z repozytorium skryptu:

```powershell
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File .\scripts\backup_database.ps1
```

Niestandardowy katalog można wskazać jawnie:

```powershell
.\scripts\backup_database.ps1 -OutputDirectory 'D:\PeakGuide-backups'
```

Domyślnie pliki trafiają do `PeakGuide-backups` w katalogu użytkownika, np. `C:\Users\przem\PeakGuide-backups`. Każde wykonanie ma datę i losowy suffix, więc nie nadpisuje wcześniejszej kopii.

## Co powstaje i co sprawdzono

- `peakguide-DATA-SUFFIX.dump`: archiwum custom PostgreSQL.
- `.dump.list.txt`: spis archiwum odczytany przez `pg_restore --list`.
- `.dump.backup-info.json`: data UTC, rozmiar, SHA-256 oraz jawne `restore_tested: false`.

Plik początkowo ma końcówkę `.partial`; skrypt nadaje docelową nazwę dopiero po udanym eksporcie, sprawdzeniu niepustego pliku i czytelnym spisie. Błąd eksportu lub spisu usuwa tylko pliki tymczasowe z danego wywołania. Wcześniejsze kopie pozostają. SSL jest wymagany, timeout połączenia wynosi 20 s; poprzednie wartości tych dwóch zmiennych środowiskowych są po zakończeniu przywracane.

**Czytelny spis i hash nie są testem pełnego odtworzenia.** Hash pozwala później wykryć zmianę/uszkodzenie pliku. Możliwość pełnego restore nadal wymaga osobnej, izolowanej próby; procedura w [remaining-work.md](remaining-work.md). Testy narzędzia używają atrap poleceń i nie potwierdzają backupu produkcji.

## Zakres kopii

Skrypt wykonuje logiczny eksport bazy `postgres` w zakresie dostępnym dla wskazanego użytkownika. Każdy błąd `pg_dump`, w tym odmowa uprawnień, kończy operację niepowodzeniem — nie ignoruj go i nie wyłączaj kontroli.

Nie jest to kopia całego projektu Supabase: nie obejmuje fizycznych plików Storage, kodu/sekretów Edge Functions, DNS/SMTP, repozytorium ani globalnych ról klastra PostgreSQL. Plik bazy może zawierać dane użytkowników; przechowuj go prywatnie, poza repo i publicznymi usługami. Archiwa i pliki kontroli zostały dodane do `.gitignore`; to dodatkowe zabezpieczenie przed przypadkowym commitem, a nie szyfrowanie.

## Gdy jesteś tylko na telefonie

Samo scalenie PR nie wymaga backupu bazy. Przygotowane operacje SQL mogą poczekać. Jeśli plan Supabase udostępnia backupy, ich datę i możliwość przywrócenia sprawdź w panelu **Database → Backups**. Ten skrypt wymaga środowiska z narzędziami PostgreSQL, nie działa wewnątrz SQL Editor.

## Testy

```powershell
.\scripts\tests\backup_database_test.ps1
```

Test bez połączenia z bazą sprawdza powodzenie, checksumę, unikalne nazwy, zachowanie wcześniejszej kopii, natywny prompt hasła, pusty/brakujący plik, błąd `pg_dump`, błędny/pusty spis oraz przywrócenie środowiska. CI uruchamia go zarówno w Windows PowerShell 5.1, jak i PowerShell 7. Lokalnie sprawdzono go w przenośnym PowerShell 7.7.0.
