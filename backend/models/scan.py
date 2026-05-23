from models import db
from datetime import datetime

class Scan(db.Model):
    __tablename__ = "scans"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    url          = db.Column(db.String(500), nullable=False)
    date         = db.Column(db.DateTime, default=datetime.utcnow)
    status       = db.Column(db.String(20), default="en_cours")  # en_cours / termine / erreur
    score_global = db.Column(db.Integer, default=0)

    # Modules lancés (stockés comme JSON string)
    modules      = db.Column(db.String(200), default="headers,csrf,xss,sqli")

    # Scores par module
    score_headers = db.Column(db.Integer, nullable=True)
    score_csrf    = db.Column(db.Integer, nullable=True)
    score_xss     = db.Column(db.Integer, nullable=True)
    score_sqli    = db.Column(db.Integer, nullable=True)

    # Relation vers les vulnérabilités
    vulnerabilites = db.relationship("Vulnerability", backref="scan", lazy=True)

    def to_dict(self):
        return {
            "id":            self.id,
            "url":           self.url,
            "date":          self.date.strftime("%Y-%m-%d %H:%M"),
            "status":        self.status,
            "score_global":  self.score_global,
            "modules":       self.modules,
            "score_headers": self.score_headers,
            "score_csrf":    self.score_csrf,
            "score_xss":     self.score_xss,
            "score_sqli":    self.score_sqli,
        }