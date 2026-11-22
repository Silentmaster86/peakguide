# Katalog poza KGP — kolejka robocza

Stan odczytu: 2026-11-22T21:58:09.979433+00:00. Pełne wyniki: [JSON](coverage.json), [CSV](coverage.csv).

**60 aktywnych szczytów poza KGP: 54 w Polsce i 6 za granicą.**
54 nie mają aktywnej trasy, 57 nie ma aktywnego POI, 54 nie mają karty dostępu
ani parkingu. Istniejące wpisy również wymagają kontroli źródeł; licznik nie potwierdza jakości.

Poniższe partie są kolejką badawczą po około 5 szczytów, nie obietnicą importu
niesprawdzonych danych. Przy braku źródła pomijamy rekord i zapisujemy blokadę.
Cztery zagraniczne braki GPX są osobnym zadaniem; nie dublować ich importu.

| Partia | Szczyty (slugi) |
| --- | --- |
| 1 | `lysina`, `snieznica`, `gora-zar`, `leskowiec`, `ostry-wierch` |
| 2 | `rotunda`, `niemcowa`, `wielki-rogal`, `barania-gora`, `klimczok` |
| 3 | `cwilin`, `lakowa-wyspowy`, `maly-babia-gora`, `polica`, `halicz` |
| 4 | `krzemien`, `jaworzyna-kamienicka`, `kudlon`, `jelenia-kopa`, `srebrna-gora` |
| 5 | `iwinka`, `postawna`, `anielska-kopa`, `stog-izerski`, `wysoki-kamien` |
| 6 | `baraniec-kaczawskie`, `ostrzyca`, `lesista-wielka`, `suchawa`, `srebrna-kopa` |
| 7 | `zamkowa-gora`, `jeleniec-orlickie`, `zielony-garb`, `kalenica`, `sredniak-sowie` |
| 8 | `naroza`, `skalniak`, `lisa-gora`, `dzikowiec`, `ptasia-kopa` |
| 9 | `rudawiec-zlote`, `trojak-zlote`, `smogornia`, `wielki-szyszak`, `radunia` |
| 10 | `wiezyca`, `czarna-gora`, `maly-snieznik`, `sokolica`, `trzy-korony` |
| 11 | `sokolik-wielki`, `wolek`, `kozi-wierch`, `mieguszowiecki-szczyt`, `guangming-ding` |
| 12 | `yr-wyddfa`, `ben-nevis`, `scafell-pike`, `krivan`, `hoverla` |

Każda partia: kontrola tożsamości, źródła i daty, zakres trasy, wartości bez
zgadywania, użyteczne POI, 4 języki, import atomowy z kontrolą późniejszych edycji,
verify i chroniony rollback. GPX/geometria wyłącznie zgodne z opisanym wariantem.

Brak parkingu nie oznacza braku możliwości postoju. Nie publikować regulaminu,
opłat ani dostępności na podstawie samej pinezki lub relacji innego wariantu.

## Powtórzenie audytu

Z katalogu głównego, z publicznym kluczem anon w zmiennej środowiskowej:

```sh
python scripts/catalogue_coverage.py --url https://PROJECT.supabase.co --output /tmp/coverage.json
```

Domyślna zmienna: `SUPABASE_ANON_KEY`. Nie używać service_role; nie zapisywać
klucza w pliku raportu ani poleceniu. Skrypt odczytuje wyłącznie pięć jawnie
dozwolonych tabel turystycznych, z paginacją. Publiczne RLS ukrywają szkice.
Nie sprawdza profili, kont ani sekretów. Testy wykonują tylko lokalne atrapy.
