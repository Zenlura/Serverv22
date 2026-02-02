-- Migration: Vermietungen-Tabelle erstellen
-- Datum: 2026-02-02
-- Beschreibung: Erstellt die Tabelle für Leihrad-Vermietungen

-- Vermietung Status Enum
DO $$ BEGIN
    CREATE TYPE vermietung_status AS ENUM ('reserviert', 'aktiv', 'abgeschlossen', 'storniert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Vermietungen Tabelle
CREATE TABLE IF NOT EXISTS vermietungen (
    id SERIAL PRIMARY KEY,
    leihrad_id INTEGER NOT NULL REFERENCES leihraeder(id) ON DELETE RESTRICT,
    
    -- Kunde
    kunde_name VARCHAR(200) NOT NULL,
    kunde_telefon VARCHAR(50),
    kunde_email VARCHAR(200),
    kunde_adresse TEXT,
    
    -- Ausweis (Pflicht für Kaution)
    ausweis_typ VARCHAR(50),
    ausweis_nummer VARCHAR(100),
    
    -- Zeitraum
    von_datum DATE NOT NULL,
    bis_datum DATE NOT NULL,
    rueckgabe_datum DATE,
    
    -- Reservierung
    rad_abgeholt BOOLEAN DEFAULT FALSE,
    abholzeit TIMESTAMP,
    
    -- Preise & Zahlung
    tagespreis NUMERIC(10, 2) NOT NULL,
    anzahl_tage INTEGER NOT NULL,
    gesamtpreis NUMERIC(10, 2) NOT NULL,
    bezahlt BOOLEAN DEFAULT FALSE,
    bezahlt_am TIMESTAMP,
    
    -- Status & Zustand
    status vermietung_status NOT NULL DEFAULT 'aktiv',
    zustand_bei_ausgabe TEXT,
    zustand_bei_rueckgabe TEXT,
    schaeden TEXT,
    
    -- Metadaten
    erstellt_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notizen TEXT
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_vermietungen_leihrad ON vermietungen(leihrad_id);
CREATE INDEX IF NOT EXISTS idx_vermietungen_status ON vermietungen(status);
CREATE INDEX IF NOT EXISTS idx_vermietungen_bis_datum ON vermietungen(bis_datum);
CREATE INDEX IF NOT EXISTS idx_vermietungen_von_datum ON vermietungen(von_datum);
CREATE INDEX IF NOT EXISTS idx_vermietungen_rad_abgeholt ON vermietungen(rad_abgeholt);

-- Kommentare
COMMENT ON TABLE vermietungen IS 'Leihrad-Vermietungen mit Reservierungen';
COMMENT ON COLUMN vermietungen.rad_abgeholt IS 'Wurde das Rad schon ausgegeben? (für Reservierungen)';
COMMENT ON COLUMN vermietungen.abholzeit IS 'Zeitpunkt der Rad-Ausgabe';
