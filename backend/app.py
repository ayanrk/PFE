from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from models.user import User
from models.scan import Scan
from models.vulnerability import Vulnerability

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # ============================================
    # Extensions
    # ============================================
    db.init_app(app)
    JWTManager(app)
    CORS(app, origins=["http://localhost:5173"])  # Port React Vite

    # ============================================
    # Créer les tables automatiquement
    # ============================================
    with app.app_context():
        db.create_all()
        print("✅ Tables MySQL créées avec succès")

    # ============================================
    # Enregistrer les routes (à décommenter plus tard)
    # ============================================
    # from routes.auth_routes import auth_bp
    # from routes.scan_routes import scan_bp
    # from routes.report_routes import report_bp
    # app.register_blueprint(auth_bp,   url_prefix="/api/auth")
    # app.register_blueprint(scan_bp,   url_prefix="/api/scans")
    # app.register_blueprint(report_bp, url_prefix="/api/reports")

    # ============================================
    # Route test
    # ============================================
    @app.route("/api/test")
    def test():
        return {"message": "✅ Backend PFE Scanner opérationnel", "status": "ok"}

    return app


# ============================================
# LANCEMENT
# ============================================
if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)