# Przegląd katalogu — 14 listopada 2026

Status: przygotowane korekty, **nie wykonano zapisu do produkcji**. Ponowny odczyt
publicznego API: 89 szczytów, 356 tłumaczeń szczytów, 6 tras, 24 tłumaczenia tras.

## Decyzje i źródła

| Rekord | Stan przed | Decyzja i dowód |
|---|---|---|
| `lakowa-wyspowy` (71) | nazwa Łyżka, opis Łakowa, 900 m; 49.4217,21.1017 | Zachować tożsamość Łyżki wynikającą z czterech nazw i pasma Beskid Wyspowy. Punkt PTTK: **49.642726,20.462113**. Przyjąć **803 m** z opisu PTTK i informacji Urzędu Miasta Limanowa. Poprawić cztery opisy. Zachować stary slug, aby nie zepsuć linków. |
| Waligóra (10) | cztery puste opisy | Uzupełnić krótkie własne opisy: Góry Suche/Kamienne, las, strome żółte podejście od Andrzejówki. Nie zmieniać wysokości ani współrzędnych w tym pakiecie. |
| Ben Nevis (5) | 17 km / 1352 m / 8 h | Walkhighlands potwierdza dystans i podejścia; czas to **7–9 h latem**, nie dokładne 8 h. Dopisać zakres i informację o powrocie. |
| Llanberis (6) | 14,5 km / 975 m / 7 h | Eryri potwierdza wszystkie liczby dla całej wycieczki tam i z powrotem. Dopisać zakres. |
| Scafell Pike (7) | 10 km / 989 m / 5 h | Three Peaks Challenge: 10 km i 989 m dla powrotnej trasy, czas 4–6 h. National Trust pokazuje 5,6 km i 5 h; nie mieszać tych dystansów ani samodzielnie ich podwajać. Zachować liczby z jawnym wyjaśnieniem źródeł i orientacyjnego czasu. |
| Hoverla (8) | 10,5 km / brak podejść / 5 h | Park opisuje wejście od punktu kontrolnego Zawoje przez Zarosliak, nie krótszą trasę startującą przy Zarosliaku. Dopisać: bez powrotu. Nie utożsamiać różnicy 2061−950 z sumą podejść. |
| Kriváň (10) | brak dystansu / 1354 m / 6 h | Slovakia.travel potwierdza pętlę przez Jamské pleso i te parametry. Dystansu nie podaje — pozostaje null. |
| Huangshan (9) | brak trzech parametrów | Istniejący opis wyraźnie uwzględnia kolejki i autobusy. Źródło oficjalne zwróciło 412 przy odczycie. Brak podstaw do dopisania liczbowych parametrów; pozostawić null i obecną informację dla użytkownika. |

Źródła odczytane 2026-11-14:

- Łyżka: https://malopolska.szlaki.pttk.pl/2099-pttk-malopolska-lyzka
- Łyżka, wysokość: https://miastolimanowa.pl/2020/01/spacery-i-wycieczki/
- Waligóra: https://e-gory.com/gory-kamienne/waligora-andrzejowka/
- Ben Nevis: https://www.walkhighlands.co.uk/fortwilliam/bennevis.shtml
- Llanberis: https://eryri.gov.wales/walk/llanberis-path/
- Scafell Pike: https://www.threepeakschallenge.uk/national-three-peaks-challenge/scafell-pike/routes/wasdale-head
- Scafell Pike: https://www.nationaltrust.org.uk/visit/lake-district/wasdale/scafell-pike-via-hollow-stones-route
- Hoverla: https://cnnp.if.ua/ua/ekoturyzm/ekolohichni-stezhky/14-ecoturism/65-eco-trail-hoverla
- Kriváň: https://slovakia.travel/en/the-krivan-mt-the-high-tatras
- Huangshan (nie udało się odczytać): https://www.huangshan.gov.cn/zwgk/public/6615714/11607391.html

PTTK ma niespójność wysokości Łyżki: nagłówek 800 m, opis 803 m. Drugie źródło
urzędowe podaje 803 m. To wysokość przyjęta redakcyjnie na podstawie źródeł,
nie wynik pomiaru geodezyjnego. Dla Waligóry występują 934/936 m — nie rozstrzygamy
tej różnicy bez odrębnego przeglądu. Opisy nie zawierają wysokości.

## Wdrożenie

1. Przejrzeć `catalogue-changes.json`: dokładne wartości przed/po, 29 wierszy.
2. Wykonać świeży backup i sprawdzić pakiet w odizolowanej bazie.
3. W Supabase SQL Editor uruchomić całość `apply.sql`. To przygotowany skrypt danych,
   celowo poza automatycznymi migracjami schematu. Zawiera transakcję i blokady.
4. Oczekiwany pierwszy wynik: `Catalogue rows updated: 29`. Powtórzenie: 0.
   Jeśli rekord edytowano od audytu lub usunięto, całość zostanie wycofana.
   Nie usuwać warunków zabezpieczających, tylko ponownie porównać rekord.
5. Sprawdzić Łyżkę na mapie oraz opisy obu szczytów i uwagi tras w PL/EN/UA/ZH.
   Slug pozostaje `lakowa-wyspowy`, sitemapa nie wymaga zmiany.
6. Ewentualne cofnięcie: cały `rollback.sql`. Cofanie również odrzuca zmienione
   później treści. Nie przywracać starego dumpa na produkcji dla tych kilku pól.

Skrypty zakładają PostGIS w `public`, co potwierdza wcześniejszy snapshot właściciela.
Generator: `python3 scripts/build_catalogue_patch.py`; kontrola zgodności: `--check`.
`catalogue-before.json` zawiera wyłącznie publiczne rekordy objęte testami.

## Weryfikacja wykonana

Izolowany Docker PostGIS 16-3.5, baza `catalogue_review_test`:

- aktualizacja współrzędnych i zgodność `geom`, osiem opisów;
- ponowne wykonanie bez duplikowania uwag;
- dokładne cofnięcie i ponowne cofnięcie;
- konflikt w ostatniej uwadze wycofuje również wcześniejsze zapisy;
- brak tłumaczenia zatrzymuje cały pakiet;
- rollback nie nadpisuje późniejszej pracy redaktora.

Test: `python supabase/tests/catalogue_patch_integration.py --docker NAZWA`.
W CI ten sam test korzysta z osobnej bazy PostgreSQL. To fixture testowe,
nie odtworzona kopia produkcji.
