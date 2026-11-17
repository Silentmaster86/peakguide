# Partia 04 — Rysy, Lackowa i rejon Wysokiej Kopy

Przygotowana 17 listopada 2026, **bez zapisu do produkcji**. Po jednej trasie i POI dla trzech pozostałych pozycji katalogu KGP: 3 trasy z geometrią, 3 zgodne pliki GPX i 24 tłumaczenia PL/EN/UA/ZH.

Wysoka Kopa ma trasę **w rejonie masywu, do Sinych Skałek**, nie wejście na zamknięty wierzchołek. Opisy we wszystkich językach zaznaczają tę różnicę. Publikacja rekordu nie jest zapewnieniem, że szlak jest aktualnie otwarty.

## Źródła i dokładny zakres

| Szczyt | Trasa i kierunek | Parametry dla tego kierunku | POI |
| --- | --- | --- | --- |
| Rysy (id 16) | Palenica Białczańska → Morskie Oko → Czarny Staw pod Rysami → polski wierzchołek Rysów. Odwrócono **cały** GPX [PTTK 461](https://malopolska.szlaki.pttk.pl/461-pttk-malopolska-rysy-polana-palenica), opisany jako zejście Rysy–Polana Palenica. | 12,8 km / 1837 m podejść / 405 min (6:45 h). Czas jest opublikowanym czasem kierunku przeciwnego; podejścia odpowiadają źródłowym zejściom. Nie jest to suma wejścia i zejścia. | [Schronisko PTTK nad Morskim Okiem, PTTK 2725](https://malopolska.szlaki.pttk.pl/2725-pttk-malopolska-schronisko-gorskie-pttk-nad-morskim-okiem), 49.201319 / 20.070794. Bez deklaracji godzin, liczby miejsc i dostępności usług. |
| Lackowa (id 23) | Izby → Lackowa, wariant **żółty**. Odwrócono cały GPX [PTTK 3865](https://malopolska.szlaki.pttk.pl/3865-pttk-malopolska-lackowa-izby), opisany jako zejście Lackowa–Izby. To nie strome zachodnie podejście czerwonym szlakiem. | 4,8 km / 410 m podejść / 115 min (1:55 h). Czas i podejścia pochodzą z kierunku przeciwnego oraz sumy zejść w źródle. Bez powrotu. | [Zalesiony wierzchołek Lackowej, PTTK 2254](https://malopolska.szlaki.pttk.pl/2254-pttk-malopolska-lackowa), 49.426363 / 21.102584, typ attraction. Nie deklarujemy widoku ani infrastruktury. |
| Wysoka Kopa (id 3) | Rozdroże pod Izerskimi Garbami → Sine Skałki, czerwony GSS w rejonie masywu. Wycięto segment 69, punkty 0–70 włącznie z [PTTK 693](https://dolnoslaskie.szlaki.pttk.pl/693-dolnoslaskie-glowny-szlak-sudecki-im-mieczyslawa-orlowicza). | Dystans, suma podejść i czas **null**. Parametry całej trasy GSS 78,7 km / 5118 m / 32:30 h nie opisują wybranego krótkiego odcinka. | [Sine Skałki, PTTK 2035](https://dolnoslaskie.szlaki.pttk.pl/2035-dolnoslaskie-wysoka-kopa-sine-skalki), 50.857504 / 15.405716. Punkt przy szlaku z miejscem odpoczynku i widokiem, odrębny od zamkniętego szczytu. |

Źródła odczytane 2026-11-17. Współrzędne POI pochodzą z kart PTTK. Nazwę i położenie początku wybranego odcinka GSS potwierdza niezależna karta [Rozdroża pod Izerskimi Garbami](https://mapa-turystyczna.pl/node/rozdroze-pod-izerskimi-garbami) (50.846527 / 15.434953); początek GPX leży około 8 m od tego punktu.

### Zasady i ograniczenia

- [PTTK — Rysy](https://malopolska.szlaki.pttk.pl/1676-pttk-malopolska-rysy) potwierdza stromy, eksponowany przebieg z łańcuchami i zaleganiem śniegu. Nie przedstawiamy tej trasy jako krótkiego rodzinnego spaceru ani jako wariantu zimowego. Opisy odsyłają do [aktualnego komunikatu TPN](https://tpn.gov.pl/komunikat-turystyczny); nie utrwalamy prognoz, chwilowych warunków lub dawnych zarządzeń jako aktualnego statusu.
- Karta PTTK Sinych Skałek informuje o zamknięciu dojścia na Wysoką Kopę dla ochrony cietrzewia. Wybrany przebieg zachowuje odcinek czerwonego szlaku, kończy się na Sinych Skałkach i nie dodaje ścieżki na szczyt. Link do [komunikatów Nadleśnictwa Szklarska Poręba](https://szklarska.wroclaw.lasy.gov.pl/tymczasowo-zamkniete-szlaki-turystyczne) znajduje się w opisach. Kanoniczny adres komunikatów zwrócił 403 w automatycznym odczycie; dostępna była zindeksowana treść nadleśnictwa, ale nie traktujemy jej jako dowodu bieżącego otwarcia konkretnego odcinka.
- Odrzucono GPX [PTTK 594, Maślana Góra–Dzielec](https://malopolska.szlaki.pttk.pl/594-pttk-malopolska-maslana-gora-czertez), choć karta wymienia Lackową. Ślad ma lukę pomiędzy segmentami 24 i 25 i nie zawiera samego szczytu; najbliższy punkt leży około 3,8 km od punktu Lackowej z karty PTTK. Nie uzupełniono tej luki prostą linią. Użyto kompletnego żółtego szlaku 3865.
- Nie zmieniono wysokości ani współrzędnych istniejących szczytów. Pinezka Lackowej w bazie leży kilkaset metrów od punktu szczytu potwierdzonego przez PTTK i użytego w GPX; wymaga osobnego przeglądu danych. Nie przesuwamy trasy do nieweryfikowanej pinezki.
- Nie oznaczono szlaków arbitralną oceną difficulty — skala pozostaje nieuzupełniona, a konkretne cechy przebiegu opisano słownie.

## GPX i audyt geometrii

Pliki w `routes/` są adaptacjami GPX PTTK, z atrybucją i linkiem źródła w metadanych GPX 1.1. Zachowano segmenty i oryginalne współrzędne, usuwając jedynie wysokości do geometrii 2D oraz wykonując opisane odwrócenie/wycięcie. Nie dopisano łączników, punktów ani dojść na zamknięty szczyt. Ten sam przebieg jest w `records.json` i w pobieranym GPX.

| Trasa | Segmenty / punkty | Długość geometrii (kontrola, nie parametr opublikowany) |
| --- | --- | --- |
| Rysy | 8 / 393 | 12,1635 km |
| Lackowa | 5 / 60 | 4,8067 km |
| Sine Skałki | 1 / 71 | 2,9855 km |

Różnice względem publikowanego dystansu wynikają m.in. z uproszczenia śladu źródłowego. Dla Sinych Skałek długość wyliczona z geometrii pozostaje wyłącznie kontrolą audytu — nie przypisano jej jako niezależnie potwierdzonego parametru trasy. `geometry-review.json` zawiera SHA-256 pobranego oryginału, adres, adaptację, liczbę punktów oraz początek/koniec. Indeksy segmentów i punktów liczone są od zera po odfiltrowaniu pustych segmentów.

## Wdrożenie — osobno od poprzednich PR

**Właściciel czeka z operacjami SQL do świeżego backupu.** Merge tego PR udostępni pliki GPX w `main`, ale nie wykona importu do Supabase.

1. W SQL Editor uruchom `verify.sql` (tylko odczyt). Sprawdza trzy szczyty i ogólne pokrycie aktywnych pozycji KGP.
2. Zrób świeży backup. Wymagana jest wcześniej wdrożona migracja 014; nie wykonuj jej ponownie, jeśli już działa. Po merge i przygotowaniu backupu wgraj wcześniejszy [pakiet 20 szczytów](../twenty-peaks/README.md), jeśli nadal oczekuje — następnie tę partię.
3. Uruchom całość `batch-04/apply.sql`. To osobna transakcja z rejestrem `kgp-04`. Działa również samodzielnie; nie uruchamia wcześniejszych importów.
4. Ponownie uruchom `verify.sql`. Oczekiwane dla tej partii: 3 trasy, 3 POI, 3 geometrie, każda po 4 języki `[en,pl,ua,zh]`.
5. Sprawdź mapę, pobieranie GPX oraz PL/EN/UA/ZH. Dla Rysów i Lackowej porównaj kierunek wejścia; dla Wysokiej Kopy opis ma jasno mówić o dojściu do Sinych Skałek bez szczytu.

Wspólny skutek partii **01 + 02 + 03 + 04**: po jednej trasie i POI dla wszystkich 28 szczytów KGP. **Tylko 24 z 28 mają przebieg mapowy** — cztery trasy z partii 01 (Chełmiec, Skopiec, Ślęża, Waligóra) nadal wymagają GPX. To następne zadanie, nie dowód pełnego pokrycia tras, POI ani dostępności wszystkich szczytów.

Import odmawia nadpisania istniejącego sluga lub POI o tym samym źródle. Powtórzenie nie dubluje rekordów, jeśli pozostały niezmienione. Późniejsza edycja przerywa import/cofanie bez nadpisania. Pełny `rollback.sql` cofa wyłącznie partię 04, nie rusza wcześniejszych 25 tras/POI. Nie wycofuje osobnej korekty wpisu Łysicy.

## Testy

```sh
python scripts/build_catalogue_batch01.py --batch 04 --check
python supabase/tests/catalogue_batch04_test.py
```

Test wymaga osobnej bazy PostgreSQL/PostGIS `catalogue_batch04_test`, którą celowo resetuje; opcjonalnie `--docker NAZWA`. Kontroluje zgodność 3 GPX z geometrią, niezależne punkty końcowe, kierunki i parametry, brak odejścia na szczyt Wysokiej Kopy, 24 tłumaczenia, konflikt/idempotencję/rollback i ochronę edycji. Import wszystkich czterech rzeczywistych partii potwierdza pokrycie 28 KGP, 24 geometrie oraz zachowanie wcześniejszych rejestrów po cofnięciu partii 04. Test jest w CI. Fixture nie zastępuje pełnego stagingu Supabase.
