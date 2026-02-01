"""
Bestellung Models für Warenwirtschaft
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Numeric, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class BestellStatus(str, enum.Enum):
    ENTWURF = "entwurf"           # Noch nicht abgeschickt
    BESTELLT = "bestellt"         # Bei Lieferant bestellt
    TEILGELIEFERT = "teilgeliefert"  # Nur ein Teil angekommen
    GELIEFERT = "geliefert"       # Komplett angekommen
    STORNIERT = "storniert"       # Bestellung abgebrochen


class Bestellung(Base):
    __tablename__ = "bestellungen"

    id = Column(Integer, primary_key=True, index=True)
    bestellnummer = Column(String(50), unique=True, nullable=False, index=True)
    
    # Lieferant
    lieferant_id = Column(Integer, ForeignKey("lieferanten.id"), nullable=False)
    lieferant = relationship("Lieferant", back_populates="bestellungen")
    
    # Status & Daten
    status = Column(Enum(BestellStatus), default=BestellStatus.ENTWURF, nullable=False)
    bestelldatum = Column(DateTime, nullable=True)  # Wann bestellt
    lieferdatum_erwartet = Column(DateTime, nullable=True)  # Wann erwartet
    lieferdatum_tatsaechlich = Column(DateTime, nullable=True)  # Wann tatsächlich geliefert
    
    # Kosten
    gesamtpreis = Column(Numeric(10, 2), default=0.0)
    versandkosten = Column(Numeric(10, 2), default=0.0)
    
    # Notizen
    notizen = Column(Text, nullable=True)
    interne_notizen = Column(Text, nullable=True)  # Für interne Infos
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    positionen = relationship("BestellPosition", back_populates="bestellung", cascade="all, delete-orphan")


class BestellPosition(Base):
    __tablename__ = "bestellpositionen"

    id = Column(Integer, primary_key=True, index=True)
    
    # Zuordnung
    bestellung_id = Column(Integer, ForeignKey("bestellungen.id"), nullable=False)
    bestellung = relationship("Bestellung", back_populates="positionen")
    
    artikel_id = Column(Integer, ForeignKey("artikel.id"), nullable=False)
    artikel = relationship("Artikel")
    
    # Menge & Preis
    menge = Column(Integer, nullable=False)
    einzelpreis = Column(Numeric(10, 2), nullable=False)  # EK vom Lieferanten
    gesamtpreis = Column(Numeric(10, 2), nullable=False)  # menge * einzelpreis
    
    # Lieferung
    menge_geliefert = Column(Integer, default=0, nullable=False)  # Wie viel tatsächlich geliefert
    geliefert = Column(Boolean, default=False, nullable=False)  # Komplett geliefert?
    
    # Notizen
    notizen = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
