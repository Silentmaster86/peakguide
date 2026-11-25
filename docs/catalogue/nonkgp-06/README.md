# Poza KGP — partia 06

**Wdrożenie potwierdzone przez właściciela 25 listopada 2026.** Czarna Góra (31), Kalenica (39), Wieżyca (82):
3 trasy z GPX/geometrią, 3 POI, 24 teksty PL/EN/UA/ZH, 403 punkty źródłowe.
Nie zmienia rekordów szczytów, uprawnień ani wcześniejszych treści. Dzikowiec
pozostaje poza importem ze względu na rozbieżność pasma i identyfikację dwóch wież.

Razem z partią 05 daje **5 tras, 5 POI, 40 tekstów i 748 punktów** w jednym PR.
Właściciel poprosił o większe wspólne wgrywanie. [Pakiet 05–06](../nonkgp-05-06/README.md)
został wykonany i ma potwierdzone 5/5 wierszy, w tym 3/3 partii 06.
[Zapis wyniku](production-verification.json). Nie ponawiać osobnych i zbiorczego importu
jako kolejnych kroków. #37/#38 są już potwierdzone i nie wymagają ponowienia.

## Dokładne warianty — przegląd 24 listopada 2026

| Szczyt | Odcinek w jedną stronę | Parametry tej karty | GPX |
| --- | --- | --- | --- |
| Czarna Góra | Międzygórze 50.228595/16.765246 → Rozdroże pod Lesieńcem → Przełęcz pod Jaworową Kopą → punkt szlakowy 50.252191/16.805033. Niebieski, zielony, końcowo czerwony/zielony. | 4,8 km / 647 m / 140 min | [l083](https://mapa-turystyczna.pl/route/l083), [264 punkty](https://mapa-turystyczna.pl/route/l083.gpx) |
| Kalenica | Przełęcz Jugowska 50.656125/16.526739 → czarny → rozwidlenie pod Rymarzem → Zimna Polanka → czerwony/żółty → 50.642790/16.546396. | 2,4 km / 200 m / 54 min | [6vs3](https://mapa-turystyczna.pl/route/6vs3), [113 punktów](https://mapa-turystyczna.pl/route/6vs3.gpx) |
| Wieżyca | Dom Turysty Pod Wieżycą 50.892567/16.726925 → rozwidlenie na przełęczy → żółty → 50.886715/16.728817. | 0,7 km / 123 m / 27 min | [Karta](https://mapa-turystyczna.pl/route?q=50.8925670,16.7269250;50.8867150,16.7288170), [26 punktów](https://mapa-turystyczna.pl/route/export?q=50.8925670,16.7269250;50.8867150,16.7288170) |

Zachowano pełne pojedyncze segmenty, bez przycinania, upraszczania lub dopisywania
łączników do pinezek. Nie wliczamy powrotu ani wejścia do wież. Czarna Góra nie
zaczyna się w ośrodku narciarskim; Kalenica nie prowadzi przez Zygmuntówkę;
Wieżyca nie obejmuje dalszej trasy na Ślężę. Krótki dystans Wieżycy nie oznacza
łatwego spaceru: źródło gminne opisuje stromy żółty wariant. `difficulty=null`;
kolor oznacza szlak, nie klasę trudności. Geometria 2D, brak deklaracji profilu.

Odrzucono kartę `3rqa1` Wieżycy: przy przeglądzie zawierała 12,6 km / 734 m /
270 min przez Ślężę, mimo krótszego tytułu w wyszukiwarce. Nowy GPX jest odrębnym
pełnym eksportem dwóch punktów, nie wycinkiem tej pętli. Nie mieszamy parametrów.
Fingerprinty pełnych plików i wszystkich współrzędnych: [geometry-review.json](geometry-review.json).

## POI

| Szczyt | Obiekt / typ / punkt ze źródła | Źródło |
| --- | --- | --- |
| Czarna Góra | Rejon dawnej wieży / attraction / 50.252114,16.804992. Wieża z 2001 r. została rozebrana w 2021 r.; nie przedstawiamy jej jako czynnej atrakcji. To marker rejonu, nie dokładny obrys fundamentów. | [PTTK 1956](https://dolnoslaskie.szlaki.pttk.pl/1956-dolnoslaskie-czarna-gora) |
| Kalenica | Stalowa wieża / viewpoint / 50.642793,16.546462. Daty 1932–33 i remont 2022 są informacją historyczną, nie gwarancją obecnego dostępu. | [PTTK 1117](https://dolnoslaskie.szlaki.pttk.pl/1117-dolnoslaskie-wieza-widokowa-na-kalenicy) |
| Wieżyca | Kamienna wieża / viewpoint / 50.886797,16.728945. PTTK: budowa 1905–07, wysokość 15 m. | [PTTK 1606](https://dolnoslaskie.szlaki.pttk.pl/1606-dolnoslaskie-wiezyca-wieza-widokowa) |

[Serwis turystyczny Sobótki](https://www.sleza.sobotka.pl/wiezyca/) podaje zwykły
sezon otwarcia wieży od końca marca do końca października w pogodne weekendy,
poza sezonem kontakt z gospodarzem. Notatki w czterech językach zachowują tę
kwalifikację; nie deklarują, że wieża jest otwarta w listopadzie. Odczyt przez
narzędzie web udostępnił treść; bezpośredni klient HTTP dostał ekran antybotowy.
Nie obchodzono zabezpieczenia. Nie kopiowano cen ani dokładnych godzin do danych.

Przy Kalenicy [Nadleśnictwo Świdnica](https://www.gov.pl/web/nadlesnictwo-swidnica/ochrona-przyrody)
potwierdza rezerwat Bukowa Kalenica. Notatki kierują na udostępnione szlaki i do
aktualnych komunikatów. POI nie obiecują wejścia do obiektów, działania wyciągów,
noclegów ani innych usług. GPX i data przeglądu nie są potwierdzeniem otwarcia
lub bezpieczeństwa. Nie dodano parkingów ani rozkładów jazdy bez przeglądu źródeł.

## Dzikowiec — oddzielny przegląd

[unresolved.json](unresolved.json) zachowuje odczytaną tożsamość: id52, range_id12
`gory-walbrzyskie`, 836 m, 50.723889/16.205833. [Gmina](https://boguszow-gorce.pl/)
i PTTK lokują Dzikowiec w Górach Kamiennych. Bez osobnej kontroli nie poprawiamy
pasma przy imporcie tras. [Gmina opisuje](https://boguszow-gorce.pl/masyw-dzikowca-i-lesistej-wielkiej.html)
nową wieżę na szczycie, otwartą 15 lutego 2025, oraz osobną starszą wieżę przy
stoku. [Karta PTTK 1198](https://dolnoslaskie.szlaki.pttk.pl/1198-dolnoslaskie-dzikowiec-wieza-widokowa)
opisuje starszą konstrukcję z 2013–14. Nie zamieniamy jednego obiektu w drugi pod
tym samym markerem. Przejrzany wariant 40q2 nie jest importowany. Szlaku nie
uznajemy za zamknięty z samego powodu wyłączenia rekordu z tej partii.

## Testowanie i import

```sh
python scripts/build_nonkgp_06.py --check --check-sources
python scripts/build_nonkgp_05_06.py --check
python -m unittest discover -s scripts -p 'test_*.py'
# Wyłącznie dedykowana lokalna baza nonkgp_06_test:
python supabase/tests/nonkgp_06_test.py
# Z peakguide_front:
npx playwright test e2e/nonkgp-catalogue-06.spec.mjs
```

Import sprawdza aktualną tożsamość, istniejące także ukryte treści, pełne typowane
pola i tłumaczenia. Prywatny rejestr chroni powtórzenie/cofnięcie po edycjach;
rollback chroni przyszłe FK CASCADE/SET NULL. Lokalny test zachowuje też wyłączony
rekord Dzikowca i uprawnienia. Sprawdza obie kolejności 05/06 oraz wspólną transakcję:
błąd drugiej partii cofa nowe zmiany pierwszej. Fixture nie jest restore produkcji.

Właściciel wykonał [wspólny import](../nonkgp-05-06/README.md); nie ponawiać go. Osobne pliki
apply/verify tej partii są alternatywą: verify daje 3 wiersze po 1 trasie/POI/geometrii,
PL/EN/UA/ZH i obie kontrole true. Rollback to awaryjne narzędzie, nie etap wdrożenia.
