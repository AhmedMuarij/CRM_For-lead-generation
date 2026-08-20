from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class ImportLog(Base):
    __tablename__ = "import_logs"

    id = Column(Integer, primary_key=True, index=True)
    imported_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    rows_found = Column(Integer, default=0)
    new_leads = Column(Integer, default=0)
    duplicates = Column(Integer, default=0)
    errors = Column(Integer, default=0)
    error_details = Column(JSON, nullable=True)
    imported_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    imported_by_user = relationship("User", back_populates="import_logs")
