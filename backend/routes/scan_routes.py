# routes/scan_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from models import db
from models.scan import Scan
from models.vulnerability import Vulnerability
from services.scan_orchestrator import lancer_scan

scan_bp = Blueprint("scans", __name__)

MODULES_VALIDES = ["headers", "csrf", "xss", "sqli"]


# ============================================
# POST /api/scans/run  — Lancer un scan
# ============================================
@scan_bp.route("/run", methods=["POST"])
@jwt_required()
def run_scan():
    user_id = get_jwt_identity()
    data    = request.get_json()

    if not data or not data.get("url"):
        return jsonify({"error": "URL requise"}), 400

    url     = data["url"].strip()
    cookie  = data.get("cookie", None)
    modules = data.get("modules", MODULES_VALIDES)

    # Ajouter http:// si manquant
    if not url.startswith("http"):
        url = "http://" + url

    # Valider les modules
    modules = [m for m in modules if m in MODULES_VALIDES]
    if not modules:
        modules = MODULES_VALIDES

    print(f"\n🚀 Scan lancé par user {user_id}")
    print(f"   URL     : {url}")
    print(f"   Modules : {modules}\n")

    try:
        scan = lancer_scan(
            url     = url,
            modules = modules,
            user_id = user_id,
            cookie  = cookie
        )

        return jsonify({
            "message": "Scan terminé",
            "scan":    scan.to_dict()
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# GET /api/scans/  — Historique de l'utilisateur
# ============================================
@scan_bp.route("/", methods=["GET"])
@jwt_required()
def get_historique():
    user_id = get_jwt_identity()

    scans = Scan.query.filter_by(user_id=user_id)\
                      .order_by(Scan.date.desc())\
                      .all()

    return jsonify({
        "scans": [s.to_dict() for s in scans],
        "total": len(scans)
    }), 200


# ============================================
# GET /api/scans/<id>  — Détail d'un scan
# ============================================
@scan_bp.route("/<int:scan_id>", methods=["GET"])
@jwt_required()
def get_scan(scan_id):
    user_id = get_jwt_identity()

    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()

    if not scan:
        return jsonify({"error": "Scan non trouvé"}), 404

    vulns = Vulnerability.query.filter_by(scan_id=scan_id).all()

    return jsonify({
        "scan":            scan.to_dict(),
        "vulnerabilites":  [v.to_dict() for v in vulns],
        "total_vulns":     len(vulns)
    }), 200


# ============================================
# GET /api/scans/module/<module>  — Historique par module
# ============================================
@scan_bp.route("/module/<module>", methods=["GET"])
@jwt_required()
def get_par_module(module):
    user_id = get_jwt_identity()

    if module not in MODULES_VALIDES:
        return jsonify({"error": "Module invalide"}), 400

    # Récupérer les vulnérabilités du module pour cet utilisateur
    vulns = db.session.query(Vulnerability)\
                      .join(Scan)\
                      .filter(
                          Scan.user_id == user_id,
                          Vulnerability.module == module
                      )\
                      .order_by(Scan.date.desc())\
                      .all()

    return jsonify({
        "module":          module,
        "vulnerabilites":  [v.to_dict() for v in vulns],
        "total":           len(vulns)
    }), 200