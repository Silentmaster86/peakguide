CREATE TABLE IF NOT EXISTS users (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- helper index
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 1) Add missing columns (if they do not exist)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- 2) Make sure display_name exists
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name text;

-- 3) If display_name was NULL in existing records, populate it
UPDATE users
SET display_name = COALESCE(display_name, split_part(email, '@', 1))
WHERE display_name IS NULL;

-- 4) Now you can enforce NOT NULL (if desired)
ALTER TABLE users
  ALTER COLUMN display_name SET NOT NULL;

-- 5) Index (if it does not exist yet)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

-- 6) Set up admin
--a) node -e "import('bcryptjs').then(async b=>{console.log(await b.hash('YourPassword@123!', 10));})"
--Copy this (will lookscurl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pietkun.dev@gmail.com",
    "password": "TwojeHaslo123!"
  }'
👉 Zwróć uwagę na odp like $2a$10$...).

INSERT INTO users (email, password_hash, display_name, is_admin, active)
VALUES (
  'yours@email.com',
  'copy_HASH_from_step_a',
  'name',
  true,
  true
);


--
