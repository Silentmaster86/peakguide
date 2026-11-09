# Gotowe commity — kolejność przeglądu

Commity już istnieją na gałęzi `fix/audit-completion`. Nie trzeba ich odtwarzać
ani ponownie kopiować plików. Najbezpieczniej przejrzeć i przyjąć cały PR po
próbie migracji i kont na stagingu; nie wdrażać wybiórczo frontendu wymagającego
nowego RPC.

1. **[`b8be04f`](https://github.com/Silentmaster86/peakguide/commit/b8be04f) — `fix(auth): handle confirmation, session changes and password recovery`**
   src/api/auth.js, src/auth/, formularze logowania/rejestracji/resetu, przekierowania i testy kont.

2. **[`eadb2fd`](https://github.com/Silentmaster86/peakguide/commit/eadb2fd) — `fix(catalogue): make filters, translations and trail navigation consistent`**
   src/api/peakguide.js, listy i szczegóły, toolbar, karty, tłumaczenia, formatowanie oraz statystyki.

3. **[`fc529de`](https://github.com/Silentmaster86/peakguide/commit/fc529de) — `fix(admin): save peaks atomically and handle form failures`**
   src/features/adminPeaks/, adminUsers/, adminMessages/, wiadomości, PanelPage, migracja 011 i test PostgreSQL.

4. **[`14ae429`](https://github.com/Silentmaster86/peakguide/commit/14ae429) — `fix(trails): stream practical information and retry failed sources`**
   src/components/TrailPracticalCard.jsx i testy częściowej awarii / ponowienia.

5. **[`28d53e1`](https://github.com/Silentmaster86/peakguide/commit/28d53e1) — `fix(data): require reviewed identities before generating coordinate SQL`**
   scripts/generate_verified_coords.py, testy Python i archiwum niezweryfikowanych skryptów/SQL.

6. **[`4e7f1c7`](https://github.com/Silentmaster86/peakguide/commit/4e7f1c7) — `fix(a11y): provide keyboard menus and stable accessible names`**
   Menu języka, motywu i nawigacji, fokus, formularze i tytuły stron konta.

7. **[`7aac6a5`](https://github.com/Silentmaster86/peakguide/commit/7aac6a5) — `test(ci): gate changes with unit, browser and PostgreSQL checks`**
   .github/workflows/quality.yml, zależności testowe, konfiguracja Playwright/Vitest/ESLint i testy E2E.

8. **[`a6b3d73`](https://github.com/Silentmaster86/peakguide/commit/a6b3d73) — `perf(web): deliver responsive WebP images and load routes on demand`**
   Obrazy WebP, assets/source/, manifest i generator grafik, CSS, lazy routes, strona główna i metadata.

9. **[`964c9d6`](https://github.com/Silentmaster86/peakguide/commit/964c9d6) — `fix(seo): generate sitemap from the active public catalogue`**
   public/sitemap.xml i scripts/generate-sitemap.mjs — 128 adresów z publicznego katalogu.

10. **[`5a378a8`](https://github.com/Silentmaster86/peakguide/commit/5a378a8) — `fix(home): close the catalogue error state expression`**
   Poprawka składni końcowego komunikatu błędu katalogu; należy uwzględnić razem z pakietem.

Po nich znajduje się commit dokumentacji `docs(audit): record verification, remaining work and rollout steps` z raportem, dowodami odczytu i instrukcją wdrożenia.

12. **`docs(staging): document setup from a production-only Supabase project`**
    Instrukcja `docs/audit/2026-11-08/staging.md`, publiczny wzór
    `peakguide_front/.env.example`, ignorowanie prywatnych eksportów i odnośniki
    w README oraz instrukcji wdrożenia. Ten commit przygotowuje konfigurację;
    nie tworzy projektu Supabase ani nie uruchamia migracji.

## Otworzenie gałęzi lokalnie

Po potwierdzeniu pustej listy Edge Functions:

- `feat(admin): add authenticated account deletion edge function` — kod Deno,
  weryfikacja tożsamości i aktualnej roli, testy oraz obsługa błędów frontendu.
- `docs(audit): document missing edge function and deployment steps` — korekta
  wcześniejszego założenia o wdrożeniu, wyniki i instrukcja publikacji funkcji.

Po otrzymaniu pełniejszego przeglądu uprawnień:

- `fix(db): serialize profile writes to preserve the last administrator` — migracja
  012, 18 testów współbieżności i rozszerzony test katalogu z rzeczywistym RLS.
- `docs(audit): record verified access and administrator protection fix` — wyniki,
  zakres testów, ograniczenia i aktualna instrukcja wdrożenia.

Kolejne commity po otrzymaniu metadanych od właściciela (9 listopada):

- `fix(admin): align elevation validation with production schema` — walidacja
  dodatniej całkowitej wysokości, testy i fixture geography z rzeczywistym triggerem.
- `test(audit): reproduce administrator race from supplied database definitions`
  — lokalna reprodukcja problemu, wyniki testów, raport i odczytowy przegląd uprawnień.
  Reprodukcja dokumentuje nadal otwarty problem; nie jest migracją jego naprawy.

```sh
git fetch origin
git switch fix/audit-completion
```

W katalogu `peakguide_front`: `npm ci`, `npm run check`, `npm run test:e2e`.
Instrukcja bazy i publikacji: [wdrozenie.md](wdrozenie.md).
Po akceptacji stagingu wykonaj normalny merge PR. Nie stosuj historycznych
`coords_update.sql.txt` ani `nearby_coords_update.sql.txt` na bazie.
