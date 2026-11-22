# Światło dzienne przy szczycie

Samodzielny dodatek do strony szczytu: wybrana data wycieczki, wschód i zachód
słońca, długość dnia oraz świt/zmierzch cywilny. PL/EN/UA/ZH; Light/Dark i telefon.
Działa lokalnie w przeglądarce, bez zewnętrznych żądań, kluczy API i SQL.
**Działanie właściciela: tylko merge i zwykłe wdrożenie Netlify.**
Niezależny od PR pogody i jego przełącznika akceptacji dostawcy.

## Daty i strefy

Domyślna data pochodzi ze strefy kraju szczytu, nie z zegara kraju użytkownika.
Obsługiwane obecne kraje katalogu: PL → Europe/Warsaw, GB → Europe/London,
UA → Europe/Kyiv, SK → Europe/Bratislava, CN → Asia/Shanghai. Intl uwzględnia
zmiany czasu według bazy stref przeglądarki. Dla nowego/nieznanego kraju jawnie
używamy UTC i pokazujemy informację — nie zgadujemy stref państw wielostrefowych.
Wyświetlamy także datę zdarzenia, więc przesunięcie między dobami jest widoczne.

Wybrana data identyfikuje cykl słoneczny w danej długości geograficznej.
Zakres wejścia: 1900–2100, z kontrolą faktycznej daty (np. 30 lutego jest błędem).
Brak współrzędnych nie staje się punktem (0,0). Dzień/noc polarna ma osobny stan;
nie wyświetlamy Invalid Date ani sztucznego wschodu/zachodu. Data pozostaje wybrana
przy zmianie języka, a po zmianie szczytu karta rozpoczyna od jego bieżącej daty.

## Dokładność

SunCalc 1.9.0, przypięty w package-lock; źródło: https://github.com/mourner/suncalc .
Biblioteka stosuje przybliżenia astronomiczne i otwarty horyzont; nie wykorzystuje
lokalnego profilu terenu, drzew, budynków ani zachmurzenia. Nie przekazujemy
wysokości nad poziomem morza jako wysokości obserwatora ponad otoczeniem — to
różne wielkości. Godziny do minut, bez deklaracji dokładności obserwacji w górach.
Świt/zmierzch cywilny nie gwarantuje bezpiecznej widoczności na szlaku.

Tekst licencji BSD-2-Clause, autor Vladimir Agafonkin, jest dystrybuowany
z frontendem pod `/licenses/suncalc.txt` i podlinkowany przy karcie.

## Walidacja

Testy obejmują przybliżony wschód dla Greenwich w przesileniu, sezonową długość
dnia, równik i obie strony zmiany doby, dzień/noc polarną, daty przestępne,
brak/niepoprawne współrzędne oraz datę docelowej strefy. Testy UI: cztery języki,
wybór daty, powrót do dzisiaj, brak danych. E2E: 16 kombinacji desktop/mobile,
Light/Dark i czterech języków, klawiatura, brak przepełnienia oraz Axe karty.
To nie pomiar rzeczywistej widoczności ani certyfikacja dostępności całej strony.
