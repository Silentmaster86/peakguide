# Poza KGP — partia 05: Góry Izerskie

**Przygotowana, bez produkcyjnego SQL.** Dwie trasy z pełnym GPX/geometrią,
dwa POI, 16 tekstów PL/EN/UA/ZH i 345 punktów źródłowych. Stóg Izerski (33)
i Wysoki Kamień (34). Nie zmienia szczytów, uprawnień ani istniejących importów.

Właściciel 24 listopada potwierdził pełne wyniki verify dla #37 i #38 (5/5 i 4/4).
**Nie są już zaległymi importami.** Poprosił też o zbieranie kolejnych pakietów
przed wspólnym wgrywaniem. Ten pakiet trafia do [kolejki](../../operations/pending-rollout.md);
merge publikuje pliki, nie uruchamia SQL. Nie wymaga od razu działania właściciela.

## Źródła i zakres — 24 listopada 2026

| Szczyt | Jeden kierunek | Parametry tej karty | Pełny GPX |
| --- | --- | --- | --- |
| Stóg Izerski | Świeradów-Zdrój, punkt 50.907326/15.334311 → czerwony → schronisko → czerwony/zielony/żółty do punktu szlakowego 50.890964/15.303837. | 4,8 km, 573 m podejść, 126 min | [mau3](https://mapa-turystyczna.pl/route/mau3), [186 punktów](https://mapa-turystyczna.pl/route/mau3.gpx) |
| Wysoki Kamień | Stacja Szklarska Poręba Górna 50.829702/15.517885 → Podgórze → Rozdroże pod Wysokim Kamieniem → punkt szlakowy 50.845118/15.491945. Czerwony, końcowo wspólny z żółtym. | 3,2 km, 413 m podejść, 91 min | [iv1r](https://mapa-turystyczna.pl/route/iv1r), [159 punktów](https://mapa-turystyczna.pl/route/iv1r.gpx) |

Wszystkie punkty obu pojedynczych segmentów zachowano bez przycinania,
upraszczania, odwracania ani dorysowania dojść do pinezek. Końce śladów różnią
się od istniejących pinezek szczytów o około 51 i 62 m; import nie przesuwa tych
pinezek. Trasy nie obejmują powrotu, przejazdu koleją ani dowolnego startu w mieście.
Parametry są szacunkami wybranych kart, nie pomiarami marszu i nie danymi innego
wariantu. Nie dodano klasy trudności (`difficulty=null`). Geometria jest 2D.
Pełne fingerprinty: [geometry-review.json](geometry-review.json).

## POI i granice informacji

- **Schronisko na Stogu Izerskim**: shelter, 50.892497/15.308775,
  [PTTK 2037](https://dolnoslaskie.szlaki.pttk.pl/2037-dolnoslaskie-schronisko-na-stogu-izerskim).
  Punkt na zboczu przy wybranym szlaku, a nie wierzchołek. Opis historycznego
  budynku z lat 1922–1924 nie potwierdza dostępności noclegów ani gondoli.
- **Wysoki Kamień — rejon schroniska i skał**: shelter, 50.845549/15.491588,
  [PTTK 2033](https://dolnoslaskie.szlaki.pttk.pl/2033-dolnoslaskie-wysoki-kamien-schronisko).
  Pozycja obszaru, nie wejścia. Karta zawiera historyczną zapowiedź wieży na 2023 r.;
  nie używamy jej jako dowodu obecnego otwarcia wieży. Nie potwierdzono noclegów,
  cen, godzin czy wyposażenia. Żadnych takich obietnic w tłumaczeniach.

POI przypisano do szczytów (`trail_id=null`). Nie ma nowych kart parkingu lub
transportu ani danych usługowych bez źródeł. Notatki kierują do pogody i aktualnych
ograniczeń; nie deklarują dostępności na żywo. Ostrzeżenia innych, dłuższych tras
przez Góry Izerskie nie są automatycznie przenoszone na wybrane dwa odcinki.

## Pozostałe trzy szczyty z przeglądu

[unresolved.json](unresolved.json): Iwinka, Postawna, Anielska Kopa **nie są importowane**.
Nie potwierdzono jednocześnie pełnego, wiarygodnego GPX, jego zgodności z danym
wierzchołkiem i udostępnionego dojścia. To brak weryfikacji, nie twierdzenie o zakazie
wejścia lub nieistnieniu wszystkich ścieżek. Nie kopiujemy tras sąsiednich gór.

Dla Iwinki [gmina Stronie Śląskie](https://stronie.pl/2046/nr-2-na-sedlo-peklo-w-kierunku-nyznerowskich-wodospadow.html)
opisuje rezerwat na zboczach i zielony szlak w pobliżu. [RDOŚ](https://www.gov.pl/web/rdos-wroclaw/zarzadzenie-nr-62024-regionalnego-dyrektora-ochrony-srodowiska-we-wroclawiu-z-dnia-23-maja-2024-r-w-sprawie-ustanowienia-zadan-ochronnych-dla-rezerwatu-przyrody-puszcza-snieznej-bialki)
publikuje zadania ochronne. Żadne z tych źródeł samo nie potwierdza wejścia na szczyt.
Mapy odznak dla Postawnej/Anielskiej Kopy służą jako tropy, a nie potwierdzone GPX
lub zgoda na poruszanie się poza znakowanym szlakiem. Kolejny etap: dokładny
wariant dojścia i dostęp; ewentualne dojście tylko w rejon musi być tak nazwane.

## Wspólne okno wdrożenia — później

1. Właściciel scala PR po zielonych testach. Agent nie scala ani nie wykonuje SQL produkcyjnego.
2. Gdy zbierzemy więcej gotowych pakietów, zachowaj aktualny backup i wklej cały
   `docs/catalogue/nonkgp-05/apply.sql` do Supabase SQL Editor.
3. W osobnym zapytaniu uruchom cały `docs/catalogue/nonkgp-05/verify.sql`.
4. Oczekiwane 2 wiersze: trails=1, pois=1, mapped_trails=1, oba zestawy języków
   `[en,pl,ua,zh]`, review_matches=true i package_applied=true.

`rollback.sql` jest narzędziem awaryjnym, nie kolejnym krokiem. Import jest atomowy,
ASCII-only, kontroluje pełną tożsamość rodziców i odmawia przy istniejących treściach,
także ukrytych. Prywatny rejestr zawiera pełne snapshoty. Powtórzenie i cofnięcie
odmawiają po późniejszych edycjach; cofnięcie chroni także przyszłe FK CASCADE/SET NULL.
Odczyt publicznych tożsamości i braków katalogu wykonano 24 listopada. Nie czytano
prywatnych danych ani nie używano dostępu administracyjnego do produkcji.

## Powtarzalna kontrola

```sh
python scripts/build_nonkgp_05.py --check
python scripts/build_nonkgp_05.py --check --check-sources
python -m unittest discover -s scripts -p 'test_*.py'
# Tylko dedykowana lokalna baza nonkgp_05_test:
python supabase/tests/nonkgp_05_test.py
# Z peakguide_front:
npx playwright test e2e/nonkgp-catalogue-05.spec.mjs
```

Test transakcyjny sprawdza pełne teksty/typowane pola, PostGIS, odczyt publiczny,
powtórzenie, rollback, późniejsze edycje, uszkodzony rejestr, ukryty rekord, błąd
ostatniego tłumaczenia oraz obie kolejności z nonkgp-04 bez utraty jego danych.
Testy UI sprawdzają treść i linki w czterech językach na komputerze i telefonie.
Fixture nie jest odtworzeniem prywatnego backupu produkcji.
