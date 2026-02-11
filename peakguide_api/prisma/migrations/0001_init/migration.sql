-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "languages" (
    "code" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "mountain_ranges" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mountain_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mountain_ranges_i18n" (
    "range_id" BIGINT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "mountain_ranges_i18n_pkey" PRIMARY KEY ("range_id","lang")
);

-- CreateTable
CREATE TABLE "peak_nearby" (
    "peak_id" BIGINT NOT NULL,
    "nearby_peak_id" BIGINT NOT NULL,
    "note" TEXT,

    CONSTRAINT "peak_nearby_pkey" PRIMARY KEY ("peak_id","nearby_peak_id")
);

-- CreateTable
CREATE TABLE "peaks" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "range_id" BIGINT NOT NULL,
    "subrange_id" BIGINT,
    "elevation_m" INTEGER NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "difficulty" TEXT,
    "best_season" TEXT,
    "cover_image_url" TEXT,
    "is_korona" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "geom" geography,

    CONSTRAINT "peaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peaks_i18n" (
    "peak_id" BIGINT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT,
    "description" TEXT,
    "tips" TEXT,

    CONSTRAINT "peaks_i18n_pkey" PRIMARY KEY ("peak_id","lang")
);

-- CreateTable
CREATE TABLE "poi_types" (
    "id" BIGSERIAL NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "poi_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poi_types_i18n" (
    "type_id" BIGINT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "poi_types_i18n_pkey" PRIMARY KEY ("type_id","lang")
);

-- CreateTable
CREATE TABLE "pois" (
    "id" BIGSERIAL NOT NULL,
    "peak_id" BIGINT,
    "trail_id" BIGINT,
    "type_id" BIGINT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "website_url" TEXT,
    "google_maps_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pois_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pois_i18n" (
    "poi_id" BIGINT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tips" TEXT,

    CONSTRAINT "pois_i18n_pkey" PRIMARY KEY ("poi_id","lang")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "id" BIGSERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subranges" (
    "id" BIGSERIAL NOT NULL,
    "range_id" BIGINT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subranges_i18n" (
    "subrange_id" BIGINT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "subranges_i18n_pkey" PRIMARY KEY ("subrange_id","lang")
);

-- CreateTable
CREATE TABLE "trails" (
    "id" BIGSERIAL NOT NULL,
    "peak_id" BIGINT NOT NULL,
    "slug" TEXT NOT NULL,
    "start_point_name" TEXT,
    "end_point_name" TEXT,
    "distance_km" DECIMAL(5,2),
    "elevation_gain_m" INTEGER,
    "time_min" INTEGER,
    "difficulty" TEXT,
    "route_type" TEXT,
    "gpx_url" TEXT,
    "map_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trails_i18n" (
    "trail_id" BIGINT NOT NULL,
    "lang" VARCHAR(8) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,

    CONSTRAINT "trails_i18n_pkey" PRIMARY KEY ("trail_id","lang")
);

-- CreateTable
CREATE TABLE "user_peak_status" (
    "user_id" BIGINT NOT NULL,
    "peak_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "date_done" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_peak_status_pkey" PRIMARY KEY ("user_id","peak_id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_name" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mountain_ranges_slug_key" ON "mountain_ranges"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "peaks_slug_key" ON "peaks"("slug");

-- CreateIndex
CREATE INDEX "idx_peaks_elevation" ON "peaks"("elevation_m");

-- CreateIndex
CREATE INDEX "idx_peaks_range_id" ON "peaks"("range_id");

-- CreateIndex
CREATE INDEX "idx_peaks_subrange_id" ON "peaks"("subrange_id");

-- CreateIndex
CREATE INDEX "peaks_geom_gix" ON "peaks" USING GIST ("geom");

-- CreateIndex
CREATE UNIQUE INDEX "poi_types_slug_key" ON "poi_types"("slug");

-- CreateIndex
CREATE INDEX "idx_pois_peak_id" ON "pois"("peak_id");

-- CreateIndex
CREATE INDEX "idx_pois_trail_id" ON "pois"("trail_id");

-- CreateIndex
CREATE INDEX "idx_pois_type_id" ON "pois"("type_id");

-- CreateIndex
CREATE UNIQUE INDEX "pois_i18n_poi_lang_uniq" ON "pois_i18n"("poi_id", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "schema_migrations_filename_key" ON "schema_migrations"("filename");

-- CreateIndex
CREATE INDEX "idx_subranges_range_id" ON "subranges"("range_id");

-- CreateIndex
CREATE UNIQUE INDEX "subranges_range_id_slug_key" ON "subranges"("range_id", "slug");

-- CreateIndex
CREATE INDEX "idx_trails_peak_id" ON "trails"("peak_id");

-- CreateIndex
CREATE UNIQUE INDEX "trails_peak_id_slug_key" ON "trails"("peak_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "trails_i18n_trail_lang_uniq" ON "trails_i18n"("trail_id", "lang");

-- CreateIndex
CREATE INDEX "idx_user_peak_status_status" ON "user_peak_status"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_is_admin" ON "users"("is_admin");

-- AddForeignKey
ALTER TABLE "mountain_ranges_i18n" ADD CONSTRAINT "mountain_ranges_i18n_lang_fkey" FOREIGN KEY ("lang") REFERENCES "languages"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mountain_ranges_i18n" ADD CONSTRAINT "mountain_ranges_i18n_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "mountain_ranges"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peak_nearby" ADD CONSTRAINT "peak_nearby_nearby_peak_id_fkey" FOREIGN KEY ("nearby_peak_id") REFERENCES "peaks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peak_nearby" ADD CONSTRAINT "peak_nearby_peak_id_fkey" FOREIGN KEY ("peak_id") REFERENCES "peaks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peaks" ADD CONSTRAINT "peaks_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "mountain_ranges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peaks" ADD CONSTRAINT "peaks_subrange_id_fkey" FOREIGN KEY ("subrange_id") REFERENCES "subranges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peaks_i18n" ADD CONSTRAINT "peaks_i18n_lang_fkey" FOREIGN KEY ("lang") REFERENCES "languages"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "peaks_i18n" ADD CONSTRAINT "peaks_i18n_peak_id_fkey" FOREIGN KEY ("peak_id") REFERENCES "peaks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "poi_types_i18n" ADD CONSTRAINT "poi_types_i18n_lang_fkey" FOREIGN KEY ("lang") REFERENCES "languages"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "poi_types_i18n" ADD CONSTRAINT "poi_types_i18n_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "poi_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_peak_id_fkey" FOREIGN KEY ("peak_id") REFERENCES "peaks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pois" ADD CONSTRAINT "pois_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "poi_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pois_i18n" ADD CONSTRAINT "pois_i18n_lang_fkey" FOREIGN KEY ("lang") REFERENCES "languages"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pois_i18n" ADD CONSTRAINT "pois_i18n_poi_id_fkey" FOREIGN KEY ("poi_id") REFERENCES "pois"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subranges" ADD CONSTRAINT "subranges_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "mountain_ranges"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subranges_i18n" ADD CONSTRAINT "subranges_i18n_lang_fkey" FOREIGN KEY ("lang") REFERENCES "languages"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subranges_i18n" ADD CONSTRAINT "subranges_i18n_subrange_id_fkey" FOREIGN KEY ("subrange_id") REFERENCES "subranges"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trails" ADD CONSTRAINT "trails_peak_id_fkey" FOREIGN KEY ("peak_id") REFERENCES "peaks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trails_i18n" ADD CONSTRAINT "trails_i18n_lang_fkey" FOREIGN KEY ("lang") REFERENCES "languages"("code") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trails_i18n" ADD CONSTRAINT "trails_i18n_trail_id_fkey" FOREIGN KEY ("trail_id") REFERENCES "trails"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_peak_status" ADD CONSTRAINT "user_peak_status_peak_id_fkey" FOREIGN KEY ("peak_id") REFERENCES "peaks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_peak_status" ADD CONSTRAINT "user_peak_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

