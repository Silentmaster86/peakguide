# Mapa w stylu Gazetteera

Zmiana interfejsu na podstawie https://gazetteer.przemyslawpietkun.co.uk/:
większa mapa, panel warstw w prawym rogu, kolorowe pinezki z ikonami, okrągłe
liczniki grup szczytów, czytelniejsze dymki, legenda w panelu warstw i przyciski przywrócenia
widoku/powiększenia. Ikony parkingu, schroniska, początku szlaku i punktu widokowego
wynikają z istniejącego typu POI; brak rozpoznanego typu dostaje ikonę informacji.

Filtry kraju/pasma/nazwy oraz listy tekstowe pozostają dostępne. Panel warstw można
obsługiwać klawiaturą; Escape najpierw zamyka panel, a następnie powiększoną mapę.
Powiększony widok zachowuje filtry i ogranicza Tab do mapy. Przełączanie podkładu
nie zeruje filtrów. Nie dodano bibliotek ani zależności od API Gazetteera.

Nie wymaga SQL, migracji ani ponownego importu danych. Wystarczy merge i wdrożenie
frontendu przez Netlify. Sprawdzić standard/satelitę/topografię, klawiaturę i ekran
telefonu. W źródłowym Gazetteerze mapa inicjalizowała się, ale preloader nie znikał
w sesji testowej; inspirację potwierdzono także odczytem jego HTML/JS/CSS.

Po uwadze właściciela: pinezki zmniejszono z 36×46 do 26×34 px, grupy z 44 do
34 px. Legenda używa zgodnych piktogramów i jest schowana razem z panelem warstw.

Przycisk warstw ma samą ikonę stosu i przetłumaczoną nazwę dla czytników ekranu.
Szczyty są domyślnie włączone i można je wyłączyć osobno w panelu warstw.
Wyłączenie wszystkich punktów pozostawia mapę i kontrolki dostępne.


## Kafelki wyników i spójność map — 24 listopada 2026

Listy szczytów, POI i tras pod mapą korzystają z tych samych kafelków i tła co
katalog. Nazwa prowadzi do szczegółów; karta pokazuje typ, lokalizację i dostępne
parametry, a brak współrzędnych jest opisany zamiast ukrywania wpisu. Nie uzupełnia
brakujących wysokości, czasów ani geometrii. Siatka przechodzi w jedną kolumnę na
telefonie. Nazwy i opisy pozostają tekstem, bez interpretowania HTML.

Mapki przy szczytach używają wspólnego zestawu `mapIcon` z mapą główną: szczyt,
parking, schronisko, początek szlaku, punkt widokowy oraz neutralne POI. Rozmiar
26×34 px pozostaje zgodny z wcześniej zaakceptowanymi pinezkami. Linki z dymków,
walidacja współrzędnych i odfiltrowanie nieaktywnych POI pozostają dostępne.

To niezależny PR frontendu, przygotowany na main po #40. Zalecana kolejność
przeglądu: #41 (nawigacja), następnie kafelki mapy. Nie wymaga SQL ani aktywacji API;
import #40 nadal jest odłożony. Kolejny etap to pogoda i wschód/zachód słońca.

## Nawigacja na stronie szczytu

Po włączeniu sticky navbaru zakładki szczegółów miały nadal stały odstęp 10 px
od góry i chowały się pod nim. Wysokość navbaru oraz zakładek jest teraz mierzona
przy zmianie rozmiaru, języka i zawijania przycisków. Zakładki, panel boczny oraz
margines przewijania do konkretnej trasy uwzględniają oba paski. Mierniki są
odłączane po opuszczeniu strony. Bez nowych bibliotek, API i SQL.

Poprawka jest niezależna od nowych kafelków pogody #43, ale zalecana kolejność
przeglądu to #43, potem ta poprawka. Import katalogu #40 nadal odłożony.
Pierwsze wejście linkiem do trasy nie jest traktowane jak powrót w historii;
powtórzony efekt montowania React nie nadpisuje jej automatycznego przewinięcia.
