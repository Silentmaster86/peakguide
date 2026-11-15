# Pakiet dla 20 szczytów KGP

**20 szczytów łącznie, nie 20 dodatkowych do poprzedniej piątki.** Po jednej trasie i POI na szczyt: 20 tras, 20 POI, 20 geometrii i zgodnych z nimi plików GPX, 160 tłumaczeń PL/EN/UA/ZH. Źródła sprawdzono 15 listopada 2026. Publikacja rekordu nie oznacza bieżącego otwarcia szlaku.

## Kolejność wdrożenia

1. W SQL Editor uruchom **tylko `verify.sql` z tego katalogu**. To odczyt: pokaże stan wszystkich 20 szczytów. Wymagana jest wcześniej wdrożona migracja 014.
2. Zrób świeży backup bazy. Po sprawdzeniu PR wykonaj merge — udostępni pliki GPX pod docelowymi adresami `main`.
3. W SQL Editor uruchom **`apply.sql` z tego katalogu**. Nie trzeba osobno uruchamiać importów 02 i 03. Merge sam nie wykonuje importu do Supabase.
4. Ponownie uruchom `verify.sql`. Oczekiwane: 20 pozycji `package_trails` i 20 `package_pois`, każde z językami `[en,pl,ua,zh]`; wszystkie trasy z `has_geometry=true`.
5. Sprawdź mapę, pobranie GPX i strony kilku szczytów, w tym trasę kończącą się pod szczytem (Turbacz/Orlica/Wysoka), trasę długą (Radziejowa) i pętlę (Skrzyczne). Sprawdź także PL/EN/UA/ZH.

## Co obejmuje pakiet

| Część | Szczyty |
| --- | --- |
| Zachowana partia 02 (5) | Śnieżka, Śnieżnik, Wielka Sowa, Skalnik, Szczeliniec Wielki |
| Nowa partia 03 (15) | Rudawiec, Orlica, Jagodna, Kowadło, Kłodzka Góra, Biskupia Kopa, Babia Góra, Tarnica, Turbacz, Radziejowa, Lubomir, Mogielica, Czupel, Skrzyczne, Wysoka (Pieniny) |

Pozostaje osobno już wdrożona partia 01: Chełmiec, Łysica, Skopiec, Ślęża i Waligóra. Pakiet jej nie zmienia. Łącznie po obu wdrożeniach dane z tych partii obejmą 25 szczytów. Nie jest to pełny katalog wszystkich możliwych tras i POI.

## Ważne zakresy tras

GPX pochodzi z PTTK, BdPN i regionalnego portalu turystycznego. Nie dodano prostych łączników między punktami ani oszacowanych parametrów. Część tras to dłuższe etapy, a nie najkrótsze wejścia na szczyt. Turbacz kończy się przy schronisku; Orlica nie obejmuje odejścia do wieży; Wysoka kończy się w Uroczysku Zaskalskim. Te ograniczenia znajdują się w opisach w czterech językach.

Szczegółowe źródła, zakresy i ograniczenia: [partia 02](../batch-02/README.md) i [partia 03](../batch-03/README.md). Parametry skopiowano tylko tam, gdzie źródło dotyczy dokładnie wybranego przebiegu. Braki pozostają `null`. Uproszczony GPX może być krótszy niż opublikowany dystans.

## Import, ponowienie i cofnięcie

`apply.sql` składa niezmienioną partię 02 i nową 03 w **jedną transakcję**. Mają oddzielne rejestry `kgp-02` i `kgp-03`. Jeśli piątka została już wgrana i pozostała niezmieniona, import sprawdzi ją i dołoży pozostałe 15. Ponowienie poprawnie zakończonego importu nie dubluje danych. Konflikt sluga lub źródła POI przerywa całą transakcję; import niczego nie nadpisuje. Późniejsza edycja wcześniej zaimportowanego rekordu również przerywa operację i wymaga świadomego rozstrzygnięcia konfliktu.

**`rollback.sql` w tym katalogu usuwa obie części (02 + 03), również jeśli 02 została wdrożona wcześniej.** Aby wycofać wyłącznie nowe 15 i zachować piątkę, użyj `../batch-03/rollback.sql`. Cofnięcie odmawia usunięcia wpisów zmienionych po imporcie. Żaden wariant nie usuwa partii 01.

Nie wykonywano zapisów do produkcji. Bez zmian frontendu, wysokości i współrzędnych istniejących szczytów. Adresy GPX wskazują `main` i zaczną działać po merge.

## Odtwarzanie i testy

```sh
python scripts/build_catalogue_batch01.py --batch 02 --check
python scripts/build_catalogue_batch01.py --batch 03 --check
python scripts/build_catalogue_twenty.py --check
python supabase/tests/catalogue_twenty_test.py
```

Ostatnie polecenie wymaga osobnej bazy `catalogue_twenty_test` i PostgreSQL/PostGIS. Test celowo resetuje tylko tę dedykowaną bazę. Obsługuje również `--docker NAZWA_KONTENERA`. Testy są w CI.
