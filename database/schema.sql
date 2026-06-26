-- =============================================================
-- WARGA RT 02 / RW 02 — Database Schema
-- PostgreSQL (kompatibel dengan Supabase)
-- =============================================================

-- -------------------------------------------------------------
-- ENUM TYPES
-- -------------------------------------------------------------

CREATE TYPE status_hunian AS ENUM (
  'tempat_tinggal',
  'kontrak',
  'kost',
  'kosong'
);

-- -------------------------------------------------------------
-- TABLE: penghuni
-- Data penghuni / pemilik yang terdaftar di RT 02
-- -------------------------------------------------------------
CREATE TABLE penghuni (
  id             SERIAL PRIMARY KEY,
  alamat         TEXT         NOT NULL,
  rt             VARCHAR(5)   NOT NULL DEFAULT '02',
  rw             VARCHAR(5)   NOT NULL DEFAULT '02',
  nama_pemilik   VARCHAR(150) NOT NULL,
  kontak         VARCHAR(20),
  status_hunian  status_hunian NOT NULL DEFAULT 'tempat_tinggal',
  aktif          BOOLEAN       NOT NULL DEFAULT TRUE,
  catatan        TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- -------------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------------

CREATE INDEX idx_penghuni_alamat  ON penghuni USING gin(to_tsvector('indonesian', alamat));
CREATE INDEX idx_penghuni_nama    ON penghuni USING gin(to_tsvector('indonesian', nama_pemilik));
CREATE INDEX idx_penghuni_status  ON penghuni (status_hunian);
CREATE INDEX idx_penghuni_aktif   ON penghuni (aktif);


-- -------------------------------------------------------------
-- TRIGGER: auto-update kolom updated_at
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_penghuni_updated_at
  BEFORE UPDATE ON penghuni
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -------------------------------------------------------------
-- VIEWS
-- -------------------------------------------------------------

CREATE VIEW v_statistik_hunian AS
SELECT
  COUNT(*)                                                      AS total,
  COUNT(*) FILTER (WHERE status_hunian = 'tempat_tinggal')     AS tempat_tinggal,
  COUNT(*) FILTER (WHERE status_hunian = 'kontrak')            AS kontrak,
  COUNT(*) FILTER (WHERE status_hunian = 'kost')               AS kost,
  COUNT(*) FILTER (WHERE status_hunian = 'kosong')             AS kosong
FROM penghuni
WHERE aktif = TRUE;
