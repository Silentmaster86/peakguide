# Naprawa kodowania importów 02–04

21 listopada 2026: po ręcznym imporcie SQL przez Windows PowerShell bez jawnego
`-Encoding UTF8` potwierdzono teksty takie jak `ÅšnieÅ¼nik` zamiast `Śnieżnik`.
Dotyczy to tekstów 23 tras i 23 POI z pakietów kgp-02, kgp-03 i kgp-04.
Listy języków i obecność geometrii nie wykrywały tego problemu. Wcześniejsze
potwierdzenie kompletności katalogu dotyczyło liczby wpisów, a nie poprawności tekstu.

## Naprawa na istniejących rekordach

Skrypt korzysta z kanonicznych `records.json` tych trzech pakietów. Dopuszcza
wyłącznie tekst kanoniczny albo dokładnie jego jednokrotnie uszkodzoną wersję
UTF-8 odczytaną jako Windows-1252. Nie próbuje zgadywać innych kodowań.

W jednej transakcji:

- blokuje rejestry importów i porównuje całe bieżące rekordy z ich snapshotami;
- sprawdza tożsamości szczytów, tras i POI oraz komplet czterech tłumaczeń;
- naprawia nazwy, opisy, uwagi/wskazówki i nazwy początku/końca trasy;
- odświeża snapshoty kgp-02/03/04, zachowując zabezpieczenia importu i cofania.

Nie usuwa ani nie tworzy tras/POI. Zachowuje identyfikatory, powiązania,
współrzędne, geometrię, adresy GPX, parametry i źródła. Znaczniki wersji mogą
zostać zmienione przez istniejące triggery. Pierwsza piątka, korekta pinezek
oraz wyłączenie dodatkowej Łysicy pozostają poza zakresem.

Brak rejestru, późniejsza edycja albo inny nieznany tekst przerywają całość.
Ponowne uruchomienie poprawnie naprawionego pakietu niczego nie zmienia.
Nie uruchamiać rollbacków partii w celu naprawy kodowania: usuwają one dane.

## Wdrożenie

Wymagana jest kopia bazy sprzed zmian. Merge sam nie wykonuje SQL.
Po merge i `git pull --ff-only`, w głównym folderze repo:

```powershell
Get-Content .\docs\catalogue\utf8-repair\verify.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Wkleić do nowego zapytania Supabase SQL Editor i wykonać. Następnie:

```powershell
Get-Content .\docs\catalogue\utf8-repair\apply.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Wykonać w nowym zapytaniu. Oczekiwane `Success. No rows returned`.
Ponownie wykonać `verify.sql`. Oczekiwane:

| batch_key | expected_records | found_records | correct_text_records | remaining_issues |
| --- | ---: | ---: | ---: | --- |
| kgp-02 | 10 | 10 | 10 | [] |
| kgp-03 | 30 | 30 | 30 | [] |
| kgp-04 | 6 | 6 | 6 | [] |

Oba pliki SQL są w całości ASCII: znaki narodowe są zapisane jako sekwencje
JSON `\uXXXX`. Mimo tego we wszystkich kolejnych poleceniach `Get-Content`
dla plików projektu należy jawnie podawać `-Encoding UTF8`.

Po kontroli obejrzeć nazwy/opisy Śnieżnika i Rysów w PL/EN/UA/ZH na stronie.
Naprawa nie jest automatycznie wykonywana przez CI ani Netlify.

## Testy

```sh
python scripts/build_catalogue_utf8_repair.py --check
python supabase/tests/catalogue_utf8_repair_test.py --docker NAZWA_KONTENERA
```

Test wymaga osobnej bazy `catalogue_utf8_repair_test`; resetuje wyłącznie jej
schematy. Odtwarza błąd CP1252, naprawia wszystkie teksty, sprawdza zachowanie
ID/geometrii/parametrów/własnych danych, idempotencję, mieszane poprawne i uszkodzone
pakiety, atomowe odrzucanie późniejszych edycji i zgodność odświeżonych rejestrów
z ponowieniem oraz cofnięciem pierwotnych importów. To test lokalny/CI, bez
połączenia z produkcyjną bazą. Pliki SQL są deterministycznie generowane z danych źródłowych.
