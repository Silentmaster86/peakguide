# Przegląd po wdrożeniach — 22 listopada 2026

Badana produkcja: https://peak-guide.netlify.app/.
Stan kodu bazowego: `9c0496e` (PR #28 i #29 scalone).
Właściciel potwierdził SQL pakietów `foreign-gpx-01`, `kgp-practical-01` i `kgp-parking-02`.
Agent wykonał wyłącznie odczyty publicznego API i interakcje przeglądarkowe bez zapisów.

## Wyniki produkcyjne

- 57 widoków Chromium: strona główna, katalogi, szczegóły Karkonoszy, mapa,
  informacje/pomoc, formularze konta i nieistniejący adres; 390/1440 px, Light/Dark.
  Dodatkowo EN/UA/ZH strony głównej, mapy i Rysów na telefonie.
- Brak błędów JavaScript/API, przepełnienia poziomego i wykrytych uszkodzonych
  załadowanych obrazów w badanych widokach. To test przeglądarkowy, nie fizyczny telefon.
- Axe: 53 zwykłe widoki bez naruszeń sprawdzanych reguł WCAG A/AA; 4 warianty
  nieistniejącego adresu miały naruszenie `document-title` i brak nagłówka h1.
  Automatyczny wynik nie jest certyfikacją dostępności.
- Mapa, cztery kombinacje szerokości/motywu: realne kafelki standard/satelita/topo,
  filtr kraju i Rysów, POI i przebieg trasy, odhaczanie i przywracanie szczytów,
  powiększenie/wyjście Escape i przywrócenie fokusu, zapamiętanie podkładu po
  odświeżeniu, kolekcja KGP = 28 oraz rozwijanie kart Babiej Góry klawiaturą.
  Wszystkie przeszły; Axe powiększonego widoku bez naruszeń.
- Publiczny katalog: 88 aktywnych szczytów, 34 aktywne trasy (30 z geometrią),
  31 POI, 34 karty dostępu i 31 parkingów (liczniki obejmują zagranicę).
  Wszystkie badane rekordy mają PL/EN/UA/ZH; nie wykryto znanych wzorców uszkodzonego
  kodowania. Sprawdzone zakresy współrzędnych i ich zgodność z polem geom szczytów,
  struktura oraz zakresy punktów tras — bez błędów. Nie jest to pomiar terenowy
  ani potwierdzenie geograficznej dokładności każdego szczytu.
- KGP: 28 kart dostępu, 25 tras z kartą parkingu, 28 tras z przebiegiem i POI.
  Lackowa, Mogielica i Lubomir pozostają bez parkingu z powodów opisanych w
  `docs/catalogue/kgp-parking-02/unresolved.json`.

## Konkretne poprawki interfejsu

Nieistniejący adres pokazywał tylko „404”, bez tytułu po usunięciu statycznych
metadanych React. Dodano wspólną stronę odzyskania nawigacji dla nieznanych URL,
szczytów i pasm: h1, opis, link do właściwego katalogu i strony głównej w czterech
językach, tytuł, `noindex,follow`. Po przejściu do prawidłowej strony noindex znika.
Test obejmuje również niezaindeksowanie brakującego rekordu po wcześniejszej
nawigacji. Hosting pozostaje SPA: ten PR nie zmienia odpowiedzi HTTP na serwerowe 404.

Metadane szczegółów szczytów/pasm miały angielski tekst zastępczy dla UA/ZH.
Dodano brakujące wersje; istniejący opis z bazy zachowuje pierwszeństwo. Nie dodano
hreflang ani nieistniejących językowych URL. Regresje testowane przez rzeczywistą
nawigację przeglądarki i sprawdzenie head, nie tylko odzwierciedlenie JSX.

## Ważny przegląd danych: Krywań

Publiczna karta wspominała otwarcie po remoncie 9 października. Aktualny komunikat
TANAP z 30 października 2026 i regulamin (załącznik 3 A, pkt 17) wskazują zamknięcie
dla zwykłej turystyki pieszej 1.11.2026–31.05.2027. Obejmuje ono odcinki użyte
w zapisanej pętli. Przygotowany osobno `krivan-seasonal-01` aktualizuje cztery teksty
ostrzeżeń i źródło/datę jednej karty dostępu; nie rusza GPX, parkingów ani parametrów.
Wymaga osobnego wykonania SQL przez właściciela po sprawdzeniu wyniku verify.

## Nadal otwarte i konkretne ograniczenia przeglądu

1. Trzy parkingi: potrzebne potwierdzenie warunków dostępu lub prawidłowego wariantu;
   nie dopisywano parkingów dla gości ośrodka jako ogólnodostępnych.
2. Cztery GPX zagraniczne: Ben Nevis, Yr Wyddfa, Scafell Pike i multimodalne Huangshan.
   Nie zastąpiono pełnego powrotu samym śladem wejścia ani odcinka pieszo-kolejka
   narysowaną linią. Nowe kandydatury wymagają sprawdzenia całego przebiegu i warunków
   wykorzystania; odnalezienie linku nie jest wdrożeniem.
3. Operacje administratora i konta: lokalne testy na mockach/fixture; bez tworzenia,
   usuwania ani logowania na prawdziwe konta, wysyłania e-maili lub resetów na produkcji.
4. Pełne próbne odtworzenie prywatnego backupu nadal niepotwierdzone. Archiwum jest
   u właściciela; fixture i poprawny spis archiwum nie dowodzą możliwości pełnego restore.

Nie ponawiać ukończonych importów, nie zerować rejestrów i nie odblokowywać starych
rollbacków. Nowa korekta jest niezależnym, chronionym patchem.
