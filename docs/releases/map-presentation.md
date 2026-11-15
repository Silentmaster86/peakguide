# Mapa w stylu Gazetteera

Zmiana interfejsu na podstawie https://gazetteer.przemyslawpietkun.co.uk/:
większa mapa, panel warstw w prawym rogu, kolorowe pinezki z ikonami, okrągłe
liczniki grup szczytów, czytelniejsze dymki, legenda i przyciski przywrócenia
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
