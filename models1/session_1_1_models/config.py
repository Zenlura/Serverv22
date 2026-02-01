from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    """Application Settings"""
    
    # App
    APP_NAME: str = "Radstation Warenwirtschaft"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:radstation@localhost:5432/radstation"
    
    # Files
    FILES_DIR: str = "files"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: str = "jpg,jpeg,png,pdf"  # Als String, nicht Liste!
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # Ignoriere unbekannte Felder
    )
    
    # === HELPER PROPERTIES ===
    
    @property
    def files_path(self) -> Path:
        """Absoluter Pfad zum Files-Verzeichnis"""
        return Path(self.FILES_DIR).resolve()
    
    @property
    def allowed_extensions_list(self) -> list[str]:
        """Extensions als Liste mit Punkten (z.B. ['.jpg', '.png'])"""
        extensions = [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(",")]
        return [f".{ext}" if not ext.startswith(".") else ext for ext in extensions]
    
    @property
    def allowed_extensions_set(self) -> set[str]:
        """Extensions als Set für schnelle Lookups"""
        return set(self.allowed_extensions_list)
    
    def is_allowed_extension(self, filename: str) -> bool:
        """Prüft ob Dateiendung erlaubt ist"""
        ext = Path(filename).suffix.lower()
        return ext in self.allowed_extensions_set

# Singleton Instance
settings = Settings()
