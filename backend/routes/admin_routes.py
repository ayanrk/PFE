# routes/admin_routes.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func

from models import db
from models.user import User
from models.scan import Scan
from models.vulnerability import Vulnerability
from models.module import Module

admin_bp = Blueprint("admin", __name__)


# ── Décorateur vérification admin ────────────────────────────
def admin_required(fn):
    from functools import wraps
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        user    = User.query.get(user_id)
        if not user or user.role != "admin":
            return jsonify({"error": "Accès refusé — admin uniquement"}), 403
        return fn(*args, **kwargs)
    return wrapper


# ============================================
# GET /api/admin/stats
# ============================================
@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_stats():
    total_users  = User.query.count()
    total_scans  = Scan.query.count()
    total_vulns  = Vulnerability.query.count()
    active_users = User.query.filter_by(is_active=True).count()

    vulns_par_module = db.session.query(
        Vulnerability.module,
        func.count(Vulnerability.id)
    ).group_by(Vulnerability.module).all()

    scans_par_statut = db.session.query(
        Scan.status,
        func.count(Scan.id)
    ).group_by(Scan.status).all()

    return jsonify({
        "total_users":      total_users,
        "total_scans":      total_scans,
        "total_vulns":      total_vulns,
        "active_users":     active_users,
        "vulns_par_module": {m: c for m, c in vulns_par_module},
        "scans_par_statut": {s: c for s, c in scans_par_statut},
    }), 200


# ============================================
# GET /api/admin/users
# ============================================
@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        d = u.to_dict()
        d["total_scans"] = Scan.query.filter_by(user_id=u.id).count()
        result.append(d)
    return jsonify({"users": result, "total": len(result)}), 200


# ============================================
# PUT /api/admin/users/<id>/role
# ============================================
@admin_bp.route("/users/<int:uid>/role", methods=["PUT"])
@admin_required
def update_role(uid):
    data = request.get_json()
    role = data.get("role")
    if role not in ["user", "admin"]:
        return jsonify({"error": "Rôle invalide"}), 400
    user = User.query.get_or_404(uid)
    user.role = role
    db.session.commit()
    return jsonify({"message": "Rôle mis à jour", "user": user.to_dict()}), 200


# ============================================
# PUT /api/admin/users/<id>/toggle
# ============================================
@admin_bp.route("/users/<int:uid>/toggle", methods=["PUT"])
@admin_required
def toggle_user(uid):
    user = User.query.get_or_404(uid)
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({"message": "Statut mis à jour", "is_active": user.is_active}), 200


# ============================================
# DELETE /api/admin/users/<id>
# ============================================
@admin_bp.route("/users/<int:uid>", methods=["DELETE"])
@admin_required
def delete_user(uid):
    current_id = int(get_jwt_identity())
    if uid == current_id:
        return jsonify({"error": "Impossible de supprimer votre propre compte"}), 400
    user = User.query.get_or_404(uid)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Utilisateur supprimé"}), 200


# ============================================
# GET /api/admin/scans
# ============================================
@admin_bp.route("/scans", methods=["GET"])
@admin_required
def get_all_scans():
    scans = Scan.query.order_by(Scan.date.desc()).limit(100).all()
    result = []
    for s in scans:
        d = s.to_dict()
        user = User.query.get(s.user_id)
        d["username"]   = user.username if user else "inconnu"
        d["total_vulns"] = Vulnerability.query.filter_by(scan_id=s.id).count()
        result.append(d)
    return jsonify({"scans": result, "total": len(result)}), 200


# ============================================
# GET /api/admin/vulnerabilities
# ============================================
@admin_bp.route("/vulnerabilities", methods=["GET"])
@admin_required
def get_all_vulns():
    module  = request.args.get("module")
    gravite = request.args.get("gravite")
    query   = Vulnerability.query
    if module:
        query = query.filter_by(module=module)
    if gravite:
        query = query.filter_by(gravite=gravite)
    vulns = query.order_by(Vulnerability.id.desc()).limit(200).all()
    return jsonify({"vulnerabilites": [v.to_dict() for v in vulns], "total": len(vulns)}), 200


# ============================================
# GET /api/admin/modules
# ============================================
@admin_bp.route("/modules", methods=["GET"])
@admin_required
def get_modules():
    modules = Module.query.all()
    return jsonify({"modules": [m.to_dict() for m in modules]}), 200


# ============================================
# PUT /api/admin/modules/<key>/toggle
# ============================================
@admin_bp.route("/modules/<string:key>/toggle", methods=["PUT"])
@admin_required
def toggle_module(key):
    module = Module.query.filter_by(key=key).first_or_404()
    module.is_active = not module.is_active
    db.session.commit()
    return jsonify({
        "message":   f"Module {key} mis à jour",
        "is_active": module.is_active
    }), 200