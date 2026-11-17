# Brakujące GPX pierwszej partii — cztery istniejące trasy

Przygotowano 17.11.2026. **Bez zapisów produkcyjnych.** Uzupełnia Waligórę, Ślężę, Skopiec i Chełmiec z partii 01. Nie dodaje nowych tras ani POI; zachowuje identyfikatory, opisy w czterech językach, parametry, trudność i zakresy wycieczek.

## Źródła i adaptacja

| Trasa | Opublikowany GPX i wybrany zakres | Kontrola długości geometrii |
| --- | --- | --- |
| Waligóra z Andrzejówki, żółty | [PTTK 539](https://dolnoslaskie.szlaki.pttk.pl/539-dolnoslaskie-gluszyca-pkp-golinsk-granica-panstwa), [oryginał GPX](https://dolnoslaskie.szlaki.pttk.pl/item/gpx/539): tylko segmenty 11–13, od rejonu schroniska do szczytu. To nie czarny szlak PTTK 848, który omija szczyt. | 0,4752 km, 3 segmenty, 20 punktów |
| Ślęża z Tąpadeł do Domu Turysty | [PTTK 829](https://dolnoslaskie.szlaki.pttk.pl/829-dolnoslaskie-zolty-przelecz-tapala-sleza), [oryginał GPX](https://dolnoslaskie.szlaki.pttk.pl/item/gpx/829): wszystkie pięć segmentów, bez zmiany kierunku i punktów. | 2,9967 km, 75 punktów |
| Skopiec od rozdroża przy Przełęczy Komarnickiej | [Mapa Turystyczna, dokładnie trasa 2965](https://mapa-turystyczna.pl/route/2965), [publiczny eksport GPX](https://mapa-turystyczna.pl/route/2965.gpx): cały ślad z końcowym nieoznakowanym dojściem. Eksport był dostępny bez logowania; nie korzystano z materiału wymagającego uwierzytelnienia. | 0,9192 km, 1 segment, 59 punktów |
| Chełmiec od OSiR przez Rosochatkę | Zielony [PTTK 904](https://dolnoslaskie.szlaki.pttk.pl/904-dolnoslaskie-walbrzych-pkp-marciszow-skrzyzowanie) ([GPX](https://dolnoslaskie.szlaki.pttk.pl/item/gpx/904)), segment 32, punkty 16–52; dalej żółty [PTTK 802](https://dolnoslaskie.szlaki.pttk.pl/802-dolnoslaskie-kuznice-swidnickie-chelmiec) ([GPX](https://dolnoslaskie.szlaki.pttk.pl/item/gpx/802)), segmenty 17–19. Wspólny punkt Rosochatki ma identyczne współrzędne w obu źródłach: 50.77261188 / 16.21193482. | 2,6909 km, 4 segmenty, 71 punktów |

Indeksy od zera. Zachowano współrzędne i segmenty źródeł (geometria 2D); nie interpolowano ani nie dorysowano łączników. Dla Chełmca wybrany początek znajduje się około 34 m od punktu parkingu podanego w [pierwotnym opisie Wycieczkoteki](https://wycieczkoteka.pl/zwiedzaj-polske/gorki-i-pagorki/chelmiec-najkrotszy-szlak-na-szczyt) — GPX nie zawiera niezweryfikowanego dojścia przez parking. Źródła sprawdzono 17.11.2026. Atrybucja jest także w metadanych GPX; dla Chełmca oba źródła geometrii są wyszczególnione w tym dokumencie i `geometry-review.json`.

Wyliczona długość jest kontrolą przebiegu, nie nowym zweryfikowanym parametrem trasy. Istniejące metryki pozostają bez zmian; dla Waligóry i Chełmca pozostają null. Upraszczany GPX może być krótszy niż opublikowany dystans. `geometry-review.json` zawiera SHA-256 pobranych oryginałów, adaptację i punkty końcowe. Pobrane pliki GPX odpowiadają dokładnie geometrii z `changes.json`.

## Dlaczego aktualizowany jest rejestr pierwszej partii

Import 01 zapamiętuje pełne rekordy i ich tłumaczenia. Każda późniejsza aktualizacja zmienia także token wersji `updated_at`. Samo dopisanie geometrii sprawiłoby, że wcześniejszy import/cofanie rozpoznawałyby je jako nieznaną edycję.

Ten patch w jednej transakcji:

1. Blokuje rejestr 01 i porównuje każdą zmienianą trasę z jego zapisanym snapshotem.
2. Wymaga pustej geometrii, GPX i pól pochodzenia — odmawia nadpisania śladu dodanego przez administratora.
3. Uzupełnia tylko `route_geometry`, `gpx_url`, `geometry_source_url`, `geometry_verified_at`; natywny trigger sam nadaje nowy `updated_at`.
4. Odświeża snapshoty **tylko tych czterech tras** w rejestrze `kgp-01` i tworzy oddzielny rejestr `kgp-01-gpx` z wartościami przed/po. Nie zmienia wpisów POI ani Łysicy w rejestrze.

Powtórzenie jest no-op, jeśli rekordy i snapshoty pozostały niezmienione. Edycja dokonana po imporcie lub brak rejestru 01 przerywa całą transakcję. `rollback.sql` cofa wyłącznie tę aktualizację geometrii, zachowuje monotoniczne tokeny wersji i ponownie odświeża rejestr 01. Nigdy nie przywraca starego tokena wersji.

Aktualny `batch-01/rollback.sql` odmawia cofnięcia całej pierwszej partii, gdy istnieje `kgp-01-gpx`: **najpierw cofnij uzupełnienie GPX, dopiero potem partię 01**. Nie korzystaj ze starych kopii rollbacku 01 pozbawionych tej kontroli. `batch-01/records.json` i pierwotny import nie zostały zmienione; nowa instalacja też wykonuje najpierw 01, potem ten upgrade.

## Wdrożenie po backupie

1. W SQL Editor właściciela uruchom `verify.sql` (wyłącznie odczyt). Muszą istnieć cztery trasy oraz rejestr `kgp-01`. Jeśli go brakuje, nie importuj ponownie na ślepo — potrzebny jest przegląd istniejących rekordów.
2. Świeży backup. Merge udostępni docelowe pliki GPX, ale nie zmieni Supabase.
3. Uruchom cały `gpx-completion/apply.sql`, następnie `verify.sql`: cztery trasy mają geometrię i GPX, języki `[en,pl,ua,zh]`, identyczne parametry jak przed operacją.
4. Sprawdź linie i pobieranie GPX na mapie oraz stronach czterech szczytów. Po wszystkich partiach 01–04 i tym uzupełnieniu każdy z 28 wpisów KGP ma trasę z przebiegiem i POI — Wysoka Kopa nadal ma dojście do Sinych Skałek, bez zamkniętego szczytu.

To niezależne od oczekującego importu 20 szczytów: aktualizacja GPX wymaga wyłącznie 01 + migracji 014. Nie wykonano zapisów do produkcji i nie zmieniono pinezek szczytów. Nie jest to pełne pokrycie wszystkich możliwych tras/POI.

## Testy

`python scripts/build_catalogue_gpx_completion.py --check`; test integracyjny `python supabase/tests/catalogue_gpx_completion_test.py` na dedykowanej bazie `catalogue_gpx_completion_test` (lub `--docker NAZWA`). Test sprawdza zgodność 4 GPX z mapą, niezależne punkty końcowe, prawdziwe połączenie na Rosochatce, zmianę tylko pól geometrii i wersji, zachowanie wszystkich opisów/parametrów/POI, idempotencję importu 01 po upgrade, cofanie w odpowiedniej kolejności, ponowny upgrade oraz odmowę nadpisania edycji. Testy i generatory są w CI.

Dodatkowy test importuje wszystkie cztery rzeczywiste partie: po upgrade potwierdza 28 tras z geometrią i 28 POI, a po jego cofnięciu 24 geometrie i niezmienione rejestry wszystkich wcześniejszych partii.
