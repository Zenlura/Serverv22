"""
Bestellungen API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.database import get_db
from app.models.bestellung import Bestellung, BestellPosition, BestellStatus
from app.schemas.bestellung import (
    BestellungCreate,
    BestellungUpdate,
    BestellungResponse,
    BestellungListItem
)

router = APIRouter(prefix="/api/bestellungen", tags=["Bestellungen"])


def generate_bestellnummer(db: Session) -> str:
    """Generiert eine eindeutige Bestellnummer"""
    # Format: BEST-YYYYMMDD-XXX
    heute = datetime.now()
    prefix = f"BEST-{heute.strftime('%Y%m%d')}"
    
    # Zähle Bestellungen von heute
    count = db.query(Bestellung).filter(
        Bestellung.bestellnummer.like(f"{prefix}%")
    ).count()
    
    return f"{prefix}-{count + 1:03d}"


@router.post("", response_model=BestellungResponse, status_code=201)
def create_bestellung(
    bestellung: BestellungCreate,
    db: Session = Depends(get_db)
):
    """
    Neue Bestellung erstellen
    """
    # Bestellnummer generieren
    bestellnummer = generate_bestellnummer(db)
    
    # Bestellung erstellen
    db_bestellung = Bestellung(
        bestellnummer=bestellnummer,
        lieferant_id=bestellung.lieferant_id,
        notizen=bestellung.notizen,
        interne_notizen=bestellung.interne_notizen,
        versandkosten=bestellung.versandkosten or Decimal("0.0"),
        status=BestellStatus.ENTWURF
    )
    
    # Positionen hinzufügen
    gesamtpreis = Decimal("0.0")
    for pos in bestellung.positionen:
        pos_gesamtpreis = Decimal(str(pos.menge)) * pos.einzelpreis
        gesamtpreis += pos_gesamtpreis
        
        db_position = BestellPosition(
            artikel_id=pos.artikel_id,
            menge=pos.menge,
            einzelpreis=pos.einzelpreis,
            gesamtpreis=pos_gesamtpreis,
            notizen=pos.notizen
        )
        db_bestellung.positionen.append(db_position)
    
    # Gesamtpreis berechnen (inkl. Versandkosten)
    db_bestellung.gesamtpreis = gesamtpreis + (bestellung.versandkosten or Decimal("0.0"))
    
    db.add(db_bestellung)
    db.commit()
    db.refresh(db_bestellung)
    
    # Mit Lieferant und Positionen laden
    db_bestellung = db.query(Bestellung).options(
        joinedload(Bestellung.lieferant),
        joinedload(Bestellung.positionen).joinedload(BestellPosition.artikel)
    ).filter(Bestellung.id == db_bestellung.id).first()
    
    return db_bestellung


@router.get("", response_model=dict)
def get_bestellungen(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    lieferant_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Liste aller Bestellungen mit Pagination und Filterung
    """
    query = db.query(Bestellung).options(
        joinedload(Bestellung.lieferant),
        joinedload(Bestellung.positionen)
    )
    
    # Filter nach Status
    if status:
        query = query.filter(Bestellung.status == status)
    
    # Filter nach Lieferant
    if lieferant_id:
        query = query.filter(Bestellung.lieferant_id == lieferant_id)
    
    # Sortierung (neueste zuerst)
    query = query.order_by(Bestellung.created_at.desc())
    
    # Total count
    total = query.count()
    
    # Pagination
    bestellungen = query.offset(skip).limit(limit).all()
    
    return {
        "items": bestellungen,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/{bestellung_id}", response_model=BestellungResponse)
def get_bestellung(
    bestellung_id: int,
    db: Session = Depends(get_db)
):
    """
    Einzelne Bestellung abrufen
    """
    bestellung = db.query(Bestellung).options(
        joinedload(Bestellung.lieferant),
        joinedload(Bestellung.positionen).joinedload(BestellPosition.artikel)
    ).filter(Bestellung.id == bestellung_id).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    return bestellung


@router.put("/{bestellung_id}", response_model=BestellungResponse)
def update_bestellung(
    bestellung_id: int,
    update: BestellungUpdate,
    db: Session = Depends(get_db)
):
    """
    Bestellung aktualisieren
    """
    bestellung = db.query(Bestellung).filter(Bestellung.id == bestellung_id).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    # Update Felder
    if update.status:
        bestellung.status = BestellStatus(update.status)
    if update.bestelldatum is not None:
        bestellung.bestelldatum = update.bestelldatum
    if update.lieferdatum_erwartet is not None:
        bestellung.lieferdatum_erwartet = update.lieferdatum_erwartet
    if update.lieferdatum_tatsaechlich is not None:
        bestellung.lieferdatum_tatsaechlich = update.lieferdatum_tatsaechlich
    if update.notizen is not None:
        bestellung.notizen = update.notizen
    if update.interne_notizen is not None:
        bestellung.interne_notizen = update.interne_notizen
    if update.versandkosten is not None:
        bestellung.versandkosten = update.versandkosten
        # Gesamtpreis neu berechnen
        positionen_summe = sum(
            Decimal(str(pos.gesamtpreis)) for pos in bestellung.positionen
        )
        bestellung.gesamtpreis = positionen_summe + update.versandkosten
    
    db.commit()
    db.refresh(bestellung)
    
    # Mit Relationships laden
    bestellung = db.query(Bestellung).options(
        joinedload(Bestellung.lieferant),
        joinedload(Bestellung.positionen).joinedload(BestellPosition.artikel)
    ).filter(Bestellung.id == bestellung_id).first()
    
    return bestellung


@router.post("/{bestellung_id}/wareneingang", response_model=BestellungResponse)
def wareneingang_buchen(
    bestellung_id: int,
    db: Session = Depends(get_db)
):
    """
    Wareneingang für komplette Bestellung buchen
    - Setzt alle Positionen auf "geliefert"
    - Erhöht Bestände
    - Setzt Status auf "geliefert"
    """
    bestellung = db.query(Bestellung).options(
        joinedload(Bestellung.positionen).joinedload(BestellPosition.artikel)
    ).filter(Bestellung.id == bestellung_id).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    # Für jede Position: Bestand erhöhen
    for position in bestellung.positionen:
        if not position.geliefert:
            # Bestand erhöhen
            artikel = position.artikel
            artikel.bestand_lager += position.menge
            
            # Position als geliefert markieren
            position.menge_geliefert = position.menge
            position.geliefert = True
    
    # Bestellung-Status aktualisieren
    bestellung.status = BestellStatus.GELIEFERT
    bestellung.lieferdatum_tatsaechlich = datetime.now()
    
    db.commit()
    db.refresh(bestellung)
    
    return bestellung


@router.delete("/{bestellung_id}", status_code=204)
def delete_bestellung(
    bestellung_id: int,
    db: Session = Depends(get_db)
):
    """
    Bestellung löschen (nur Entwürfe!)
    """
    bestellung = db.query(Bestellung).filter(Bestellung.id == bestellung_id).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    if bestellung.status != BestellStatus.ENTWURF:
        raise HTTPException(
            status_code=400,
            detail="Nur Entwürfe können gelöscht werden"
        )
    
    db.delete(bestellung)
    db.commit()
    
    return None
