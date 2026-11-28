# Przegląd produkcji i poprawka klawiatury

28 listopada, produkcja `https://peak-guide.netlify.app`. Wyłącznie publiczny
odczyt, bez logowania, zmian w bazie ani wysyłki poczty.

## Potwierdzenie #48

Właściciel i GitHub potwierdzili merge #48 (`0a85cd2`). Wszystkie pięć nowych
profili wyrenderowano na produkcji; klawisz End wybiera ostatnią próbkę.
PL/EN/UA/ZH, Light/Dark, szerokości 320/390/1440 px, bez poziomego przepełnienia.
[Wynik](../../catalogue/elevation-profiles/production-rollout-48.json).

Pogoda Rysów: 390/1440 px × Light/Dark, bez poziomego przepełnienia i bez
naruszeń wykrytych przez Axe w sprawdzonym zakresie WCAG 2 A/AA, 2.1 AA i 2.2 AA.
To przegląd wybranych widoków; nie certyfikat WCAG ani test czytnikiem ekranu.

## Problem odtworzony przed poprawką

[Reprodukcja](keyboard-before.json) przy 390 i 1440 px:

- ArrowDown na przycisku „Więcej” nie otwiera menu.
- Tab przenosi fokus do następnej kontrolki, ale popup pozostaje otwarty.
- To samo dotyczy wyboru języka; wspólny hook obsługuje też wybór motywu.

Przegląd kodu wskazał ponadto, że zbiorczy selektor CSS wybiera pierwszy element
w kolejności DOM, nawet gdy aktywny język/motyw jest inną opcją. Na stronie
innej niż główna desktopowe „Więcej” może zawierać tylko nieaktywną zapowiedź;
wcześniej nie można było przenieść na nią fokusu.

## Przygotowana poprawka

Gałąź `fix/navbar-keyboard-dismissal`, oparta na scalonym #48:

- Tab/Shift+Tab zamyka popup, a przeglądarka kontynuuje normalną kolejność
  od przycisku otwierającego. Escape wraca do przycisku. Fokus poza grupą
  zamyka popup bez przejmowania fokusu.
- Strzałki otwierają menu; „Więcej” zaczyna od pierwszej/ostatniej pozycji.
- Język i motyw zaczynają od aktywnej opcji.
- Home/End i strzałki obejmują również opisane jako niedostępne pozycje menu;
  nie da się ich uruchomić. Space uruchamia aktywny odnośnik menu.
- Testy komponentów i rzeczywiste Tab/Shift+Tab w Playwright rozdzielono,
  ponieważ symulacja user-event oblicza cel Tab przed obsługą zdarzenia.

Bez nowych zależności, API, SQL i zmian wizualnych. Właściciel wykonuje merge
po zielonych testach. Ten dokument nie potwierdza wdrożenia poprawki na produkcji.
