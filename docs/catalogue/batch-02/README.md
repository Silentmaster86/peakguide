# Partia 02 — pięć kolejnych szczytów KGP

Stan: przygotowane do przeglądu; agent nie zmieniał danych produkcyjnych.
Źródła odczytano 15 listopada 2026. Nowe opisy są krótką własną redakcją w PL/EN/UA/ZH.
Pakiet zawiera **5 tras, 5 POI, 40 tłumaczeń i 5 przebiegów mapowych**.

## Co dodajemy

| Szczyt (istniejące ID) | Wariant | Metryki publiczne | POI |
|---|---|---|---|
| Śnieżka (1) | Biały Jar → szczyt, czarny, wejście | 7,68 km / 1196 m podejść / 255 min | Panorama ze szczytu |
| Śnieżnik (2) | Schronisko → rejon szczytu, zielony | Brak osobno potwierdzonych liczb | Wieża widokowa |
| Wielka Sowa (6) | Przełęcz Sokola → Rzeczka → Przełęcz Walimska → szczyt, czarny | 10,6 km / 1015 m podejść / 300 min | Wieża widokowa |
| Skalnik (8) | Węzeł przy dawnym Czartaku → rejon szczytu, niebieski | Brak osobno potwierdzonych liczb | Węzeł szlaków przy dawnym Czartaku |
| Szczeliniec Wielki (11) | Letni wariant edukacyjny: przełęcz → rejon szczytowy → początek schodów | 2,13 km / 370 m podejść / 95 min | Punkt schodów z GPX PTTK |

Wszystkie warianty są jednokierunkowymi odcinkami (`point-to-point`); nie zawierają
osobno zaplanowanego powrotu. Wielka Sowa opisuje dłuższy **czarny** wariant, a nie
krótkie czerwone podejście. Skalnik nie obejmuje dodatkowego wejścia na Ostrą Małą.
Puste parametry Śnieżnika i Skalnika są zamierzone: parametry całych źródłowych
szlaków 55,1 km i 31 km nie opisują wyciętych podejść. Trudność pozostaje pusta,
ponieważ źródła nie podają wspólnej klasyfikacji. Nie zmieniamy wysokości szczytów.

## Źródła i kierunek

- [Śnieżka — PTTK](https://dolnoslaskie.szlaki.pttk.pl/629-dolnoslaskie-sniezka-karpacz-bialy-jar)
  opisuje zejście. Odwrócono kolejność GPX, zachowując wszystkie jego części.
  Czas 4:15 jest podany przez PTTK dla kierunku przeciwnego; źródłowe 1196 m zejść
  staje się sumą podejść. Nie użyto 3:30 i 325 m z kierunku zejściowego.
  [KPN: Zakosy pod górę](https://kpnmab.pl/zakosami-na-sniezke-tylko-na-szczyt-2004/n).
  Przed wyjściem obowiązuje sprawdzenie [bieżącego komunikatu KPN](https://kpn.gov.pl/komunikat-turystyczny).
- [Śnieżnik — pełny zielony szlak PTTK](https://dolnoslaskie.szlaki.pttk.pl/675-dolnoslaskie-zloty-stok-rynek-schronisko-pttk-na-sniezniku).
  Z GPX wybrano wyłącznie ostatni segment (indeks 27) i odwrócono do wejścia.
- [Wielka Sowa — czarny wariant PTTK](https://dolnoslaskie.szlaki.pttk.pl/796-dolnoslaskie-przelecz-sokola-wielka-sowa).
  Zachowano cały ślad i metryki opublikowane dla tego wariantu.
- [Skalnik — pełny niebieski szlak PTTK](https://dolnoslaskie.szlaki.pttk.pl/967-dolnoslaskie-przelecz-karpnicka-mianka).
  Wybrano segment 11 od punktu 26 oraz całe segmenty 12 i 13 (indeksy od zera),
  następnie odwrócono ich kolejność i punkty. Koniec śladu leży ok. 43 m od punktu
  szczytowego PTTK; początek ok. 22 m od punktu Czartaka. Nie dopisano łączników.
- [Szczeliniec — letnia ścieżka edukacyjna PTTK](https://dolnoslaskie.szlaki.pttk.pl/515-dolnoslaskie-przelecz-pod-szczelincem-szczeliniec-poczatek-schodow).
  Zachowano ślad w podanym kierunku. [Schronisko opisuje sezonowość i ruch jednokierunkowy
  w labiryncie](https://naszczelincu.pl/labirynt-skalny/). Przed wyjściem sprawdzić
  [PNGS](https://pngs.gov.pl/komunikat-turystyczny). Ten wariant letni nie opisuje
  zimowego dojścia. Nie zapisujemy w bazie niepotwierdzonego stanu „otwarte”.

`geometry-review.json` dokumentuje źródłowe GPX, SHA-256 odczytanych plików,
liczbę punktów/segmentów i adaptację. Metryki w tabeli pochodzą z PTTK; długość
obliczona z uproszczonej geometrii służy wyłącznie kontroli i nie zastępuje ich.
Różnice względem kart wynoszą około 4% dla Śnieżki, 3% dla Wielkiej Sowy i 15% dla
Szczelińca. Ślady nie są pomiarem terenowym ani instrukcją omijania oznaczeń.

Katalog `routes/` zawiera GPX dokładnie zgodne z geometrią na mapie, z linkiem do
źródła i opisem adaptacji. Jest to szczególnie ważne dla wyciętych lub odwróconych
odcinków: przycisk pobierania nie kieruje na cały 55-kilometrowy szlak. Pliki GPX
staną się dostępne pod adresami `raw.githubusercontent.com` po scaleniu PR.

## Źródła i zakres POI

| Punkt | Współrzędne (lat, lon) | Źródło |
|---|---|---|
| Panorama Śnieżki | 50.735998, 15.739546 | [PTTK 1034](https://dolnoslaskie.szlaki.pttk.pl/1034-dolnoslaskie-sniezka) |
| Wieża Śnieżnika | 50.207895, 16.847099 | [PTTK 1932](https://dolnoslaskie.szlaki.pttk.pl/1932-dolnoslaskie-snieznik-rezerwat-wieza-widokowa) |
| Wieża Wielkiej Sowy | 50.680343, 16.485569 | [PTTK 1998](https://dolnoslaskie.szlaki.pttk.pl/1998-dolnoslaskie-wielka-sowa-wieza-widokowa) |
| Schody Szczelińca | 50.4807638, 16.33994222 | Koniec [GPX PTTK 515](https://dolnoslaskie.szlaki.pttk.pl/item/gpx/515) |
| Węzeł przy dawnym Czartaku | 50.801265, 15.910256 | [PTTK 2056](https://dolnoslaskie.szlaki.pttk.pl/2056-dolnoslaskie-czarnow-dawne-schronisko-czartak) |

Nie są to potwierdzenia godzin otwarcia wież, dostępności parkingu czy działającego
noclegu w Czartaku. Punkt schodów nie oznacza kasy labiryntu ani parkingu.

## Wdrożenie

Migracja 014 i partia 01 zostały wcześniej wdrożone przez właściciela. Nie uruchamiać
ich ponownie dla tej partii. Nie ma nowej migracji schematu ani zmiany frontendu.

1. Wykonać świeży backup. Uruchomić odczytowy `verify.sql` i sprawdzić istniejące ID,
   aktywność pięciu szczytów oraz ewentualne wcześniej dodane rekordy.
2. Scalić PR, aby pliki GPX były dostępne pod docelowymi adresami.
3. W Supabase SQL Editor wykonać całe `apply.sql` jako właściciel projektu.
4. Ponownie uruchomić `verify.sql`: dla każdego szczytu oczekiwana co najmniej jedna
   trasa i POI oraz geometria, a w tablicach tej partii pięć tras i pięć POI,
   każdy z czterema językami. Śnieżnik i Skalnik mają nadal puste trzy metryki.
5. Sprawdzić mapę i szczegóły pięciu szczytów, tłumaczenia oraz pobranie GPX.

`apply.sql` dodaje wyłącznie nowe rekordy w jednej transakcji. Sprawdza ID i slug
szczytów, typy POI oraz konflikty slugów/źródeł. Bez zmian można go ponowić jako
no-op. Rejestr `kgp-02` i blokada są oddzielne od partii 01.

`rollback.sql` usuwa wyłącznie zapisaną partię 02. Zmiana rekordu lub tłumaczenia
po imporcie zatrzymuje cofanie; nowe zależności mogą również zatrzymać transakcję.
Nie wyłączać zabezpieczeń, żeby wymusić ponowienie lub usunięcie.

Generator: `python scripts/build_catalogue_batch01.py --batch 02`.
Kontrola zgodności plików: ten sam rozkaz z `--check`.
Test w osobnej bazie: `python supabase/tests/catalogue_batch02_test.py`.
