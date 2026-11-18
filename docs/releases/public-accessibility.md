# Dostępność strony głównej i listy pasm

## Zakres

Audyt automatyczny publicznej strony (17 listopada 2026) w trybie Light,
po polsku, przy szerokościach 1440 i 390 px objął stronę główną, mapę
(z zamkniętym i otwartym panelem warstw), pasma, trasy, Łysicę,
stronę informacyjną i rejestrację.

Wykryto dwa problemy:

- Przycisk „Odkrywaj szczyty” miał kontrast tekstu 3,57:1 w trybie Light.
  Kolor tekstu zależy teraz od motywu: biały w Light, ciemny w Dark.
  Tło przycisku oraz tła strony pozostają dotychczasowe.
- Nazwy pasm były nagłówkami h3 bez poprzedzających h2. Są teraz h2,
  z zachowaniem dotychczasowego stylu kafelków.

## Weryfikacja i wdrożenie

Testy przeglądarkowe sprawdzają kontrast co najmniej 4,5:1 w czterech
językach, motywy Light/Dark/System, przejście do katalogu klawiaturą,
strukturę nagłówków oraz brak poziomego przewijania przycisku.
Korzystają z testowych danych API; nie tworzą kont ani wpisów produkcyjnych.

To ograniczony audyt automatyczny, a nie potwierdzenie pełnej zgodności WCAG.
Po wdrożeniu warto także obejrzeć stronę na fizycznym telefonie i sprawdzić
czytnik ekranu.

Wystarczy standardowe wdrożenie frontendu po merge. Nie ma SQL ani zmian
Supabase; nie jest potrzebny backup bazy. PR jest niezależny od narzędzi
backupu i oczekujących pakietów katalogu. W razie potrzeby można przywrócić
poprzednie wdrożenie Netlify.
