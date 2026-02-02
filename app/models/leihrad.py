from sqlalchemy import Column, Integer, String, Numeric, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum

class LeihradStatus(str, enum.Enum):
    verfuegbar = "verfuegbar"
    verliehen = "verliehen"
    wartung = "wartung"
    defekt = "defekt"

class Leihrad(Base):
    __tablename__ = "leihraeder"

    id = Column(Integer, primary_key=True, index=True)
    inventarnummer = Column(String(50), unique=True, nullable=False, index=True)
    marke = Column(String(100), nullable=False)
    modell = Column(String(100))
    rahmennummer = Column(String(100))
    farbe = Column(String(50))
    rahmenhoeho = Column(String(20))  # z.B. "M", "L", "54cm"
    typ = Column(String(50))  # z.B. "Citybike", "E-Bike", "MTB"
    
    # Preise
    tagespreis = Column(Numeric(10, 2), nullable=False, default=0)
    wochenpreis = Column(Numeric(10, 2))
    kaution = Column(Numeric(10, 2), default=50.00)
    
    # Status & Zustand
    status = Column(Enum(LeihradStatus), nullable=False, default=LeihradStatus.verfuegbar)
    zustand = Column(Text)  # Notizen zu Zustand/Mängeln
    
    # Metadaten
    angeschafft_am = Column(DateTime, default=datetime.utcnow)
    letzte_wartung = Column(DateTime)
    naechste_wartung = Column(DateTime)
    notizen = Column(Text)
    
    # Beziehungen
    vermietungen = relationship("Vermietung", back_populates="leihrad", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Leihrad {self.inventarnummer} - {self.marke} {self.modell} ({self.status})>"
