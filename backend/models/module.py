from models import db

class Module(db.Model):
    __tablename__ = "modules"

    id          = db.Column(db.Integer, primary_key=True)
    key         = db.Column(db.String(50), unique=True, nullable=False)
    label       = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    is_active   = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            "id":          self.id,
            "key":         self.key,
            "label":       self.label,
            "description": self.description,
            "is_active":   self.is_active,
        }