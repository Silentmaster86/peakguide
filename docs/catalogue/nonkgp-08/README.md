# Poza KGP — partia 08: cztery szczyty

Przegląd: 28 listopada 2026. **Dane przygotowane, nie wgrane do produkcji.**
4 trasy, 4 POI, 32 teksty PL/EN/UA/ZH, 842 rzeczywiste punkty GPX i 4 profile.
Nie zmieniamy rekordów szczytów, ich pinezek, wysokości, pasm ani uprawnień.

## Dokładne warianty tras

| Szczyt | Wariant w jedną stronę | Parametry karty źródłowej | Punkty |
| --- | --- | --- | --- |
| Wołek, id 43 | Przełęcz Rędzińska → żółty do Pod Wołkiem 1 → niebieski/żółty pod szczyt | 3,5 km / 161 m / 71 min | 166 |
| Trzy Korony, id 79 | Sromowce Niżne → Wąwóz Szopczański → Przełęcz Szopka → niebieski na Okrąglicę | 3,3 km / 505 m / 108 min | 188 |
| Zamkowa Góra, id 142 | Pokrzywna → Pod Gołębim Wzgórzem → czerwony do punktu pod szczytem | 2,7 km / 238 m / 66 min | 171 |
| Srebrna Kopa, id 57 | Pokrzywna → Zamkowa Góra → Przełęcz pod Zamkową Górą → Złodziejska Droga → czerwony | 4,9 km / 522 m / 126 min | 317 |

Karty i adresy pełnych eksportów znajdują się w [geometry-review.json](geometry-review.json).
Zachowano każdy punkt i wysokość, bez przycinania, powrotu, łączenia odcinków czy
prostych do pinezek. Dystans/czas/podejście pochodzą z karty konkretnego wariantu;
nie zastępujemy ich pomiarem geodezyjnym wykresu. Kolor nie wyznacza trudności:
`difficulty=null`. Maksimum wysokości GPX nie zmienia wysokości szczytu w bazie.

Odrzucone warianty: Wołek `/route/3msc9` jest inną, dłuższą pętlą; trasa
`/route/3ygly` prowadzi dalej na Biskupią Kopę. Nie przycinano ich do tych nazw.

## POI i źródła

- **Wołek:** Przełęcz Rędzińska, początek podejścia (`trailhead`),
  50.823543/15.945836. [Węzeł Mapa Turystyczna](https://mapa-turystyczna.pl/node/przelecz-redzinska).
  Nie jest to deklaracja parkingu ani dostępnych usług.
- **Trzy Korony:** Okrąglica, galeria widokowa (`viewpoint`),
  49.413913/20.414222. [PTTK](https://malopolska.szlaki.pttk.pl/2309-pttk-malopolska-trzy-korony)
  oraz [bieżące zasady PPN](https://piepn.gov.pl/trzy-korony-i-sokolica).
  Metalowe schody i barierki, bez obietnicy wolnego wejścia czy braku kolejki.
  Nie skopiowano starszych cen ani godzin do trwałych danych.
- **Zamkowa Góra:** punkt Korony Parku Krajobrazowego Góry Opawskie (`attraction`),
  50.272711/17.458850. [Oficjalny program ZOPK](https://go.zopk.pl/korona/)
  i jego GPX punktów. To Zamkowa Góra 571 m w Górach Opawskich, nie szczyt w Pieninach.
  Nie dopisano ruin ani wieży na podstawie nazwy.
- **Srebrna Kopa:** Schronisko PTTK Pod Biskupią Kopą (`shelter`),
  50.260819/17.432179. [PTTK](https://slaskie-opolskie.szlaki.pttk.pl/794-slaskie-opolskie-schronisko-pod-kopa-biskupia).
  **Obiekt jest poza wybranym GPX**, co podają wszystkie cztery języki.
  Nie narysowano dojścia i nie obiecujemy dostępnego noclegu.

Wszystkie POI mają `trail_id=null`. Teksty napisano osobno; nie kopiowano fotografii.
Oficjalny plik ZOPK zawiera **wyłącznie punkty**, więc służy do tożsamości i POI,
nie jako ślad. Nie połączono tych punktów w trasę. Fingerprint i rozróżnienie
źródeł zapisano w [source-review.json](source-review.json).

Osobno odnotowano [nierozstrzygniętą tożsamość Sokolica, id 80](unresolved.json).
Nie dodano jej trasy ani nie poprawiono pinezki na podstawie samej nazwy.

Komunikat PPN w dniu przeglądu podawał otwarcie szlaków pieszych. To obserwacja
historyczna, nie gwarancja dostępności. Teksty kierują do bieżącego komunikatu;
nie utrwalają starszego październikowego zamknięcia ani statusu „otwarte”.

## Stan i późniejszy import

Publiczny odczyt [public-baseline.json](public-baseline.json) nie znalazł aktywnych
tras/POI dla tych czterech szczytów. Nie widzi szkiców; SQL osobno odmawia importu,
jeśli istnieje jakakolwiek aktywna lub ukryta treść. Chroni też pełną tożsamość
szczytu i pasma, tłumaczenia oraz późniejsze edycje i zależności FK.

**Preferowany wspólny import partii 07 i 08:**
[instrukcja i jeden plik apply](../nonkgp-07-08/README.md). Na razie wystarczy merge.
Partia 07 z #50 też czeka na SQL. Nie ponawiać ukończonych #37/#38/#40.

Osobne [apply.sql](apply.sql), [verify.sql](verify.sql), [rollback.sql](rollback.sql)
służą alternatywnemu wdrożeniu tylko tej partii. Po takim imporcie oczekujemy
4 wierszy z trasą/POI/geometrią, czterema językami i obiema flagami `true`.
Rollback odmawia usuwania zmienionych lub powiązanych rekordów. Pliki SQL są
ASCII-only z Unicode zapisanym wewnątrz JSON; nie uruchamiają sieci ani poczty.

## Profile i testy

Po merge kod będzie przygotowany na 15 profili / 2367 próbek. **Na produkcji
jest 9 / 1278**: dwa z partii 07 i cztery z 08 czekają na import. Wykres wymaga
dokładnej zgodności geometrii, sluga, szczytu i obu adresów źródłowych; inaczej
pozostaje ukryty. Istniejące 11 artefaktów pozostaje bez zmian.

```sh
python scripts/build_nonkgp_08.py --check --check-sources
python scripts/build_nonkgp_07_08.py --check
python scripts/build_elevation_profiles.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Wyłącznie dedykowana lokalna baza nonkgp_08_test:
python supabase/tests/nonkgp_08_test.py
# Z peakguide_front:
npm run check
npx playwright test e2e/nonkgp-catalogue-08.spec.mjs
```

Lokalna fixture sprawdza transakcję, powtórzenie, cofanie, ukryte rekordy,
późniejsze zmiany, zależności oraz wspólne wycofanie obu partii po błędzie.
Nie zastępuje odtworzenia prywatnego backupu produkcyjnego.
