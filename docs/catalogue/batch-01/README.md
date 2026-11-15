# Partia 01 — pięć szczytów KGP

Stan: pakiet do przeglądu i wdrożenia; agent nie zapisywał produkcyjnych danych.
Odczyt źródeł: 15 listopada 2026. Opisy są własną krótką redakcją w PL/EN/UA/ZH.

| Szczyt | Trasa | Zakres parametrów | POI |
|---|---|---|---|
| Waligóra | Żółte wejście z Andrzejówki | Samo podejście; brak potwierdzonych liczb | Schronisko Andrzejówka |
| Ślęża | Żółty odcinek Tąpadła → Dom Turysty | 3,1 km / 415 m podejść / 95 min, w jedną stronę, do Domu Turysty | Przełęcz Tąpadła — początek szlaku |
| Łysica | Pętla „Na Łysicę — Czas w Las” | 12,1 km / 358 m podejść / 240 min, pełna pętla | Wiata i parking w Świętej Katarzynie |
| Skopiec | Rozdroże przy Przełęczy Komarnickiej → Skopiec | 0,9 km / 92 m podejść / 23 min, w jedną stronę | Przełęcz Komarnicka |
| Chełmiec | OSiR → Rosochatka → Chełmiec, zielony/żółty | Samo podejście; brak potwierdzonych liczb | Wieża i Krzyż Milenijny |

Nie utożsamiać krótkiego wejścia na Łysicę z 12,1-kilometrową pętlą. Wariant Ślęży
kończy się przy Domu Turysty; dodatkowe dojścia i powrót nie są ujęte w liczbach.
Wartości podejść Ślęży pochodzą z PTTK, nie z odejmowania wysokości punktów.
Skopiec kończy się nieoznakowaną ścieżką. Oceny trudności poza wyraźną klasyfikacją
PTTK dla pętli Łysicy są oceną redakcyjną; nie są skalą techniczną ani obietnicą
bezpieczeństwa przy wszystkich warunkach. Nie zmieniamy wysokości szczytów.

## Źródła tras

- Waligóra: https://e-gory.com/gory-kamienne/waligora-andrzejowka/
- Ślęża: https://dolnoslaskie.szlaki.pttk.pl/829-dolnoslaskie-zolty-przelecz-tapala-sleza
- Łysica: https://swietokrzyskie.szlaki.pttk.pl/1364-swietokrzyskie-na-lysice
- Oficjalny GPX Łysicy: https://swietokrzyskie.szlaki.pttk.pl/item/gpx/1364
- Skopiec: https://www.gorykaczawskie.pl/skopiec/ wskazuje wariant
  https://mapa-turystyczna.pl/route/2965, z którego pochodzą parametry.
- Chełmiec: https://wycieczkoteka.pl/zwiedzaj-polske/gorki-i-pagorki/chelmiec-najkrotszy-szlak-na-szczyt

## Źródła punktów

- Andrzejówka: https://dolnoslaskie.szlaki.pttk.pl/1120-dolnoslaskie-schronisko-andrzejowka
  — 50.684767,16.277919.
- Przełęcz Tąpadła: https://dolnoslaskie.szlaki.pttk.pl/1607-dolnoslaskie-przelecz-tapadla
  — 50.846108,16.698529. To punkt przełęczy, nie konkretne stanowisko parkingowe.
- Święta Katarzyna: https://swietokrzyskie.szlaki.pttk.pl/1369-swietokrzyskie-swieta-katarzyna-wiata-i-parking
  — 50.903483,20.880515. Nie wpisujemy niepotwierdzonych cen ani godzin dostępności.
- Przełęcz Komarnicka: https://mapa-turystyczna.pl/node/przelecz-komarnicka
  — 50.941472,15.878613. To punkt szlaku, nie potwierdzony parking.
- Chełmiec, wieża/krzyż: https://dolnoslaskie.szlaki.pttk.pl/1057-dolnoslaskie-krzyz-milenijny
  — 50.780057,16.211468. Nie gwarantujemy bieżącego otwarcia wieży.

## Przebieg mapowy

Łysica ma przebieg z oficjalnie udostępnionego GPX PTTK: 13 segmentów, 178 punktów.
Zachowano kolejność i rozdzielenie segmentów; nie dopisano prostych łączników.
Początek i koniec: 50.90333157,20.88136866. Długość policzona z geometrii wyniosła
około 12,066 km, zgodnie z publikowanym zaokrągleniem 12,1 km. Metryki publiczne
pozostają wartościami źródła, nie są podmieniane wynikiem własnego obliczenia.
Zapis zawiera link do źródła GPX i datę weryfikacji, widoczne również w mapowym popupie.
Pozostałe cztery trasy mają opisy i źródła, ale nie mają jeszcze zweryfikowanego
przebiegu do wyświetlenia. Mapa pokazuje je na liście, nie rysuje fikcyjnej linii.

## Wdrożenie i cofnięcie

1. Najpierw migracja `202611150014_catalogue_management.sql`, przegląd schematu
   i testy w izolowanej kopii. Następnie świeży backup produkcji.
2. Uruchomić całe `apply.sql` jako właściciel projektu w SQL Editor. Oczekiwane:
   pięć nowych tras, pięć nowych POI i 40 tłumaczeń, w jednej transakcji.
3. Ponowienie bez zmian jest no-op. Istniejący slug albo POI z tym samym źródłem
   zatrzyma import; nie usuwać zabezpieczeń, tylko porównać dane.
4. Sprawdzić 5 szczytów w czterech językach, mapę POI oraz przebieg pętli Łysicy.
5. `rollback.sql` usuwa wyłącznie zapisany pakiet. Jeśli redaktor zmienił rekord
   lub tłumaczenie po imporcie, cofnięcie zostaje odrzucone. Nowe zależności również
   mogą zablokować usunięcie i wycofają całą operację.

Rejestr importu w prywatnym schemacie przechowuje pełny stan wstawionych wierszy,
żeby cofanie nie usuwało cudzej późniejszej pracy. Generator:
`python3 scripts/build_catalogue_batch01.py`. Nie uruchamia SQL ani nie łączy się z bazą.
