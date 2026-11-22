# Krywań — aktualizacja informacji o sezonie 2026/2027

Przegląd źródeł: **22 listopada 2026**. To przygotowany patch do wykonania przez
właściciela, nie potwierdzenie zmiany w produkcji.

Dotychczasowa karta wspominała otwarcie po remoncie 9 października 2026 i ogólnie
zalecała sprawdzenie zamknięć. Tymczasem [komunikat TANAP z 30 października 2026](https://www.tanap.sk/od-1-novembra-sa-v-tatranskom-narodnom-parku-zacina-sezonna-uzavera-9441/)
ogłasza zamknięcia od 1 listopada do 31 maja.
[Regulamin TANAP](https://www.tanap.sk/wp-content/uploads/navstevny_poriadok_tanapu.pdf),
§4 ust. 2 lit. b pkt 1 i załącznik 3 część A, pozycja 17, obejmuje zielony szlak
5803 z Tri studničky do Krivánskeho žľabu oraz niebieski 2903 od Jamského plesa
przez Krivánsky žľab na szczyt. To odcinki obecnej pętli.

Nowy tekst w PL/EN/UA/ZH podaje wyraźnie okres **1.11.2026–31.05.2027 dla zwykłej
turystyki pieszej** i przypomina, że obecność GPX nie oznacza otwarcia szlaku.
Dotyczy wskazanego sezonu; nie jest automatyczną oceną wszystkich przyszłych
terminów ani zasad dla innych aktywności. Przed wyjściem obowiązuje sprawdzenie
aktualnych komunikatów parku.

## Zakres

Tylko karta dostępu `trail_access.id=6` przy istniejącej trasie id 10
`krivan-tri-studnicky-loop`:

- cztery pola `warnings` w istniejących tłumaczeniach;
- `source_url` karty prowadzący do aktualnego komunikatu;
- `last_verified_at` karty: 22 listopada 2026.

Start, dojazd, transport, ID, parkingi, trasa i geometria/GPX pozostają zachowane.
Nie aktualizować rejestrów poprzednich pakietów ani ponawiać dawnych importów.
`change.json` zawiera publiczny stan kontrolny i krótkie nowe teksty, adresy i skróty
SHA-256 źródeł. Nie publikujemy kopii PDF ani pełnych artykułów.

## Wdrożenie właścicielskie

Po merge, z aktualnym backupem, pobierz kod (`git pull --ff-only` na czystym `main`).
Najpierw uruchom **verify.sql** w SQL Editorze: cztery wiersze en/pl/ua/zh,
przed patchem `warning_matches_review=false`, `patch_applied=false`.
Potem całe **apply.sql** w jednej transakcji, a następnie ponownie **verify.sql**.
Po poprawce wszystkie cztery zgodności i `patch_applied` mają być true.

PowerShell — pojedynczo, najpierw kontrola:

```powershell
Get-Content .\docs\catalogue\krivan-seasonal-01\verify.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Po kontroli skopiuj import:

```powershell
Get-Content .\docs\catalogue\krivan-seasonal-01\apply.sql -Encoding UTF8 -Raw | Set-Clipboard
```

Następnie ponownie skopiuj `verify.sql`. SQL jest ASCII-only z tekstami w JSON
`\u...`. Na telefonie rozwiń „Pokaż więcej: Dojazd i bezpieczeństwo” przy trasie
Krywania, aby przeczytać ostrzeżenie. Sprawdź cztery języki i nowy link źródła.

Własny rejestr `krivan-seasonal-01` chroni ponowienie i `rollback.sql`. Późniejsza
edycja karty lub jej tłumaczeń zatrzyma import/cofnięcie. Błąd na dowolnym etapie
wycofuje całość; nie omijaj zabezpieczeń. Cofnięcie przywróci wcześniejszy tekst,
źródło i datę — nie usunie karty, GPX, parkingu ani powiązań użytkowników.

## Testy w izolacji

```bash
python scripts/build_krivan_seasonal_01.py --check
createdb -U postgres krivan_seasonal_01_test
python supabase/tests/krivan_seasonal_01_test.py
```

Dedykowana lokalna baza; fixture nie jest pełnym odtworzeniem Supabase. Testy
sprawdzają zakres pól, zachowanie GPX/parametrów/dojazdu/parkingów/powiązań i
wcześniejszych rejestrów, daty w różnych strefach, ponowienie/cofnięcie, późniejsze
edycje, nieoczekiwany trigger, błąd ostatniego tłumaczenia i odmowę zapisu klientom.
