# Prognoza przy szczycie — frontend i backend Netlify

Zakres: temperatura, wiatr, opcjonalne porywy i opad w następnej godzinie,
lista terminów do 72 godzin, punkt i wysokość modelu, czas aktualizacji i pobrania.
PL/EN/UA/ZH; jawna strefa kraju szczytu dla PL/GB/SK/UA/CN, UTC dla nieznanego kraju.
To prognoza modelowa, nie pomiar ani potwierdzenie dostępności szlaku.
Nie dodaje temperatury odczuwalnej, widoczności ani burz bez danych źródłowych.
Światło dzienne jest osobnym zadaniem i nie zależy od uruchomienia dostawcy.

## Co trzeba zrobić po stronie właściciela

Nie potrzeba SQL, zmian Supabase, hasła bazy, konta u dostawcy ani klucza API.
Backend publikuje się razem z frontendem w Netlify; base directory pozostaje
`peakguide_front`. Nowa funkcja: `/.netlify/functions/peak-weather?peak=rysy`.

1. Przejrzyj [warunki MET Norway](https://api.met.no/doc/TermsOfService),
   [licencję](https://api.met.no/doc/License) i zakres PR. Punkt „Use of AI agents”
   wymaga przeczytania i zaakceptowania warunków przez człowieka uprawnionego
   do reprezentowania projektu, zanim usługa będzie używana. Agent nie deklaruje
   takiej akceptacji za właściciela i nie wywołuje produkcyjnego API podczas testów.
2. Jeżeli akceptujesz te warunki, w **Netlify → Project configuration → Environment
   variables** dodaj `PEAKGUIDE_WEATHER_ENABLED` = `true`, dostępne dla **Functions**
   (lub wszystkich zakresów) w wybranym kontekście wdrożenia. Najpierw można włączyć
   tylko Deploy Previews. To przełącznik, nie sekret. Nie ustawiaj flagi tylko
   jako zmiennej Vite: backend odczytuje ją w runtime Node.
3. Scal PR i wdroż. Przy zmianie konfiguracji istniejącego wdrożenia wykonaj
   ponowne wdrożenie, aby funkcja dostała nową wartość.
4. Na stronie szczytu kliknij „Pokaż prognozę”. Sprawdź datę, punkt, wysokość,
   rozwijaną tabelę i link do licencji. Wyłączenie: usuń flagę/ustaw false i wdroż.
   Wcześniejsza poprawna odpowiedź CDN może pozostać do swojego terminu wygaśnięcia;
   natychmiastowe odcięcie wymaga wyczyszczenia cache Netlify.

Bez flagi funkcja zwraca 503 bez połączenia z MET, a karta po kliknięciu pokazuje
niedostępność i możliwość ponowienia. Merge sam w sobie nie aktywuje dostawcy.

## Źródło i ograniczenia

Dokumentacja sprawdzona 22 listopada 2026:
- https://api.met.no/doc/TermsOfService
- https://api.met.no/doc/ForecastJSON
- https://api.met.no/doc/GettingStarted

Locationforecast 2.0 compact; identyfikacja `PeakGuide/1.0 github.com/Silentmaster86/peakguide`.
Dane CC BY 4.0: karta podaje autora, link do licencji i przeliczenie m/s → km/h.
Nie używa znaków/logo Yr i nie sugeruje poparcia dostawcy.

Żądanie klienta zawiera wyłącznie slug z wersjonowanej listy. Backend sam wybiera
koordynaty, wysokość i strefę czasu, odrzuca dowolne współrzędne/URL, nie przekazuje do MET
adresu IP klienta, ciasteczek ani tożsamości konta. Współrzędne są ograniczone
do 4 miejsc dziesiętnych; wysokość pochodzi z katalogu. Mapa/tereny mogą wymagać
niezależnej korekty współrzędnych. Prognoza nie opisuje mikroklimatu grani.

Backend respektuje Expires i Last-Modified/If-Modified-Since, łączy równoległe
żądania tej samej lokalizacji, ma timeout, limit równoległości i krótki cache
błędów/Retry-After. Poprawne odpowiedzi mają cache HTTP/CDN; błędy nie są cache'owane
przez CDN. Cache procesu i limit ruchu są lokalne dla instancji, nie globalne.
Przy skalowaniu sprawdzić łączny ruch i dodać wspólną bramkę/cache przed osiągnięciem
limitu dostawcy (20 żądań/s aplikacji). Nie traktować tego jako gwarancji SLA.
Brak porywów/opadów = „brak danych”; opad 6h nie jest opadem 1h. Model starszy niż
48h jest odrzucany; ponad 12h ma widoczną informację. HTTP 203 jest oznaczony jako
wersja wycofywana. Nie pobiera automatycznie w tle ani podczas przeglądania listy.

## Aktualizacja lokalizacji

Lista 88 aktywnych publicznych szczytów pochodzi z odczytu 22 listopada 2026.
Po dodaniu/ukryciu szczytu lub korekcie punktu odświeżyć i sprawdzić diff:

```sh
# Publiczny anon key w SUPABASE_ANON_KEY, bez service_role.
python scripts/build_weather_locations.py --url https://PROJECT.supabase.co
```

Nie usuwać listy tylko dlatego, że API chwilowo odmawia dostępu. Skrypt odmawia
zapisu pustego wyniku. Własne nowe szczyty wymagają aktualizacji manifestu i deploy.
Dostępność prognozy w danej lokalizacji sprawdza dostawca; 88 punktów w liście nie
jest potwierdzeniem 88 poprawnych odpowiedzi pogodowych.

## Testy

`npm run check` zawiera testy adaptera Node oraz UI. `npm run test:e2e` zawiera
18 przypadków desktop/mobile, Light/Dark, 4 języki, klawiaturę, Axe i błąd/retry.
Jawne role regionów usuwają awarię analizy ARIA w Firefoxie; żadna reguła Axe
nie jest wyłączona. Kafelki mapy w testach są atrapą, bez zależności od sieci.
Testy używają atrap dostawcy i nie potwierdzają produkcyjnej konfiguracji Netlify
ani bieżących warunków meteorologicznych. Lokalnie również sprawdzono bundlowanie
funkcji esbuild do ESM. Serwer Vite nie wykonuje funkcji Netlify; do ręcznego testu
całości użyć Netlify Dev lub Deploy Preview po akceptacji warunków.


## Odświeżona karta — 25 listopada 2026

Cztery kafelki z piktogramami parametrów i większymi wartościami; termin prognozy
oraz strefa są widoczne nad nimi. Punkt/wysokość i daty modelu przeniesiono do
rozwijanych szczegółów. Tabela godzinowa, źródło, licencja, komunikaty braku danych,
błędów i nieaktualnego modelu pozostają dostępne. Ikony oznaczają parametry,
nie wymyślone warunki na niebie. Nadal prognoza modelowa, pobierana po kliknięciu.
Ten etap nie zmienia backendu, dostawcy ani istniejącej konfiguracji Netlify.
Strona pogody i geokodowanie miast są osobnymi, następnymi etapami (docelowo `/weather`).

## Etap 4 — prognoza dzienna i wyszukiwanie miejscowości

Backend Open-Meteo jest dodatkiem do obecnej karty MET, która nadal korzysta z
`peak-weather` i ma zakres do 72 godzin. Nowe funkcje są przygotowane dla przyszłej
strony `/weather`; ten PR nie dodaje jeszcze linku w menu ani nowego widoku.
Nie potrzeba SQL, nowego sekretu, konta dostawcy ani dodatkowej zmiennej Netlify.
Istniejące `PEAKGUIDE_WEATHER_ENABLED=true` włącza teraz także te dwa endpointy:

- `/.netlify/functions/weather-search?q=Warszawa&lang=pl`
- `/.netlify/functions/weather-forecast?city=756135&lang=pl`
- `/.netlify/functions/weather-forecast?peak=rysy`

Bez flagi poprawne żądanie zwraca `503 not_configured`, bez połączenia z dostawcą.
Właściciel wykonuje tylko merge; konfiguracja działającej wcześniej pogody wystarcza.
Testy funkcji używają atrap. Sprawdzono publiczny format rekordu geokodera i błąd
nieznanego ID; nie uruchamiano produkcyjnej prognozy ani płatnych usług.

### Kontrakt dla następnego frontendu

Wyszukiwanie: `q` 2–80 znaków Unicode, opcjonalny `lang=pl|en|ua|zh`, do 8 wyników.
Każdy wynik ma `kind:city`, liczbowe `id`, nazwę, `admin1`, kraj, współrzędne,
opcjonalną wysokość i strefę IANA. Wybór miasta przekazuje jego ID, nie dowolne
współrzędne klienta. Serwer ponownie rozwiązuje ID. Zachowuje różne miejscowości
tej samej nazwy; brak wyników to pusta lista, a nie zgadywanie lokalizacji.
Dwa znaki pozwalają szukać np. Pekinu (`北京`). Kod UI `ua` mapuje się na API `uk`.
Geokoder może zwrócić nazwę angielską/lokalną, gdy nie ma przekładu.

Prognoza: dokładnie jedno z `city` lub `peak`; opcjonalny `lang` dotyczy nazwy miasta.
Szczyt musi być w wersjonowanej liście `peak-locations.json`. Jego wysokość pochodzi
z katalogu i jest przekazywana do modelu. Miasto bez wysokości korzysta z DEM;
nie zamieniamy braku na zero. Odpowiedź zawiera:

- `location`: wybrany punkt/ID i strefa; `model_location`: rzeczywisty punkt siatki.
- `retrieved_at`: czas pobrania, **nie data aktualizacji modelu**. Nie ma fikcyjnego `updated_at`.
- `available_days` i `days`: do 15 rzeczywistych dni z datą, początkiem/końcem okresu,
  min/max °C, kodem WMO, sumą opadu mm, maksymalnym prawdopodobieństwem %, wiatrem,
  porywami km/h, wschodem/zachodem UTC i długością dnia w sekundach.
- `source`: Open-Meteo, link i CC BY 4.0. Wyszukiwanie wskazuje również GeoNames.

Pobrać jedną prognozę i lokalnie wybierać 3/5/10/15 dni. Nie zamawiać osobnej
odpowiedzi dla każdego przycisku. `available_days` może być mniejsze; dni bez obu
temperatur nie są przedstawiane jako kompletna prognoza. Brakujące metryki są `null`,
zero pozostaje zerem, nieznany kod WMO nie staje się pogodą słoneczną. Zdarzenia
polarne nie są datami z 1970 roku. Opad jest sumą **dobową**, nie następną godziną MET.

API stosuje stały offset z chwili żądania do granic dobowych. `date` zachowuje etykietę
tego okresu; `period_utc_offset_seconds` podaje offset. `sunrise`/`sunset` są chwilami
UTC do formatowania przez `Intl` w `time_zone`, z uwzględnieniem zmiany czasu.
Nie wyliczać daty agregatu dobowego przez obcięcie dowolnie przestawionej godziny UTC.
Walidowane są m.in. jednostki, długości tablic, offset, świeżość pierwszej daty,
odległość siatki do 100 km i zgodność zadanej wysokości. Limit odległości jest
kontrolą pomylenia odpowiedzi, nie deklaracją dokładności prognozy.

### Ruch i utrzymanie

Stałe hosty, brak przekazywania cookies/tożsamości/IP użytkownika, timeout 8 s,
limit odpowiedzi 1 MB, deduplikacja równoległych żądań i do 256 wpisów LRU.
Cache: wyszukiwanie 6 h, rekord ID 24 h, model 10 min lub do najbliższej granicy
doby. Odpowiedzi mają też cache HTTP/CDN. Błędy są ukryte za stałymi kodami JSON,
bez surowych treści dostawcy; błędy HTTP nie trafiają do cache CDN. `Retry-After`
i ochłodzenie hosta obejmują różne zapytania; błędne ID nie wyłącza innych miast.

Ograniczenie procesu: 20 nowych żądań upstream/min, 2000/dobę i 4 jednocześnie; trafienia cache
nie zużywają tego limitu. Instancje Netlify nie współdzielą pamięci ani globalnego
licznika. To nie gwarancja limitu całej aplikacji przy skalowaniu; wtedy potrzebna
jest wspólna bramka/cache. Wyłączenie flagi zatrzymuje nowe wywołania funkcji, ale
wcześniej zapisany publiczny cache może żyć do swojego terminu (jak dla MET).

Zweryfikowane 25 listopada 2026: [prognoza](https://open-meteo.com/en/docs),
[geokodowanie](https://open-meteo.com/en/docs/geocoding-api),
[warunki](https://open-meteo.com/en/terms), [licencje](https://open-meteo.com/en/licence).
Bezpłatny endpoint jest dla zastosowań niekomercyjnych; limity dostawcy to poniżej
10 000/dobę, 5000/godzinę i 600/min. Netlify może trafić na ograniczenie wspólnego IP
wcześniej. Ta integracja nie zakłada abonamentu i nie używa hostów płatnej usługi.
