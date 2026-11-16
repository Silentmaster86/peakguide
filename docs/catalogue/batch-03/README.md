# Partia 03 — kolejnych 15 szczytów

Wraz z niezmienioną [partią 02](../batch-02/README.md) tworzy [pakiet 20 szczytów](../twenty-peaks/README.md). Użyj instrukcji wspólnego pakietu, jeśli wdrażasz całość. Ta część dodaje 15 tras, 15 POI i 120 tłumaczeń; nie aktualizuje istniejących rekordów.

## Źródła i zakresy, sprawdzone 2026-11-15

W poniższej tabeli PTTK D = `https://dolnoslaskie.szlaki.pttk.pl/`, M = `https://malopolska.szlaki.pttk.pl/`, S = `https://slaskie-opolskie.szlaki.pttk.pl/`. Pełne adresy kart i GPX są w `records.json`; źródło każdego parametru zapisano osobno. Ślady są adaptacjami opublikowanych danych tych serwisów, nie własnymi pomiarami. Atrybucja znajduje się także w metadanych eksportów GPX. Dodatkowe potwierdzenie zielonego szlaku przez Rudawiec: [Gmina Stronie Śląskie](https://stronie.pl/2320/szlaki-piesze-pttk.html).

| Szczyt | Zakres GPX i źródło | Dystans / suma podejść / czas | POI i źródło |
| --- | --- | --- | --- |
| Rudawiec | D 675, tylko odcinek 24 odwrócony: Przełęcz Płoszczyna → Rudawiec | brak / brak / brak | Przełęcz Płoszczyna, D 1931 |
| Orlica | D 935, cały zielony: Torfowisko pod Zieleńcem → Lasek Miejski; bez odejścia do wieży i szczytu | 14,7 km / 617 m / 330 min | wieża, D 2219 |
| Jagodna | D 500, cały niebieski: Spalona → Różanka przez Jagodną | 19 km / 630 m / 405 min | wieża, D 2110 |
| Kowadło | D 675, tylko odcinek 18 odwrócony: węzeł w Bielicach → Kowadło | brak / brak / brak | punkt widokowy na szczycie, D 1928 |
| Kłodzka Góra | D 893: Kłodzko Miasto → Pod Kłodzką Górą, przez rejon wieży | 9,17 km / 685 m / 225 min | wieża, D 2080 |
| Biskupia Kopa | S 304: Pokrzywna → Biskupia Kopa, Doliną Bystrego Potoku i rejonem Gwarkowej Perci | 5,94 km / 566 m / 150 min | schronisko, S 794 |
| Babia Góra | M 320: Markowe Szczawiny → Brona → Diablak, czerwony szlak, bez dojścia do schroniska | 3,1 km / 591 m / 110 min | Diablak i kamienna osłona, M 1580 |
| Tarnica | [BdPN: Wołosate–Tarnica](https://bdpn.gov.pl/szlaki-turystyczne/sciezka-przyrodniczo-historyczna-wolosate-tarnica); cały oficjalny GPX podejścia | 4,4 km / brak / 125 min | krzyż na szczycie, opis BdPN i punkt końcowy GPX |
| Turbacz | M 33: Koninki, wejście do GPN → schronisko; bez dalszego podejścia na szczyt | 6,7 km / 783 m / 195 min | schronisko, M 1689 |
| Radziejowa | M 17: Krościenko → Przehyba → Radziejowa → Wielki Rogacz, cały etap czerwonego GSB | 18,8 km / 1406 m / 465 min | wieża, M 1680 |
| Lubomir | M 164, początek śladu z Węglówki do obserwatorium; segmenty 0–3 i pierwsze dwa punkty segmentu 4 | brak / brak / brak | obserwatorium, M 2214 |
| Mogielica | M 157: cały żółty szlak z Tymbarku PKP na Mogielicę | 11,9 km / 967 m / 285 min | wieża, M 1682 |
| Czupel | [Śląskie Travel 1019739](https://www.beskidy.slaskie.travel/route/1019739): Czernichów → Czupel → Magurka → Międzybrodzie Bialskie | 14,64 km / 700 m / 300 min | parking początkowy w Czernichowie, opis i początek GPX |
| Skrzyczne | [Śląskie Travel 1020144](https://slaskie.travel/route/1020144): pętla Ostre → Dolina Zimnika → Malinowska Skała → Skrzyczne → Ostre | 16 km / brak / 300 min marszu | parking przy ul. Słonecznej w Ostrem, opis i początek GPX |
| Wysoka (Pieniny) | M 144: Jaworki → Homole → Uroczysko Zaskalskie; bez końcowego wejścia na Wysoką | 4,4 km / 456 m / 115 min | Wąwóz Homole, M 1000 |

Indeksy segmentów są liczone od zera, po odfiltrowaniu pustych segmentów. Oryginalne współrzędne segmentów zachowano, jedynie usuwając wysokości do geometrii 2D i odwracając/wycinając wskazane odcinki. Nie połączono oddzielnych segmentów wymyślonym przebiegiem. `geometry-review.json` zawiera adres źródła, SHA-256 oryginalnego pobranego GPX, liczbę punktów, końce, adaptację i długość samej geometrii. PTTK D 675 ma 55,1 km; jego pełne parametry nie zostały przypisane do wyciętych podejść na Rudawiec i Kowadło. Tak samo nie użyto parametrów całej trasy M 164 dla Lubomira.

## Rozbieżności i ograniczenia

- Czupel: karta ma dokładny dystans 14,64 km, tekst zaokrągla do 15 km i podaje 5 godzin oraz 700 m sumy podejść. Użyto tych jawnych wartości; pole „suma podjazdów 36” nie oznacza metrów i zostało pominięte.
- Skrzyczne: tekst podaje 16 km i 5 godzin marszu (około 6 ze zwiedzaniem/postojami); geometria ma około 15,59 km. „Przewyższenie 700 m” nie określa jednoznacznie sumy podejść, więc `elevation_gain_m=null`.
- Tarnica: tekst i GPX opisują podejście na szczyt, choć pole końca na karcie powtarza Wołosate. Użyto faktycznego końca GPX; 125 min to opublikowany czas wejścia, a nie zejścia.
- Radziejowa, Jagodna i Orlica to całe, dłuższe etapy. Parametry nie odnoszą się do najkrótszego wejścia. Turbacz kończy się przy schronisku. Nazwa karty M 144 zawiera „Wysoka”, ale GPX kończy się w Uroczysku Zaskalskim, co jasno podano w opisach.
- Babia Góra: czerwony szlak przez Bronę, nie Perć Akademików. Dostępność zależy od komunikatów [BgPN](https://bgpn.gov.pl/). Dla Tarnicy obowiązują komunikaty [BdPN](https://bdpn.gov.pl/). Nie deklarujemy otwarcia przez cały rok. Gwarkowa Perć zawiera strome miejsca i drabinę.
- Wysokiej Kopy nie włączono: nie zastępujemy wyznaczonego szlaku dojściem poza nim na chroniony szczyt.
- POI nie deklarują sprawdzonych godzin, cen, noclegów ani dostępności miejsc parkingowych. Współrzędne pochodzą z kart PTTK, a dla parkingów i krzyża na Tarnicy z opisanych punktów oficjalnego GPX. Nie zmieniono istniejących współrzędnych szczytów, nawet jeśli ich pozycja w bazie różni się od karty źródłowej.

## Osobna obsługa tej części

`apply.sql` dodaje tylko te 15 szczytów, z rejestrem `kgp-03`. `rollback.sql` cofa tylko tę część, chroniąc późniejsze edycje. `verify.sql` jest odczytem. Regeneracja SQL: `python scripts/build_catalogue_batch01.py --batch 03`; wspólnego pakietu: `python scripts/build_catalogue_twenty.py`.
