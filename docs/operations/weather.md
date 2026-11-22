# Prognoza przy szczycie — frontend i backend Netlify

Zakres: temperatura, wiatr, opcjonalne porywy i opad w następnej godzinie,
lista terminów do 72 godzin, punkt i wysokość modelu, czas aktualizacji i pobrania.
PL/EN/UA/ZH; jawna strefa godzin przeglądarki, nie domniemana strefa szczytu.
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
koordynaty i wysokość, odrzuca dowolne współrzędne/URL, nie przekazuje do MET
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
Testy używają atrap dostawcy i nie potwierdzają produkcyjnej konfiguracji Netlify
ani bieżących warunków meteorologicznych. Lokalnie również sprawdzono bundlowanie
funkcji esbuild do ESM. Serwer Vite nie wykonuje funkcji Netlify; do ręcznego testu
całości użyć Netlify Dev lub Deploy Preview po akceptacji warunków.
