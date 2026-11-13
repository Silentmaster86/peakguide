# Kolejność wdrożenia i odtworzenie testów

## Przegląd kodu

Po zrzucie ekranu panelu potwierdzono brak wdrożonych Edge Functions.
Kod `admin-delete-user` jest teraz przygotowany w PR, a [instrukcja jego
wdrożenia](../2026-11-09/edge-function.md) zastępuje wcześniejsze prośby o eksport
już wdrożonej funkcji. Sam merge do GitHub nie wdraża jej do Supabase.

Pracuj na `fix/audit-completion`. Nie kopiuj zmian pojedynczymi plikami na `main` — część importów, słowników i testów jest wspólna. Zapis administratora z tej gałęzi **wymaga migracji 011**. Nie należy wdrażać samego frontendu przed przygotowaniem funkcji.

## Kontrola lokalna

```sh
cd peakguide_front
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
```

Playwright uruchamia własny serwer i używa kontrolowanych odpowiedzi API. Do lokalnego Chromium można ustawić `PLAYWRIGHT_CHROMIUM_EXECUTABLE`; CI instaluje przeglądarkę Playwright. `npm run check` nie wysyła wiadomości ani zapisów do produkcji.

```sh
python -m unittest discover -s scripts -p 'test_*.py'
python scripts/generate_verified_coords.py
```

Powyższe komendy uruchamia się z katalogu głównego repo. Druga domyślnie wypisuje raport i nie tworzy SQL. Wzór rekordów weryfikacyjnych pokazuje test Pythona; wartości testowe nie są danymi gór i nie wolno ich importować.

Odtworzenie obrazów i sitemapy z katalogu `peakguide_front`:

```sh
npm run images
npm run sitemap
```

Sitemapa wymaga `VITE_SUPABASE_URL` i publicznego `VITE_SUPABASE_ANON_KEY` w środowisku lub ignorowanym pliku `.env.local`. Skrypt używa wyłącznie GET i nie nadpisuje sitemapy, jeśli odczyt jest błędny. Nie należy umieszczać klucza `service_role` we frontendzie ani w plikach VITE.

## Baza stagingowa

Aktualizacja po odczycie konfiguracji produkcji: [testy uprawnień i poprawka
ochrony administratorów](../2026-11-09/access-verification.md). Dodano migrację
`202611090012_serialize_profile_writes.sql`, lokalnie sprawdzoną w 18 scenariuszach
współbieżności. Nie została zastosowana na produkcji. Nie wymaga nowego projektu
Supabase do odtworzenia testów; używany jest jednorazowy lokalny PostgreSQL.

Jeśli istnieje tylko projekt produkcyjny, zacznij od
[instrukcji przygotowania stagingu](../2026-11-08/staging.md).
Podgląd Netlify wymaga osobnych zmiennych Supabase w kontekście Deploy Previews;
sam adres podglądu nie oznacza odizolowanej bazy.

1. Przygotuj kopię schematu i kontrolowane dane testowe. Zachowaj eksport/backup przed migracją. Nie traktuj `supabase/tests/admin_save_peak.sql` jako bazowego schematu aplikacji: to minimalny fixture testu, zawierający celowo uproszczoną kontrolę roli.
2. Uruchom odczytowy `supabase/audit_preflight.sql`. Sprawdź kolumny `peaks` i `peaks_i18n`, FK podpasm, typ punktu, uprawnienia do sekwencji, RLS i istniejące `is_peakguide_admin()`. Funkcje `st_setsrid` i `st_makepoint` muszą być dostępne dla funkcji RPC. Jeśli PostGIS jest w innym schemacie niż `public`, dodaj w migracji odpowiednią, jawnie zweryfikowaną kwalifikację nazw.
3. Uruchom `supabase/migrations/202611070011_admin_save_peak.sql` na stagingu. Migracja jest addytywna, ale nie odbudowuje brakującego schematu i nie nadaje nowych uprawnień do tabel w celu obchodzenia istniejących RLS.
4. Jako administrator utwórz szczyt z jednym tłumaczeniem, zaktualizuj go i dodaj drugie tłumaczenie. Puste tłumaczenia nie powinny powstawać. Wymuś błąd zapisu tłumaczenia na kontrolowanym rekordzie — żadne pola szczytu nie mogą się częściowo zmienić.
5. Sprawdź niewłaściwe podpasmo, brak wysokości, jedną pustą współrzędną, zakresy 91/181 oraz brak rekordu. Sprawdź, że wyzerowanie obu współrzędnych usuwa `geom`, a zapis poprawnych synchronizuje punkt w kolejności longitude/latitude.
6. Powtórz odrzucane operacje jako gość i zwykły użytkownik. Sprawdź osobno, czy bezpośredni REST do tabel również respektuje reguły. Test nowego RPC nie dowodzi poprawności wszystkich starych polityk tabel.
7. Wyeksportuj i przejrzyj kod wdrożonej funkcji `admin-delete-user`. Sprawdź ochronę ról i ostatniego administratora po stronie serwera. Repozytorium nie zawiera jej źródła, więc ten punkt nie jest zamknięty.

## Konta i przekierowania

W Supabase Authentication → URL Configuration sprawdź poprawny Site URL i dopuszczenie:

```text
https://peak-guide.netlify.app/reset-password
https://<rzeczywisty-host-stagingu>/reset-password
```

Drugi adres zastąp istniejącym hostem. Nie dodawaj szerokiego wildcardu tylko dla wygody testu. Użyj kontrolowanej skrzynki stagingowej do rejestracji, potwierdzenia adresu, żądania resetu, zmiany hasła i sprawdzenia wygasłego linku. Sam neutralny komunikat „jeśli konto istnieje…” nie dowodzi dostarczenia wiadomości.

## Publikacja i wycofanie

1. Przejrzyj PR i wyniki CI; najpierw zamknij wymagane testy stagingu.
2. Zastosuj zweryfikowaną migrację 011 w docelowej bazie.
   Migrację 012 ochrony administratorów zastosuj osobno po przeglądzie jej skutków
   dla Auth i sprawdzeniu kodu `admin-delete-user`. Nie pomijaj jej przy uznaniu
   problemu ostatniego administratora za naprawiony na produkcji.
3. Wdróż odpowiadający frontend przez normalny przepływ Netlify.
4. Sprawdź listy, szczegóły, aktywne filtry, konkretną trasę i kontrolowane konto. Zweryfikuj zapis administratora na przeznaczonym do tego rekordzie.
5. Przy problemie frontendu przywróć poprzedni deploy Netlify. Nową, nieużywaną funkcję RPC można pozostawić — nie trzeba destrukcyjnie usuwać danych. Jeśli problem dotyczy zapisu w bazie, najpierw zatrzymaj używanie tego formularza i ustal stan transakcji przed kolejną migracją.

Samo otwarcie draft PR nie oznacza zgody na merge, wdrożenie produkcyjne ani wykonywanie migracji na produkcji.
