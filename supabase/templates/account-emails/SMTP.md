# Gmail: konfiguracja i wdrożenie

Wybrano Gmail, bez własnej domeny. Kod jest przygotowany; brak wdrożenia,
sekretów Gmail i testu rzeczywistej dostawy. Nie przekazuj sekretów w czacie.

## 1. Poczta Auth w Supabase

Na koncie `przemyslaw.pietkun@gmail.com` włącz weryfikację dwuetapową, a następnie
otwórz https://myaccount.google.com/apppasswords i utwórz hasło aplikacji „PeakGuide”.
Jeśli opcja jest niedostępna, sprawdź ograniczenia swojego konta Google; nie używaj
zwykłego hasła do Gmaila w zastępstwie.

W Supabase → Authentication → Emails → SMTP Settings ustaw:

| Pole | Wartość |
| --- | --- |
| Sender name | Przemysław — PeakGuide |
| Sender email | `przemyslaw.pietkun@gmail.com` |
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | `przemyslaw.pietkun@gmail.com` |
| Password | 16-znakowe hasło aplikacji Google, bez spacji |

Włącz Custom SMTP i zapisz komplet ustawień. Połączenie używa TLS od początku.
Nie zmieniaj Site URL ani obowiązku potwierdzania rejestracji. Wgraj tematy i treści
Reset password / Password changed opisane w [README.md](README.md). Włącz
powiadomienie Password changed. Zrób test resetu, zmiany hasła i ponownego logowania
na własnym koncie testowym; sprawdź temat oraz język wiadomości.

Limity Gmail są wspólne dla powitań, wiadomości Auth i prywatnej poczty tego konta.
Limity Auth w Supabase są osobnym ustawieniem. Zmiana głównego hasła Google
unieważnia hasła aplikacji — wtedy trzeba zaktualizować oba miejsca konfiguracji.

## 2. Sekrety funkcji powitalnej

W Supabase → Edge Functions → Secrets dodaj:

| Nazwa | Wartość |
| --- | --- |
| `GMAIL_USER` | `przemyslaw.pietkun@gmail.com` |
| `GMAIL_APP_PASSWORD` | Hasło aplikacji Google |
| `WELCOME_WORKER_SECRET` | Nowy losowy sekret, co najmniej 32 znaki |
| `WELCOME_EMAIL_ENABLED` | Na czas wdrażania `false` |

Losowy sekret można wygenerować lokalnie w PowerShell lub terminalu:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Nie jest to klucz anon, hasło Gmail ani klucz service_role. Funkcja porównuje ten
sekret przy każdym POST. `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` zapewnia
środowisko Supabase; nie dodawaj ich do frontendu ani nie nadpisuj kluczem użytkownika.

## 3. Baza i funkcja

Na telefonie można najpierw wdrożyć **wyłączoną** funkcję:

1. Otwórz `supabase/dashboard/welcome-email.ts` w tym PR, wybierz Raw i skopiuj
   całą zawartość. Jest to wygenerowany kompletny plik z tłumaczeniami, bez sekretów.
2. W Supabase → Edge Functions → Deploy a new function → Via Editor zastąp
   całą przykładową treść `index.ts` skopiowanym kodem.
3. W polu Function name wpisz dokładnie `welcome-email` i wybierz Deploy function.
4. W Settings tej funkcji wyłącz `Verify JWT with legacy secret` i zapisz.
   Weryfikacja sekretu zadania odbywa się w kodzie przy każdym POST.
5. Zostaw `WELCOME_EMAIL_ENABLED=false` do zakończenia dalszych kroków.

Plik dashboardowy generuje `node scripts/build_welcome_dashboard.mjs` po
`npm ci` w `peakguide_front`. CI sprawdza zgodność pliku ze źródłami.

Najpierw wdroż frontend zapisujący język rejestracji (`locale`) z tego PR.
Zachowaj kopię bazy przed migracją. W SQL Editor wykonaj
`supabase/migrations/202611100013_welcome_email_queue.sql` **jeden raz**.
Migracja dodaje prywatną kolejkę i trigger rejestracji. Nie wysyła powitań do
starych kont. Dla nowych kont czeka na `email_confirmed_at`, więc działa również
po ewentualnym włączeniu obowiązku potwierdzenia adresu. Nie zmienia zasad Auth.

Alternatywnie, zamiast edytora, na komputerze z katalogu repozytorium uruchom:

```sh
npx supabase login
npx supabase functions deploy welcome-email --project-ref bxlntnuzrfnplpxfnmab --use-api
```

`--use-api` pozwala wdrożyć bez lokalnego Dockera. Użyj nazwy `welcome-email`.
`supabase/config.toml` ustawia `verify_jwt=false`; dostęp chroni własny sekret
zadania, nie publiczny klucz anon. Kod funkcji importuje renderer i tłumaczenia
z repozytorium — nie kopiuj do edytora tylko samego pliku `index.ts`.

Funkcja łączy się z `smtp.gmail.com:465` po TLS. Porty 25 i 587 są zablokowane
w hostowanych Edge Functions. Zgodność kodu sprawdzono w Deno; rzeczywiste
połączenie Gmail z hostowanej funkcji wymaga testu po wdrożeniu.

## 4. Harmonogram

Włącz rozszerzenia `pg_cron` i `pg_net` w Supabase. W Vault dodaj:

- `peakguide_project_url`: `https://bxlntnuzrfnplpxfnmab.supabase.co`
- `peakguide_welcome_worker_secret`: dokładnie sekret `WELCOME_WORKER_SECRET`.

Następnie wykonaj `supabase/welcome_email_schedule.sql`. Zadanie bierze najwyżej
jedno powitanie co pięć minut. Nie umieszczaj hasła Gmail w tym SQL. Podczas obsługi
pg_net sekret zadania występuje w kolejce żądań; jest dedykowany wyłącznie do
uruchamiania tego workera, nie daje uprawnień administratora do bazy.

Po sprawdzeniu konfiguracji ustaw `WELCOME_EMAIL_ENABLED=true`, utwórz kontrolowane
konto testowe i poczekaj na najbliższe uruchomienie. Sprawdź powitanie, język oraz
rzeczywisty nagłówek Reply-To i odpowiedź trafiającą do Gmaila właściciela. Powtórz
kontrolowany test dla pozostałych języków. Starsze konta bez locale używają polskiego.

## Monitorowanie i zatrzymanie

Odczyt tylko w SQL Editor jako administrator:

```sql
select state, count(*) from peakguide_private.welcome_email_queue group by state;
```

`sent` oznacza przyjęcie wiadomości przez SMTP, nie gwarancję znalezienia jej w
skrzynce odbiorczej. Błąd tymczasowy z wyraźną odmową SMTP 4xx jest ponawiany po
15 minutach, maksymalnie trzy próby łącznie. Odmowa 5xx kończy się `failed`.
Timeout, zerwanie połączenia lub wygaśnięcie pięciominutowej blokady oznacza
`uncertain`: nie następuje automatyczne ponowienie, bo Gmail mógł już przyjąć mail.
Takie przypadki wymagają sprawdzenia skrzynki wysłanych przed ręcznym ponowieniem.
SMTP nie zapewnia gwarancji „dokładnie raz”.

Usunięcie konta usuwa też jego zadanie z kolejki. Awaria SMTP nie cofa rejestracji,
ponieważ sieć jest używana dopiero przez osobne zadanie po zatwierdzeniu transakcji.

Aby zatrzymać wysyłkę, ustaw `WELCOME_EMAIL_ENABLED=false` i wyłącz zadanie Cron.
Nie trzeba usuwać kolejki ani dotykać danych użytkowników. Wyłączenie workera
nie zatrzymuje natywnych resetów hasła obsługiwanych przez Supabase SMTP.

## Sprawdzone lokalnie

- testy handlera i adaptera: autoryzacja, adres z Auth, język, Reply-To, błędy;
- rzeczywisty PostgreSQL z uproszczoną tabelą Auth: brak backfillu, blokada
  niepotwierdzonych kont, granty, ponowienia, wygasłe zadania, kasowanie i konkurencja;
- `deno check` funkcji i generowanie MIME przez Nodemailer bez połączenia z Gmail;
- **nie wykonano wysyłki z konta właściciela ani migracji na produkcji**.

Źródła:
- https://support.google.com/accounts/answer/185833?hl=pl
- https://developers.google.com/workspace/gmail/imap/imap-smtp
- https://support.google.com/mail/answer/22839?hl=pl
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/schedule-functions
