# Wiadomości konta PeakGuide

Przygotowane treści, wybór języka i kolejka wysyłki przez Gmail; wdrożenie oraz
test rzeczywistej dostawy pozostają do wykonania.
Zmiana plików w repozytorium **nie zmienia ustawień produkcyjnego Supabase**.

## Język i adres odpowiedzi

Formularz rejestracji zapisuje wybrany język strony w `signUp.options.data.locale`:
`pl`, `en`, `uk`, `zh`. Kod interfejsu `ua` jest zamieniany na `uk`. Chiński używa
pisma uproszczonego. Nie zgadujemy języka z nazwiska, adresu e-mail czy narodowości.
Brak lub nieobsługiwany kod oznacza polski, zgodnie z domyślnym językiem strony.
Dotychczasowe konta bez preferencji otrzymają polski. Zmiana języka strony po
rejestracji nie zmienia obecnie zapisanej preferencji wiadomości.

`renderEmail('welcome', user.user_metadata?.locale)` zwraca `subject`, `html`,
`text`, `replyTo` i `locale`. Powitanie podpisuje „Przemysław — twórca PeakGuide”
(z tłumaczeniem roli). Adres odpowiedzi wskazany przez właściciela to
`przemyslaw.pietkun@gmail.com`. Adapter wysyłki musi przekazać `replyTo` jako
nagłówek **Reply-To** zgodnie z API dostawcy. Sam HTML ani plik JSON go nie ustawia.
Adres **From** musi być zweryfikowany u dostawcy; adres Gmail do odpowiedzi
nie oznacza używania Gmail jako nadawcy. Pliki nie zawierają sekretów.

## Edycja i pliki

- `messages.mjs`: źródło tłumaczeń i adresu odpowiedzi.
- `render.mjs`: renderer bez połączeń sieciowych i bez wysyłki.
- `pl/`, `en/`, `uk/`, `zh/`: osobne wersje HTML i tekstowe trzech wiadomości.
- `welcome.html`: polski podgląd powitania.
- `recovery.html`, `password_changed.html`: wielojęzyczne szablony Go dla Supabase.
- `*.subject.txt`: odpowiadające im wielojęzyczne tematy.
- Limit tematu w Supabase to 255 znaków całego szablonu, razem z warunkami Go.
  Generator i testy sprawdzają ten limit przed wdrożeniem; nie dodawaj do pola
  Subject komentarzy, nazwy pliku ani znaczników bloku kodu.
- `subjects.json`: tematy w czterech językach.
- `welcome-delivery.json`: niesekretne ustawienia przyszłej wysyłki powitania.

Po zmianie tekstów uruchom z katalogu repozytorium:

```sh
node supabase/templates/account-emails/generate.mjs
node --test --test-isolation=none supabase/tests/account_emails.test.mjs
GOCACHE=/tmp/peakguide-email-go-cache go run supabase/tests/account_email_templates.go
```

## Wdrożenie resetu i powiadomienia o zmianie hasła

Po wdrożeniu formularza zapisującego `locale`, w Supabase → Authentication →
Email Templates (w niektórych wersjach panelu: Emails):

1. Zachowaj dotychczasowe tematy i treści, aby można było przywrócić konfigurację.
2. W **Reset password** wklej `recovery.html` jako treść i zawartość
   `recovery.subject.txt` jako temat.
3. W **Password changed** wklej `password_changed.html` i zawartość
   `password_changed.subject.txt`. Włącz to powiadomienie bezpieczeństwa.
4. Przetestuj cztery kontrolowane konta z odpowiednim `locale`, a także konto
   bez tej preferencji. Sprawdź temat i działanie jednorazowego linku.
   Test lokalnego silnika Go nie zastępuje testu faktycznej wersji usługi Supabase.

Reset zachowuje `{{ .ConfirmationURL }}`. Powiadomienie o zmianie hasła nie zawiera
tokena resetowania ani obietnicy zakończenia wszystkich sesji. Wysyła je Supabase
po zmianie hasła; frontend nie uruchamia drugiej wysyłki tego powiadomienia.

## Powitanie przez Gmail

Właściciel wybrał Gmail. [SMTP.md](SMTP.md) zawiera dokładne ustawienia poczty Auth,
sekrety, migrację kolejki i wdrożenie funkcji `welcome-email` z harmonogramem.
Samo włączenie Custom SMTP nie uruchamia powitania.

Migracja `202611100013_welcome_email_queue.sql` dodaje zadania tylko dla nowych
kont. Worker sprawdza potwierdzenie adresu i pobiera odbiorcę z Auth; nie przyjmuje
adresu ani treści od przeglądarki. Prywatna kolejka chroni przed równoległą obsługą
tego samego zadania. Ponowienia są ograniczone, a niejednoznaczny wynik SMTP
wymaga sprawdzenia zamiast automatycznej ponownej wysyłki.

`GMAIL_APP_PASSWORD` jest sekretem serwerowym. Adres nadawcy to Gmail właściciela;
odpowiedzi na powitanie kieruje prawdziwy nagłówek Reply-To. Nie zmieniamy obowiązku
potwierdzania kont ani nie wysyłamy powitań do historycznych użytkowników.

Kod jest przygotowany i przetestowany lokalnie. **Nie wdrożono migracji, funkcji,
harmonogramu ani sekretów na produkcji. Nie wysłano rzeczywistych maili.**

Źródła:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/kb/troubleshooting/customizing-emails-by-language-KZ_38Q
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
