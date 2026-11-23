# Poza KGP — partia 02

**Wdrożenie potwierdzone przez właściciela 23 listopada 2026.** Niemcowa (68), Rotunda (74),
Barania Góra (77), Klimczok (78): 4 trasy z geometrią/GPX, 4 POI, 32 teksty
PL/EN/UA/ZH, **805 punktów źródłowych**. Wszystkie trasy opisują jeden kierunek
wejścia. Zejścia, dojazdy i dodatkowe dojścia nie są wliczone.

Nie zmienia rekordów szczytów, istniejących importów, grantów, polityk publicznych,
poczty ani pogody. Właściciel potwierdził wdrożenie poprzedniej partii `nonkgp-01`
23 listopada: cztery wiersze z review_matches=true i package_applied=true.
Nie ponawiać poprzedniego SQL ani nie wykonywać jego rollbacku.

Właściciel przekazał 4/4 wiersze z review_matches=true i package_applied=true,
po jednej trasie, POI i geometrii oraz oba zestawy czterech języków. Nie ponawiać
importu ani nie wykonywać rollbacku.

## Instrukcja po merge (wykonana)

1. Zachowaj aktualną kopię bazy. W Supabase SQL Editor uruchom cały
   `docs/catalogue/nonkgp-02/apply.sql` jako właściciel.
2. W osobnym zapytaniu uruchom cały `docs/catalogue/nonkgp-02/verify.sql`.
3. Oczekuj 4 wierszy: trails=1, pois=1, mapped_trails=1, oba zestawy języków
   `[en,pl,ua,zh]`, review_matches=true i package_applied=true.
4. Odśwież stronę i sprawdź trasy/POI/mapę. Dopiero verify potwierdza dane na produkcji.

Merge publikuje pliki; nie uruchamia importu Supabase. SQL jest ASCII-only,
znaki narodowe zakodowano w JSON Unicode. Nie poprawiaj wygenerowanych plików ręcznie.
`rollback.sql` jest narzędziem awaryjnym, nie kolejnym krokiem wdrożenia.

## Źródła i zakres — sprawdzone 23 listopada 2026

| Szczyt | Trasa | Opublikowane parametry wejścia | GPX |
| --- | --- | --- | --- |
| Rotunda | Regietów, węzeł czerwonego → obok bazy namiotowej → Rotunda; czerwony/czarny spacerowy. [Mapa Turystyczna qjms](https://mapa-turystyczna.pl/route/qjms). | 1,8 km / 250 m / 53 min | [89 punktów](https://mapa-turystyczna.pl/route/qjms.gpx), 1 segment |
| Niemcowa | Piwniczna-Zdrój PKP → punkt Niemcowa określony w karcie PTTK; żółty szlak. [PTTK 659](https://malopolska.szlaki.pttk.pl/659-pttk-malopolska-piwniczna-zdroj-pkp-niemcowa). | 6,1 km / 681 m / 165 min | [150 punktów](https://malopolska.szlaki.pttk.pl/item/gpx/659), 8 stykających się segmentów |
| Barania Góra | Wisła Czarne → dolina Białej Wisełki → szczyt; niebieski, końcówka wspólna z czerwonym/zielonym. [Mapa Turystyczna p540](https://mapa-turystyczna.pl/route/p540). | 7,4 km / 666 m / 175 min | [295 punktów](https://mapa-turystyczna.pl/route/p540.gpx), 1 segment |
| Klimczok | Szczyrk → Sanktuarium → Siodło → Klimczok; głównie niebieski, końcówka czarna. [Mapa Turystyczna 3s6](https://mapa-turystyczna.pl/route/3s6). | 4,8 km / 603 m / 136 min | [271 punktów](https://mapa-turystyczna.pl/route/3s6.gpx), 1 segment |

Geometria zachowuje wszystkie współrzędne źródłowe w oryginalnym kierunku; bez
upraszczania, odwracania, łączenia różnych tras lub dorysowywania do pinezek.
Pliki GPX pozostają u dostawców. Zawierają wysokości, ale importowana geometria
jest 2D; nie deklarujemy profilu wysokościowego. Brak oceny `difficulty` jest
zamierzony: kolor szlaku nie wyznacza trudności.

[geometry-review.json](geometry-review.json) zapisuje odciski pełnych źródeł,
liczby punktów/segmentów i dokładne końce. Dla eksportów Mapa Turystyczna kontrola
normalizuje tylko wspólne przesunięcie generowanych czasów, zachowując względne
czasy, wysokości, teksty i współrzędne. Dla PTTK sprawdza cały dokument bez tej
normalizacji. Zmiana źródła blokuje kontrolę; skrypt nie podmienia danych automatycznie.

### Niemcowa: punkt na szlaku a wierzchołek

[PTTK 2268](https://malopolska.szlaki.pttk.pl/2268-pttk-malopolska-niemcowa)
wyjaśnia różne użycia nazwy dla wierzchołka, polany i dawnego osiedla. Wybrany
GPX kończy się przy 49.445319, 20.646508, obok punktu PTTK 49.445284, 20.646535.
Istniejący rekord szczytu ma 1001 m i inne współrzędne. Wszystkie nowe wersje
językowe wyraźnie opisują koniec jako węzeł, bez obietnicy dojścia na 1001 m.
Nie przesuwamy rekordu ani śladu. Starszy opis szczytu zawiera błędne „Beskid Niski”,
choć relacja w bazie prawidłowo wskazuje Sądecki; to osobne zadanie z kontrolą
pełnego tekstu, zapisane w [unresolved.json](unresolved.json).

### Rezerwat Barania Góra

[RDOŚ Katowice](https://www.gov.pl/web/rdos-katowice/rezerwat-barania-gora)
udostępnia wyznaczone szlaki piesze, w tym ścieżkę pokrywającą się z niebieskim.
Karta trasy wskazuje zakaz wprowadzania psów do rezerwatu. Notatki w 4 językach
nakazują pozostanie na udostępnionych szlakach, respektowanie zakazu i sprawdzenie
bieżących komunikatów RDOŚ/Nadleśnictwa Wisła. Nie deklarują otwarcia na żywo.
Trasa nie obejmuje wariantu przez Przysłop. GPX nie jest dowodem dostępu.

## POI

| Powiązany szczyt | Punkt i typ | Źródło pozycji/faktów |
| --- | --- | --- |
| Rotunda | Cmentarz wojenny nr 51, attraction; 49.474487, 21.235825 | [PTTK 1342](https://malopolska.szlaki.pttk.pl/1342-pttk-malopolska-cmentarz-wojenny-nr-51-na-rotundzie). I wojna światowa, projekt Dušana Jurkoviča, blisko końca GPX. |
| Niemcowa | Przystanek kolejowy Piwniczna-Zdrój, transport; 49.440441, 20.717191 | [PTTK 2601](https://malopolska.szlaki.pttk.pl/2601-pttk-malopolska-piwniczna-zdroj-pkp). Przy starcie żółtego; odróżniony od stacji Piwniczna w Hanuszowie. Bez aktualnego rozkładu. |
| Barania Góra | Rejon szczytu, viewpoint; 49.611443, 19.010590 | [Mapa Turystyczna, węzeł Barania Góra](https://mapa-turystyczna.pl/node/barania-gora). Punkt orientacyjny przy końcu trasy; **nie potwierdza dostępu do wieży**. |
| Klimczok | Schronisko PTTK Klimczok, shelter; 49.738308, 19.005091 | [Gmina Wilkowice](https://wilkowice.pl/biznes-i-inwestycje/dla-turysty/schroniska-gorskie), [współrzędne Mapa Turystyczna](https://mapa-turystyczna.pl/node/schronisko-pttk-klimczok). Pod Magurą, na wschód od szczytu; **poza GPX**, dodatkowe dojście niewliczone. |

POI są związane ze szczytem (`trail_id=null`); nie sugerujemy, że wszystkie leżą
na wybranej trasie. Nie publikujemy niepotwierdzonych godzin, cen, pojemności,
parkingów, toalet ani dostępności noclegów. Serwis gospodarza Klimczoka zwracał
503; karta gminy potwierdza obiekt i adres, lecz nie bieżącą dostępność usług.
Istniejąca pinezka Rotundy jest oddalona od punktu PTTK; tej korekty nie wykonuje
import tras. Osobne współrzędne POI i GPX zachowują źródłowe położenie.

## Ochrona importu

Jedna transakcja z prywatnym rejestrem `nonkgp-02` i pełnymi migawkami wierszy
oraz tłumaczeń. Kontrola tożsamości 4 rodziców i pasm, odmowa istniejących treści
(także szkiców), konfliktów slugów i niejednoznacznych typów POI.
Ponowienie potwierdza pełną zgodność migawek; późniejsze zmiany nie są nadpisywane.
Cofanie wykrywa późniejsze odwołania FK, także CASCADE/SET NULL, i odmawia utraty
powiązań. Usuwa tylko własne rekordy, nie dotyka pól szczytów ani wcześniejszych
rejestrów importu. Publiczne polityki/granty pozostają zachowane.

## Weryfikacja techniczna

```sh
python scripts/build_nonkgp_02.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Wyłącznie dedykowana lokalna baza nonkgp_02_test:
python supabase/tests/nonkgp_02_test.py
# Opcjonalnie publiczni dostawcy; bez zapisu do Supabase:
python scripts/build_nonkgp_02.py --check --check-sources
```

Test integracyjny sprawdza import, powtórzenie, cofanie, dokładne 32 tłumaczenia,
geometrię PostGIS, odmowę edycji/zależności/szkiców/zmian tożsamości i pełne
wycofanie transakcji przy błędzie ostatniego tłumaczenia. Wszystkie rekordy szczytów,
w tym niezwiązane KGP, pozostają bez zmian. Fixture nie zastępuje pełnego restore
prywatnego dumpa. E2E korzysta z tekstów partii w atrapach API; nie dowodzi importu
na produkcji. Potwierdzeniem będzie verify przekazane przez właściciela.

Wyniki lokalne: 13 testów Python, test transakcyjny PostGIS, pełne `npm run check`
(lint, testy backendu/Node, 141 testów komponentów i build) oraz osiem scenariuszy
Chromium desktop/mobile w 4 językach. Cztery dodatkowe widoki Light/Dark:
brak błędów JavaScript, naruszeń Axe w głównej treści i poziomego przepełnienia.
Wyniki UI opierają się na atrapach API z treściami partii. Nie oznaczają wdrożenia.
