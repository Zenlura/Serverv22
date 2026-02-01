"""
Pydantic Schemas für Bestellungen
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class BestellPositionBase(BaseModel):
    artikel_id: int
    menge: int = Field(gt=0)
    einzelpreis: Decimal
    notizen: Optional[str] = None


class BestellPositionCreate(BestellPositionBase):
    pass


class BestellPositionUpdate(BaseModel):
    menge: Optional[int] = Field(None, gt=0)
    einzelpreis: Optional[Decimal] = None
    menge_geliefert: Optional[int] = Field(None, ge=0)
    geliefert: Optional[bool] = None
    notizen: Optional[str] = None


class BestellPositionResponse(BestellPositionBase):
    id: int
    bestellung_id: int
    gesamtpreis: Decimal
    menge_geliefert: int
    geliefert: bool
    created_at: datetime
    updated_at: datetime
    
    # Artikel-Info eingebettet
    artikel: Optional[dict] = None

    class Config:
        from_attributes = True


class BestellungBase(BaseModel):
    lieferant_id: int
    notizen: Optional[str] = None
    interne_notizen: Optional[str] = None
    versandkosten: Optional[Decimal] = Field(default=Decimal("0.0"), ge=0)


class BestellungCreate(BestellungBase):
    positionen: List[BestellPositionCreate] = []


class BestellungUpdate(BaseModel):
    status: Optional[str] = None
    bestelldatum: Optional[datetime] = None
    lieferdatum_erwartet: Optional[datetime] = None
    lieferdatum_tatsaechlich: Optional[datetime] = None
    notizen: Optional[str] = None
    interne_notizen: Optional[str] = None
    versandkosten: Optional[Decimal] = Field(None, ge=0)


class BestellungResponse(BestellungBase):
    id: int
    bestellnummer: str
    status: str
    bestelldatum: Optional[datetime] = None
    lieferdatum_erwartet: Optional[datetime] = None
    lieferdatum_tatsaechlich: Optional[datetime] = None
    gesamtpreis: Decimal
    created_at: datetime
    updated_at: datetime
    
    # Lieferant-Info eingebettet
    lieferant: Optional[dict] = None
    
    # Positionen eingebettet
    positionen: List[BestellPositionResponse] = []

    class Config:
        from_attributes = True


class BestellungListItem(BaseModel):
    """Vereinfachte Version für Listen-Ansicht"""
    id: int
    bestellnummer: str
    status: str
    lieferant_name: str
    bestelldatum: Optional[datetime] = None
    lieferdatum_erwartet: Optional[datetime] = None
    gesamtpreis: Decimal
    anzahl_positionen: int
    created_at: datetime

    class Config:
        from_attributes = True
