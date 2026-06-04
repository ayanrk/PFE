from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from config import Config
from models import db
from models.user import User
from models.scan import Scan
from models.vulnerability import Vulnerability
from models.module import Module


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)
    CORS(app, origins=["http://localhost:5173"])

    with app.app_context():
        db.create_all()
        print("Tables MySQL créées avec succès")

        # Initialiser les modules si pas encore en base
        if Module.query.count() == 0:
            modules_defaut = [
                Module(key="headers", label="HTTP Headers",  description="Vérifie les headers OWASP",      is_active=True),
                Module(key="csrf",    label="CSRF",          description="Analyse formulaires et cookies", is_active=True),
                Module(key="xss",     label="XSS",           description="Injection de payloads",          is_active=True),
                Module(key="sqli",    label="SQL Injection", description="Détection via sqlmap",           is_active=True),
            ]
            db.session.bulk_save_objects(modules_defaut)
            db.session.commit()
            print("Modules initialisés")

    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from routes.scan_routes import scan_bp
    app.register_blueprint(scan_bp, url_prefix="/api/scans")

    from routes.report_routes import report_bp
    app.register_blueprint(report_bp, url_prefix="/api/reports")

    from routes.admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    from routes.dashboard_routes import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    
    @app.route("/api/test")
    def test():
        return {"message": "Backend PFE Scanner opérationnel", "status": "ok"}

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)