# Brakująca funkcja admin-delete-user

Zrzut ekranu właściciela z 9 listopada pokazuje produkcyjny projekt
`bxlntnuzrfnplpxfnmab`, pustą listę Edge Functions i napis „Deploy your first
Edge Function”. Poprzednie założenie o już wdrożonej funkcji było błędne:
frontend zawierał jej wywołanie, ale nie mieliśmy potwierdzenia wdrożenia.
Właściciel nie ma tu istniejącego kodu do przesłania.

## Przygotowane pliki

- `supabase/functions/admin-delete-user/index.ts`: wejście Deno, przypięty SDK,
  konfiguracja serwerowego klienta i dozwolonych originów.
- `supabase/functions/admin-delete-user/handler.mjs`: obsługa HTTP i autoryzacja.
- `supabase/config.toml`: ustawienia wdrożenia funkcji (nie pełny lokalny schemat).
- `supabase/tests/admin_delete_user.test.mjs`: 26 testów obsługi żądania, bez
  połączeń z prawdziwym Auth ani usuwania rzeczywistych kont.
- `peakguide_front/src/features/adminUsers/api.js` i test: odczyt komunikatów
  błędów HTTP, brak sukcesu bez potwierdzenia konkretnego usuwanego konta.

Funkcja przyjmuje POST z JSON `{ "userId": "UUID" }`. Weryfikuje Bearer token
przez `auth.getUser(token)`, odczytuje aktualny profil z bazy i wymaga
`role='admin' AND is_admin=true`. Nie ufa roli z body, metadanych ani samego
odkodowania JWT. Odrzuca usunięcie własnego konta, także przy różnej wielkości
liter UUID. Następnie wywołuje `auth.admin.deleteUser(userId)`.

Nie usuwa osobno profilu. FK z `profiles.id` do `auth.users.id` wykonuje kaskadę;
trigger ochrony administratorów i migracja 012 kontrolują ostatniego administratora.
Nie zastępuj ich liczeniem administratorów w JavaScript. Operacja Auth może też
zostać odrzucona np. z powodu zależnych zasobów. Handler zwraca błąd bez awaryjnego
kasowania danych. Po zerwaniu połączenia odśwież listę przed kolejną próbą:
odpowiedź mogła zaginąć już po wykonaniu operacji.

Sprawdzenie roli i wywołanie Auth są osobnymi żądaniami. Odebranie roli w trakcie
już autoryzowanego żądania nie gwarantuje jego anulowania. Ochrona liczby
administratorów pozostaje transakcyjna w bazie; nie oznacza to atomowego
sprawdzenia uprawnień całego przepływu HTTP/Auth.

## Walidacja i ograniczenia

- **26/26 testów handlera**: token, rola, brak profilu, błędy odczytu, odmowa
  samo-usunięcia, UUID, CORS, metody, JSON/limit 4 KiB, sukces i błędy Auth.
  Klient SDK jest kontrolowanym zamiennikiem; nie jest to test wdrożonej funkcji.
- **84/84 Vitest**, testy Node, lint i build frontendu — PASS.
- `deno check supabase/functions/admin-delete-user/index.ts` — PASS, Deno 2.9.6.
- Testy bazy z wcześniejszego etapu oddzielnie sprawdzają kaskady i ochronę
  ostatniego administratora. Nie stanowią jeszcze testu całej ścieżki przez GoTrue.
- Pozostaje kontrolowany test wdrożonej funkcji, prawdziwego Auth i usuwania konta
  przeznaczonego wyłącznie do testów. Niczego nie wdrożono ani nie usunięto w chmurze.

## Wdrożenie — po przygotowaniu migracji, przed publikacją panelu

1. Zachowaj kopię bazy i potwierdź wdrożenie migracji 011 oraz 012 według
   [instrukcji](../2026-11-07/wdrozenie.md). Funkcja usuwania wymaga istniejącej
   ochrony profili i poprawki 012; sama nie instaluje zabezpieczeń SQL.
2. Najwygodniej wdrożyć cały katalog funkcji z gałęzi `fix/audit-completion`
   przez Supabase CLI, po zalogowaniu CLI na konto właściciela:

   ```sh
   supabase functions deploy admin-delete-user --project-ref bxlntnuzrfnplpxfnmab
   ```

   Uruchom z katalogu głównego repo. Ta komenda **wdraża funkcję na produkcję**;
   nie została wykonana przez agenta. Nie uruchamia przy okazji migracji bazy.
3. Alternatywnie w panelu Edge Functions wybierz **Open Editor** / **Via Editor**,
   nazwij funkcję `admin-delete-user` i dodaj oba pliki `index.ts`, `handler.mjs`
   z katalogu repo. Względny import wymaga obecności obu plików w tym samym katalogu.
   Nie pozostawiaj kodu startowego Hello World zamiast przygotowanego handlera.
4. Domyślnie handler pozwala na origin `https://peak-guide.netlify.app`.
   Opcjonalny sekret `ALLOWED_ORIGINS` to lista dokładnych originów oddzielonych
   przecinkami. Nie używaj wildcardów. Podgląd Netlify nadal może wskazywać
   produkcyjną bazę — dodanie jego originu nie tworzy izolowanego środowiska.
5. `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` są ustawieniami środowiska funkcji
   Supabase. Nie dodawaj klucza serwerowego do VITE, repozytorium ani czatu.
   Handler przy braku konfiguracji odmawia wykonania operacji.
6. `verify_jwt=false` w config.toml wyłącza starą kontrolę JWT na bramce, ponieważ
   handler sam weryfikuje token przez Auth; obsługuje to również nowe klucze
   podpisujące. Przy wdrożeniu przez panel ustaw analogicznie kontrolę JWT
   dla **tej konkretnej funkcji**, dopiero po wgraniu pełnego handlera. Nie oznacza
   to anonimowego usuwania: brak/niepoprawny token daje 401, brak roli — 403.
7. Sprawdź odmowę bez sesji, odmowę zwykłemu użytkownikowi, odmowę usunięcia siebie
   i usunięcie jednego kontrolowanego konta testowego przez administratora.
   Potwierdź brak tego konta zarówno w Authentication → Users, jak i profiles.
   Nie sprawdzaj destrukcyjnych scenariuszy na rzeczywistych użytkownikach.

Merge PR do GitHub **nie wdraża Edge Function do Supabase**. CI nie ma tokena
zarządzającego Supabase i jedynie uruchamia testy. Po sprawdzeniu funkcji oraz
przepływów Auth można domknąć przygotowanie wydania frontendu.

## Dokumentacja

- [Supabase: wdrażanie przez panel](https://supabase.com/docs/guides/functions/quickstart-dashboard)
- [Supabase: nagłówki autoryzacji](https://supabase.com/docs/guides/functions/auth-headers)
- [Supabase: weryfikacja tokenu przez getUser](https://supabase.com/docs/guides/functions/auth-legacy-jwt)
