# 📦 SESSION 1.1 - DB MODELS + MIGRATIONS

## ✅ WAS IST ENTHALTEN:

### **Database Setup:**
- `database.py` - SQLAlchemy Engine + Session Management

### **Models:**
- `kategorie.py` - Hierarchische Kategorien
- `lieferant.py` - Lieferanten (Hartje, BBF, Magura, Rose)
- `artikel.py` - Hauptmodel mit Artikelnummer (ART-00001...)
- `artikel_lieferant.py` - Many-to-Many Zuordnung
- `bestand_historie.py` - Tracking aller Bestandsänderungen
- `models_init.py` - Export aller Models (für `__init__.py`)

### **Alembic (Migrations):**
- `alembic.ini` - Alembic Konfiguration
- `env.py` - Alembic Environment (für `migrations/env.py`)
- `script.py.mako` - Template für Migrations (für `migrations/script.py.mako`)

---

## 📝 INSTALLATION - COPY & PASTE:

**PowerShell - Im Projekt-Ordner:**

```powershell
# 1. Dateien kopieren
# Database
copy session_1_1_models\database.py app\database.py

# Models
copy session_1_1_models\kategorie.py app\models\kategorie.py
copy session_1_1_models\lieferant.py app\models\lieferant.py
copy session_1_1_models\artikel.py app\models\artikel.py
copy session_1_1_models\artikel_lieferant.py app\models\artikel_lieferant.py
copy session_1_1_models\bestand_historie.py app\models\bestand_historie.py
copy session_1_1_models\models_init.py app\models\__init__.py

# Alembic
copy session_1_1_models\alembic.ini .
copy session_1_1_models\env.py migrations\env.py
copy session_1_1_models\script.py.mako migrations\script.py.mako

# 2. Erste Migration erstellen
alembic revision --autogenerate -m "Initial models: Artikel, Kategorien, Lieferanten"

# 3. Migration ausführen
alembic upgrade head

# 4. Check ob Tabellen erstellt wurden
docker exec -it radstation-db psql -U postgres -d radstation -c "\dt"
```

---

## 🗄️ DATENBANK-SCHEMA:

### **Tabellen:**

1. **kategorien**
   - Hierarchisch (parent_id Self-Reference)
   - Beispiel: Reifen > 28 Zoll > Mit Pannenschutz

2. **lieferanten**
   - Hauptlieferanten: Hartje, BBF, Magura, Rose Biketown
   - Kontakt, Adresse, Status

3. **artikel**
   - Artikelnummer: ART-00001, ART-00002, ...
   - Bestand getrennt: `bestand_lager` + `bestand_werkstatt`
   - Preise: EK/VK
   - Kategorie-Zuordnung

4. **artikel_lieferanten** (Many-to-Many)
   - Artikel <-> Lieferanten Zuordnung
   - Lieferanten-Artikelnummer
   - Lieferanten-spezifischer EK-Preis
   - Bevorzugter Lieferant Flag

5. **bestand_historie**
   - Tracking aller Bestandsänderungen
   - Art: ZUGANG, ABGANG, KORREKTUR, UMLAGERUNG, INVENTUR
   - Ort: LAGER, WERKSTATT
   - Grund, Referenz, Erfasst von

---

## ✅ ERWARTETE AUSGABE:

Nach `alembic upgrade head`:

```sql
radstation=# \dt
                 List of relations
 Schema |          Name           | Type  |  Owner
--------+-------------------------+-------+----------
 public | alembic_version         | table | postgres
 public | artikel                 | table | postgres
 public | artikel_lieferanten     | table | postgres
 public | bestand_historie        | table | postgres
 public | kategorien              | table | postgres
 public | lieferanten             | table | postgres
(6 rows)
```

---

## 🎯 NÄCHSTER SCHRITT: SESSION 1.2

Nach erfolgreicher Migration:

**Session 1.2 - Seed Data:**
- 10 Kategorien erstellen
- 4 Lieferanten (Hartje, BBF, Magura, Rose)

**Dann Session 1.3:**
- Artikel-CRUD API

---

## 🚨 TROUBLESHOOTING:

### Problem: "No module named 'app'"
```powershell
# Stelle sicher, dass du im Projekt-Root bist
cd C:\Users\Startklar\Documents\Server\Serverv2
```

### Problem: "Database connection failed"
```powershell
# Check PostgreSQL
docker ps | grep radstation-db
# Sollte "Up" zeigen

# Test-Connection
docker exec -it radstation-db psql -U postgres -d radstation -c "SELECT 1;"
```

### Problem: "Target database is not up to date"
```powershell
# Reset Migration
alembic downgrade base
alembic upgrade head
```

---

**BEREIT FÜR INSTALLATION? COPY-PASTE DIE BEFEHLE OBEN!** 🚀
