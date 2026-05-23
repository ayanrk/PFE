# routes/report_routes.py

import os
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity

from models.scan import Scan
from models.vulnerability import Vulnerability
from models.user import User
from services.pdf_generator import generer_pdf

report_bp = Blueprint("reports", __name__)


# ============================================
# GET /api/reports/<scan_id>  — Générer + télécharger PDF
# ============================================
@report_bp.route("/<int:scan_id>", methods=["GET"])
@jwt_required()
def generer_rapport(scan_id):
    user_id = get_jwt_identity()

    # Vérifier que le scan appartient à l'utilisateur
    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return jsonify({"error": "Scan non trouvé"}), 404

    # Récupérer l'utilisateur
    user = User.query.get(user_id)

    # Récupérer les vulnérabilités
    vulns = Vulnerability.query.filter_by(scan_id=scan_id).all()

    try:
        filepath = generer_pdf(
            scan           = scan,
            vulnerabilites = vulns,
            username       = user.username
        )

        return send_file(
            filepath,
            as_attachment = True,
            download_name = f"rapport_scan_{scan_id}.pdf",
            mimetype      = "application/pdf"
        )

    except Exception as e:
        return jsonify({"error": f"Erreur génération PDF : {str(e)}"}), 500