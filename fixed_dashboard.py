"""
Dashboard Router V2 - FIXED
Erweiterte Statistiken und Übersichten mit Fokus auf Actionable Items
Mit Fehlerbehandlung für fehlende Vermietungs-Tabelle
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta, date
from typing import Dict, Any, List
from ..database import get_db
from ..models.artikel import Artikel, ArtikelTyp
from ..models.reparatur import Reparatur, ReparaturPosition
from ..models.bestellung import Bestellung, BestellPosition
from ..models.leihrad import Leihrad, LeihradStatus

# Versuche Vermietung zu importieren, wenn nicht verfügbar, setze Flag
try:
    from ..models.vermietung import Vermietung, VermietungStatus
    VERMIETUNG_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Vermietung Model nicht verfügbar: {e}")
    VERMIETUNG_AVAILABLE = False
    Vermietung = None
    VermietungStatus = None

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Haupt-Statistiken für das Dashboard
    """
    try:
        now = datetime.now()
        heute = now.replace(hour=0, minute=0, second=0, microsecond=0)
        diese_woche = heute - timedelta(days=heute.weekday())
        dieser_monat = heute.replace(day=1)
        
        # === UMSATZ ===
        umsatz_heute = db.query(func.sum(Reparatur.endbetrag)).filter(
            and_(
                Reparatur.bezahlt == True,
                Reparatur.bezahlt_am >= heute
            )
        ).scalar() or 0
        
        umsatz_woche = db.query(func.sum(Reparatur.endbetrag)).filter(
            and_(
                Reparatur.bezahlt == True,
                Reparatur.bezahlt_am >= diese_woche
            )
        ).scalar() or 0
        
        umsatz_monat = db.query(func.sum(Reparatur.endbetrag)).filter(
            and_(
                Reparatur.bezahlt == True,
                Reparatur.bezahlt_am >= dieser_monat
            )
        ).scalar() or 0
        
        # === REPARATUREN - ERWEITERT ===
        # Nicht begonnen (WICHTIGSTE Metrik!)
        reparaturen_nicht_begonnen = db.query(Reparatur).filter(
            and_(
                Reparatur.status == 'angenommen',
                Reparatur.begonnen_am == None
            )
        ).count()
        
        # Offene Reparaturen (in Arbeit)
        reparaturen_offen = db.query(Reparatur).filter(
            Reparatur.status.in_(['angenommen', 'in_arbeit', 'wartet_auf_teile'])
        ).count()
        
        # Fertig zur Abholung
        reparaturen_fertig = db.query(Reparatur).filter(
            Reparatur.status == 'fertig'
        ).count()
        
        # Heute fertig geworden
        reparaturen_fertig_heute = db.query(Reparatur).filter(
            and_(
                Reparatur.status == 'fertig',
                Reparatur.fertig_am >= heute
            )
        ).count()
        
        # Überfällig
        reparaturen_ueberfaellig = db.query(Reparatur).filter(
            and_(
                Reparatur.status.in_(['angenommen', 'in_arbeit', 'wartet_auf_teile']),
                Reparatur.fertig_bis < now
            )
        ).count()
        
        # Heute fällig
        morgen = heute + timedelta(days=1)
        reparaturen_heute_faellig = db.query(Reparatur).filter(
            and_(
                Reparatur.status.in_(['angenommen', 'in_arbeit', 'wartet_auf_teile']),
                Reparatur.fertig_bis >= heute,
                Reparatur.fertig_bis < morgen
            )
        ).count()
        
        # === LEIHRÄDER - ERWEITERT ===
        # Verfügbare Leihräder
        leihraeder_verfuegbar = db.query(Leihrad).filter(
            Leihrad.status == LeihradStatus.verfuegbar
        ).count()
        
        # Verliehen / Aktiv unterwegs
        leihraeder_verliehen = db.query(Leihrad).filter(
            Leihrad.status == LeihradStatus.verliehen
        ).count()
        
        # Wartung / Defekt
        leihraeder_wartung = db.query(Leihrad).filter(
            Leihrad.status == LeihradStatus.wartung
        ).count()
        
        leihraeder_defekt = db.query(Leihrad).filter(
            Leihrad.status == LeihradStatus.defekt
        ).count()
        
        # Gesamt
        leihraeder_gesamt = db.query(Leihrad).count()
        
        # Vermietung Stats (nur wenn verfügbar)
        reservierungen_offen = 0
        vermietungen_heute_zurueck = 0
        vermietungen_ueberfaellig = 0
        
        if VERMIETUNG_AVAILABLE and Vermietung is not None:
            try:
                # Reservierungen (noch nicht abgeholt)
                reservierungen_offen = db.query(Vermietung).filter(
                    and_(
                        Vermietung.status == VermietungStatus.aktiv,
                        Vermietung.rad_abgeholt == False
                    )
                ).count()
                
                # Heute zurück erwartet
                vermietungen_heute_zurueck = db.query(Vermietung).filter(
                    and_(
                        Vermietung.status == VermietungStatus.aktiv,
                        Vermietung.bis_datum == date.today()
                    )
                ).count()
                
                # Überfällige Vermietungen
                vermietungen_ueberfaellig = db.query(Vermietung).filter(
                    and_(
                        Vermietung.status == VermietungStatus.aktiv,
                        Vermietung.bis_datum < date.today()
                    )
                ).count()
            except Exception as ve:
                print(f"⚠️  Fehler beim Abrufen von Vermietungs-Daten: {ve}")
        
        # === ARTIKEL/LAGER - NUR MATERIAL ===
        # Kritisch: Ausverkauft (nur Material!)
        artikel_ausverkauft = db.query(Artikel).filter(
            and_(
                Artikel.aktiv == True,
                Artikel.typ == ArtikelTyp.material,
                (Artikel.bestand_lager + Artikel.bestand_werkstatt) == 0
            )
        ).count()
        
        # Niedrig: Unter Mindestbestand (nur Material!)
        artikel_niedrig = db.query(Artikel).filter(
            and_(
                Artikel.aktiv == True,
                Artikel.typ == ArtikelTyp.material,
                (Artikel.bestand_lager + Artikel.bestand_werkstatt) > 0,
                (Artikel.bestand_lager + Artikel.bestand_werkstatt) <= Artikel.mindestbestand
            )
        ).count()
        
        # Bald nachbestellen (80% Mindestbestand)
        artikel_bald_leer = db.query(Artikel).filter(
            and_(
                Artikel.aktiv == True,
                Artikel.typ == ArtikelTyp.material,
                (Artikel.bestand_lager + Artikel.bestand_werkstatt) > Artikel.mindestbestand,
                (Artikel.bestand_lager + Artikel.bestand_werkstatt) <= (Artikel.mindestbestand * 1.2)
            )
        ).count()
        
        # === BESTELLUNGEN ===
        bestellungen_offen = db.query(Bestellung).filter(
            Bestellung.status.in_(['entwurf', 'bestellt', 'teilgeliefert'])
        ).count()
        
        bestellungen_unterwegs = db.query(Bestellung).filter(
            Bestellung.status == 'bestellt'
        ).count()
        
        return {
            "umsatz": {
                "heute": float(umsatz_heute),
                "woche": float(umsatz_woche),
                "monat": float(umsatz_monat)
            },
            "reparaturen": {
                "nicht_begonnen": reparaturen_nicht_begonnen,
                "offen": reparaturen_offen,
                "fertig": reparaturen_fertig,
                "fertig_heute": reparaturen_fertig_heute,
                "ueberfaellig": reparaturen_ueberfaellig,
                "heute_faellig": reparaturen_heute_faellig
            },
            "leihraeder": {
                "verfuegbar": leihraeder_verfuegbar,
                "verliehen": leihraeder_verliehen,
                "wartung": leihraeder_wartung,
                "defekt": leihraeder_defekt,
                "gesamt": leihraeder_gesamt,
                "reservierungen_offen": reservierungen_offen,
                "heute_zurueck": vermietungen_heute_zurueck,
                "vermietungen_ueberfaellig": vermietungen_ueberfaellig
            },
            "lager": {
                "artikel_ausverkauft": artikel_ausverkauft,
                "artikel_niedrig": artikel_niedrig,
                "artikel_bald_leer": artikel_bald_leer
            },
            "bestellungen": {
                "offen": bestellungen_offen,
                "unterwegs": bestellungen_unterwegs
            }
        }
    except Exception as e:
        print(f"❌ Fehler in get_dashboard_stats: {e}")
        import traceback
        traceback.print_exc()
        # Rückgabe von leeren Werten statt einem Fehler
        return {
            "umsatz": {"heute": 0, "woche": 0, "monat": 0},
            "reparaturen": {
                "nicht_begonnen": 0, "offen": 0, "fertig": 0,
                "fertig_heute": 0, "ueberfaellig": 0, "heute_faellig": 0
            },
            "leihraeder": {
                "verfuegbar": 0, "verliehen": 0, "wartung": 0, "defekt": 0,
                "gesamt": 0, "reservierungen_offen": 0, "heute_zurueck": 0,
                "vermietungen_ueberfaellig": 0
            },
            "lager": {
                "artikel_ausverkauft": 0, "artikel_niedrig": 0, "artikel_bald_leer": 0
            },
            "bestellungen": {"offen": 0, "unterwegs": 0}
        }


@router.get("/top-artikel")
def get_top_artikel(limit: int = 5, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Top verkaufte Artikel (aus Reparatur-Positionen) - nur Material
    """
    try:
        top = db.query(
            Artikel.id,
            Artikel.artikelnummer,
            Artikel.bezeichnung,
            Artikel.typ,
            func.sum(ReparaturPosition.menge).label('menge_gesamt')
        ).join(
            ReparaturPosition, Artikel.id == ReparaturPosition.artikel_id
        ).filter(
            Artikel.typ == ArtikelTyp.material  # Nur Material zählen
        ).group_by(
            Artikel.id
        ).order_by(
            func.sum(ReparaturPosition.menge).desc()
        ).limit(limit).all()
        
        return [
            {
                "id": artikel.id,
                "artikelnummer": artikel.artikelnummer,
                "bezeichnung": artikel.bezeichnung,
                "typ": artikel.typ,
                "menge_verkauft": int(artikel.menge_gesamt)
            }
            for artikel in top
        ]
    except Exception as e:
        print(f"❌ Fehler in get_top_artikel: {e}")
        return []


@router.get("/low-stock")
def get_low_stock_items(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Artikel mit niedrigem Bestand - NUR MATERIAL!
    """
    try:
        artikel = db.query(Artikel).filter(
            and_(
                Artikel.aktiv == True,
                Artikel.typ == ArtikelTyp.material,  # Nur Material!
                (Artikel.bestand_lager + Artikel.bestand_werkstatt) <= Artikel.mindestbestand
            )
        ).order_by(
            (Artikel.bestand_lager + Artikel.bestand_werkstatt).asc()
        ).limit(10).all()
        
        return [
            {
                "id": a.id,
                "artikelnummer": a.artikelnummer,
                "bezeichnung": a.bezeichnung,
                "typ": a.typ,
                "bestand_aktuell": a.bestand_lager + a.bestand_werkstatt,
                "mindestbestand": a.mindestbestand,
                "ist_ausverkauft": (a.bestand_lager + a.bestand_werkstatt) == 0
            }
            for a in artikel
        ]
    except Exception as e:
        print(f"❌ Fehler in get_low_stock_items: {e}")
        return []


@router.get("/offene-aufgaben")
def get_offene_aufgaben(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Offene Aufgaben/Warnungen - ERWEITERT
    """
    try:
        now = datetime.now()
        heute_date = date.today()
        
        # === NICHT BEGONNEN (HÖCHSTE PRIORITÄT!) ===
        reparaturen_nicht_begonnen = db.query(Reparatur).filter(
            and_(
                Reparatur.status == 'angenommen',
                Reparatur.begonnen_am == None
            )
        ).order_by(Reparatur.reparaturdatum.asc()).limit(10).all()
        
        # === ÜBERFÄLLIGE REPARATUREN ===
        reparaturen_ueberfaellig = db.query(Reparatur).filter(
            and_(
                Reparatur.status.in_(['angenommen', 'in_arbeit', 'wartet_auf_teile']),
                Reparatur.fertig_bis < now
            )
        ).order_by(Reparatur.fertig_bis.asc()).limit(10).all()
        
        # === HEUTE FÄLLIGE REPARATUREN ===
        morgen = datetime.combine(heute_date + timedelta(days=1), datetime.min.time())
        reparaturen_heute_faellig = db.query(Reparatur).filter(
            and_(
                Reparatur.status.in_(['angenommen', 'in_arbeit', 'wartet_auf_teile']),
                Reparatur.fertig_bis >= now,
                Reparatur.fertig_bis < morgen
            )
        ).order_by(Reparatur.fertig_bis.asc()).all()
        
        # === FERTIGE REPARATUREN (warten auf Abholung) ===
        reparaturen_fertig = db.query(Reparatur).filter(
            Reparatur.status == 'fertig'
        ).order_by(Reparatur.fertig_am.desc()).limit(10).all()
        
        result = {
            "reparaturen_nicht_begonnen": [
                {
                    "id": r.id,
                    "auftragsnummer": r.auftragsnummer,
                    "fahrradmarke": r.fahrradmarke,
                    "fahrradmodell": r.fahrradmodell,
                    "reparaturdatum": r.reparaturdatum.isoformat() if r.reparaturdatum else None,
                    "tage_seit_annahme": (now - r.reparaturdatum).days if r.reparaturdatum else 0,
                    "kunde_name": r.kunde_name,
                    "kunde_telefon": r.kunde_telefon,
                    "prioritaet": r.prioritaet
                }
                for r in reparaturen_nicht_begonnen
            ],
            "reparaturen_ueberfaellig": [
                {
                    "id": r.id,
                    "auftragsnummer": r.auftragsnummer,
                    "fahrradmarke": r.fahrradmarke,
                    "fertig_bis": r.fertig_bis.isoformat() if r.fertig_bis else None,
                    "tage_ueberfaellig": (now - r.fertig_bis).days if r.fertig_bis else 0,
                    "status": r.status,
                    "kunde_name": r.kunde_name,
                    "kunde_telefon": r.kunde_telefon
                }
                for r in reparaturen_ueberfaellig
            ],
            "reparaturen_heute_faellig": [
                {
                    "id": r.id,
                    "auftragsnummer": r.auftragsnummer,
                    "fahrradmarke": r.fahrradmarke,
                    "fertig_bis": r.fertig_bis.isoformat() if r.fertig_bis else None,
                    "status": r.status,
                    "kunde_name": r.kunde_name
                }
                for r in reparaturen_heute_faellig
            ],
            "reparaturen_fertig": [
                {
                    "id": r.id,
                    "auftragsnummer": r.auftragsnummer,
                    "fahrradmarke": r.fahrradmarke,
                    "fertig_am": r.fertig_am.isoformat() if r.fertig_am else None,
                    "tage_seit_fertig": (now - r.fertig_am).days if r.fertig_am else 0,
                    "kunde_name": r.kunde_name,
                    "kunde_telefon": r.kunde_telefon
                }
                for r in reparaturen_fertig
            ],
            "vermietungen_heute_zurueck": [],
            "vermietungen_ueberfaellig": [],
            "reservierungen": []
        }
        
        # Vermietung Details (nur wenn verfügbar)
        if VERMIETUNG_AVAILABLE and Vermietung is not None:
            try:
                # === LEIHRÄDER: HEUTE ZURÜCK ERWARTET ===
                vermietungen_heute_zurueck = db.query(Vermietung).filter(
                    and_(
                        Vermietung.status == VermietungStatus.aktiv,
                        Vermietung.bis_datum == heute_date
                    )
                ).order_by(Vermietung.bis_datum.asc()).all()
                
                # === LEIHRÄDER: ÜBERFÄLLIG ===
                vermietungen_ueberfaellig = db.query(Vermietung).filter(
                    and_(
                        Vermietung.status == VermietungStatus.aktiv,
                        Vermietung.bis_datum < heute_date
                    )
                ).order_by(Vermietung.bis_datum.asc()).limit(10).all()
                
                # === LEIHRÄDER: RESERVIERUNGEN (noch nicht abgeholt) ===
                reservierungen = db.query(Vermietung).filter(
                    and_(
                        Vermietung.status == VermietungStatus.aktiv,
                        Vermietung.rad_abgeholt == False
                    )
                ).order_by(Vermietung.von_datum.asc()).limit(10).all()
                
                result["vermietungen_heute_zurueck"] = [
                    {
                        "id": v.id,
                        "leihrad_id": v.leihrad_id,
                        "inventarnummer": v.leihrad.inventarnummer if v.leihrad else None,
                        "kunde_name": v.kunde_name,
                        "kunde_telefon": v.kunde_telefon,
                        "bis_datum": v.bis_datum.isoformat() if v.bis_datum else None
                    }
                    for v in vermietungen_heute_zurueck
                ]
                
                result["vermietungen_ueberfaellig"] = [
                    {
                        "id": v.id,
                        "leihrad_id": v.leihrad_id,
                        "inventarnummer": v.leihrad.inventarnummer if v.leihrad else None,
                        "kunde_name": v.kunde_name,
                        "kunde_telefon": v.kunde_telefon,
                        "bis_datum": v.bis_datum.isoformat() if v.bis_datum else None,
                        "tage_ueberfaellig": (heute_date - v.bis_datum).days if v.bis_datum else 0
                    }
                    for v in vermietungen_ueberfaellig
                ]
                
                result["reservierungen"] = [
                    {
                        "id": v.id,
                        "leihrad_id": v.leihrad_id,
                        "inventarnummer": v.leihrad.inventarnummer if v.leihrad else None,
                        "kunde_name": v.kunde_name,
                        "kunde_telefon": v.kunde_telefon,
                        "von_datum": v.von_datum.isoformat() if v.von_datum else None,
                        "bis_datum": v.bis_datum.isoformat() if v.bis_datum else None,
                        "abholung_heute": v.von_datum == heute_date if v.von_datum else False
                    }
                    for v in reservierungen
                ]
            except Exception as ve:
                print(f"⚠️  Fehler beim Abrufen von Vermietungs-Details: {ve}")
        
        return result
    except Exception as e:
        print(f"❌ Fehler in get_offene_aufgaben: {e}")
        import traceback
        traceback.print_exc()
        return {
            "reparaturen_nicht_begonnen": [],
            "reparaturen_ueberfaellig": [],
            "reparaturen_heute_faellig": [],
            "reparaturen_fertig": [],
            "vermietungen_heute_zurueck": [],
            "vermietungen_ueberfaellig": [],
            "reservierungen": []
        }


@router.get("/umsatz-verlauf")
def get_umsatz_verlauf(tage: int = 7, db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Umsatz-Verlauf der letzten X Tage
    """
    try:
        heute = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        verlauf = []
        for i in range(tage - 1, -1, -1):
            tag = heute - timedelta(days=i)
            tag_ende = tag + timedelta(days=1)
            
            umsatz = db.query(func.sum(Reparatur.endbetrag)).filter(
                and_(
                    Reparatur.bezahlt == True,
                    Reparatur.bezahlt_am >= tag,
                    Reparatur.bezahlt_am < tag_ende
                )
            ).scalar() or 0
            
            verlauf.append({
                "datum": tag.strftime("%Y-%m-%d"),
                "tag_name": tag.strftime("%a"),
                "umsatz": float(umsatz)
            })
        
        return verlauf
    except Exception as e:
        print(f"❌ Fehler in get_umsatz_verlauf: {e}")
        return []
