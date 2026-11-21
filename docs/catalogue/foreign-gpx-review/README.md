# Sześć tras zagranicznych — wspólny przegląd źródeł GPX

Sprawdzono 21 listopada 2026, na prośbę właściciela obejmując wszystkie sześć
pozostałych tras jednocześnie. To raport źródłowy: **nie dodaje geometrii,
nie wykonuje SQL i nie oznacza, że sześć tras ma już GPX na produkcji**.

Odczyt publicznego API potwierdził brak GPX/geometrii wszystkich sześciu wpisów.
Pobrano i sparsowano cztery pliki kandydujące. Ich format, punkty końcowe,
liczby punktów i SHA-256 znajdują się w [source-review.json](source-review.json).
Nie publikujemy tu kopii plików dostawców ani ich surowych stron HTML.

## Wynik dla każdej trasy

| Trasa w PeakGuide | Co potwierdzono | Co blokuje import |
| --- | --- | --- |
| **Krywań z Tri studničky** | Publiczny GPX Mapa Turystyczna, 939 punktów track, zamknięta pętla. Opis źródła prowadzi zielonym na Krivánsky žľab, na szczyt, następnie przez Jamské pleso do Tri studničky. To zgodny kandydat dla obecnego opisu. | Przed SQL pozostaje zatwierdzenie wykorzystania/atrybucji i pełna kontrola geometrii względem przebiegu, wersji rekordu i parametrów. Nie jest jeszcze wdrożony. |
| **Yr Wyddfa — Llanberis Path** | Oficjalny plik Eryri: 31 punktów track, od Llanberis do szczytu. | Plik obejmuje wejście, wpis opisuje wejście i powrót. Warunki Eryri zawierają ograniczenia kopiowania/redystrybucji danych; nie publikować kopii ani pochodnej geometrii bez rozstrzygnięcia zakresu praw. |
| **Ben Nevis — Mountain Track** | GPX GPS Routes: 42 punkty route, plik dochodzi w rejon szczytu. | To punkty planowanej trasy, nie szczegółowy track. Wpis wymaga startu przy Visitor Centre i powrotu. Potrzebny dokładniej sprawdzony, pełny przebieg i warunki wykorzystania. |
| **Scafell Pike — Hollow Stones** | Three Peaks Challenge udostępnia GPX tego wariantu z Wasdale: 24 punkty route. | Plik prowadzi w górę, wpis opisuje całość tam i z powrotem. Wymaga kontroli szczegółowości, zgodności startu oraz sposobu wykorzystania. |
| **Howerla — od punktu kontrolnego Zavoie** | Aktualna strona parku potwierdza 10,5 km / 5 h w jedną stronę i dojście przez dolinę Prutu. | W sprawdzonych źródłach nie znaleziono dokładnego GPX od tego punktu kontrolnego. Ślady od bazy Zarosliak pomijają początkowy odcinek; nie są zamiennikiem. |
| **Huangshan — South Gate / Guangming Ding** | Obecny opis w PeakGuide obejmuje transport do Yungu, kolejkę Yungu, pieszą część górską i powrót kolejką Yuping oraz transportem. | To wycieczka multimodalna. Oficjalny URL zwracał 412 podczas dwóch prób odczytu. Nie znaleziono pasującego śladu wszystkich etapów. Inna piesza wycieczka z YAMAP nie zastępuje tego planu. |

`route`/`rtept` i `track`/`trkpt` to różne konstrukcje GPX. Sam fakt
poprawnego parsowania pliku nie potwierdza szczegółowości śladu, identycznego
zakresu ani bezpieczeństwa nawigacji. Nie łączyć samych punktów kursowych
prostymi liniami i nie przedstawiać tego jako zweryfikowanego przebiegu szlaku.

## Źródła i pliki do otwarcia

### Krywań

- [Obecny opis Slovakia.travel](https://slovakia.travel/en/the-krivan-mt-the-high-tatras)
- [Pętla Mapa Turystyczna](https://mapa-turystyczna.pl/route/31p2a)
- [GPX dostawcy](https://mapa-turystyczna.pl/route/31p2a.gpx)

Źródło GPX podaje 15,4 km i własne oszacowania czasu/podejść, podczas gdy
obecne 6 h / 1354 m pochodzi z innego opisu. Nie przepisywać parametrów
z nowego dostawcy automatycznie. Zmierzona długość polilinii GPX to około
14,901 km — nie jest nową zatwierdzoną wartością pola dystansu.
Źródło oznacza sezonowe zamknięcie odcinków; obecność pliku nie dowodzi
bieżącej dostępności szlaku. To opracowanie źródłowe, nie pomiar terenowy.

### Yr Wyddfa

- [Oficjalny opis Llanberis Path](https://eryri.gov.wales/walk/llanberis-path/)
- [Oficjalny GPX wejścia](https://eryri.gov.wales/wp-content/uploads/2022/03/llanberis.gpx)
- [Warunki Eryri](https://eryri.gov.wales/terms-and-conditions/)

Plik ma jeden track i jeden segment, otwarty od startu do szczytu.
Podane w PeakGuide 14,5 km / 7 h dotyczą drogi powrotnej również; samo
podpięcie pliku wejścia zmieniłoby rozumiany zakres pobieranego GPX.
Nie założono, że publiczny link do pobrania oznacza zgodę na redystrybucję.

### Ben Nevis

- [Obecny opis Mountaineering Scotland](https://www.mountaineering.scot/activities/hillwalking/ben-nevis)
- [Kandydat GPS Routes](https://www.gps-routes.co.uk/routes/home.nsf/RoutesLinksWalks/ben-nevis-mountain-track-walking-route)
- [GPX dostawcy](https://www.gps-routes.co.uk/A55CD9/home.nsf/All/076CE04BA01A4CF680257DC90038F0BF/$FILE/Ben%20Nevis%20Mountain%20Track.gpx)

Plik zawiera jeden route i 42 rtept, bez track. Odległość między kolejnymi
punktami dochodzi do około 555 m; długość polilinii wynosi około 7,958 km.
To obserwacje techniczne pliku, nie zatwierdzone parametry istniejącej trasy.
Nie dodano brakującego początku, powrotu ani punktów pośrednich.

### Scafell Pike

- [Obecny opis National Trust](https://www.nationaltrust.org.uk/visit/lake-district/wasdale/scafell-pike-via-hollow-stones-route)
- [Hollow Stones — Three Peaks Challenge](https://www.threepeakschallenge.uk/national-three-peaks-challenge/scafell-pike/routes/wasdale-head)
- [GPX dostawcy](https://www.threepeakschallenge.uk/resources/national-three-peaks-challenge/scafell-pike-hollowstones.gpx)

Plik zawiera jeden route i 24 rtept, bez track. Odległość między punktami
wynosi do około 304 m; długość polilinii około 4,086 km. Nie przeliczono na tej
podstawie istniejącego dystansu 10 km i nie dopisano powrotu.

### Howerla

- [Aktualna strona parku: Hoverla Mount](https://karpatskyi-park.in.ua/en/route/hoverla-mount/)
- [Starszy URL zapisany w PeakGuide](https://cnnp.if.ua/en/planyourtrip/naturediscoverytrail/20-ecotourism/174-hoverlamountaintrail)
- [Przykład krótszego wariantu od Zarosliaka](https://karpaty.rocks/en/node/24113)

Starszy URL podaje inny, krótszy zakres długości (4–4,5 km), mimo opisu dojścia
od punktu kontrolnego. Aktualna strona potwierdza 10,5 km i 5 h w jedną stronę.
Rozbieżność adresów źródłowych trzeba wyjaśnić w docelowym patchu; nie zmieniać
parametrów na podstawie samej starszej strony. Widziany komponent mapy parku
nie dostarczył w odczycie strony bezpośredniego pliku GPX; próba odczytu skryptu
mapy zwróciła 403. To wynik tej sesji, nie dowód, że plik nie istnieje.

### Huangshan

- [Oficjalny URL zapisany przy planie wycieczki](https://www.huangshan.gov.cn/zwgk/public/6615714/11607391.html)
- [Przykład innej aktywności użytkownika — nie zatwierdzony zamiennik](https://yamap.com/activities/4304958)

Obecny opis przewiduje autobusy i kolejki. Do uczciwej prezentacji potrzebne
są osobne, zweryfikowane etapy piesze i transportowe albo wyraźne zachowanie
tego wpisu jako planu wycieczki bez ciągłego przebiegu. Nie odwzorowywać
przejazdów ani przerw przy pomocy zmyślonych połączeń między punktami.

## Dalsze wykonanie — jeden zakres, osobna decyzja dla każdej geometrii

1. Krywań: dokończyć kwalifikację zgodnego kandydata i przygotować chroniony,
   odwracalny patch istniejącej trasy bez zmiany identyfikatora i parametrów.
2. Wspólnie dla trzech brytyjskich: zweryfikować źródła pełnych, zgodnych
   przebiegów i ich wykorzystanie. Jeżeli celem jest GPX tylko wejścia,
   etykiety i opisy w czterech językach muszą to jasno odróżniać od pełnej trasy.
3. Howerla: pozyskać potwierdzony odcinek od Zavoie, nie tylko od Zarosliaka;
   uzgodnić aktualny URL źródła. Bez rysowania brakującego dojścia.
4. Huangshan: najpierw rozstrzygnąć model etapów, nie podstawiać innego trekkingu.
5. Dopiero gotowe geometrie: porównać mapę z GPX, sprawdzić źródła i zakresy,
   przygotować test atomowości, ochrony późniejszych edycji i cofania.

Nie ma tu `apply.sql`, importu ani plików GPX do publikacji. Potwierdzone
28/28 KGP i wcześniejsze naprawy pozostają bez zmian. Review nie uzasadnia
samoczynnego ustawienia `last_verified_at` na sześciu rekordach produkcyjnych.
