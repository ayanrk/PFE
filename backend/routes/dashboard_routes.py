# routes/dashboard_routes.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from datetime import datetime, timedelta

from models import db
from models.scan import Scan
from models.vulnerability import Vulnerability

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/", methods=["GET"])
@jwt_required()
def get_dashboard():
    user_id = get_jwt_identity()

    # ── Total scans ──────────────────────────────────────────────
    total_scans = Scan.query.filter_by(user_id=user_id).count()

    # ── Scans ce mois ────────────────────────────────────────────
    debut_mois  = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
    scans_mois  = Scan.query.filter(
        Scan.user_id == user_id,
        Scan.date    >= debut_mois
    ).count()

    # ── Total vulnérabilités ──────────────────────────────────────
    total_vulns = db.session.query(func.count(Vulnerability.id))\
        .join(Scan)\
        .filter(Scan.user_id == user_id)\
        .scalar() or 0

    # ── Vulnérabilités critiques ──────────────────────────────────
    vulns_critiques = db.session.query(func.count(Vulnerability.id))\
        .join(Scan)\
        .filter(Scan.user_id == user_id, Vulnerability.gravite == "CRITIQUE")\
        .scalar() or 0

    # ── Meilleur score ────────────────────────────────────────────
    meilleur = Scan.query.filter_by(user_id=user_id, status="termine")\
        .order_by(Scan.score_global.desc()).first()
    meilleur_score = meilleur.score_global if meilleur else None
    meilleur_url   = meilleur.url if meilleur else None

    # ── Score moyen ───────────────────────────────────────────────
    score_moyen_q = db.session.query(func.avg(Scan.score_global))\
        .filter(Scan.user_id == user_id, Scan.status == "termine")\
        .scalar()
    score_moyen = round(score_moyen_q) if score_moyen_q else 0

    # ── Évolution scores (par scan, trié par date) ────────────────
    scans_termines = Scan.query\
        .filter_by(user_id=user_id, status="termine")\
        .order_by(Scan.date.asc())\
        .limit(30).all()

    evolution = [
        {
            "date": s.date.strftime("%d/%m %H:%M") if s.date else "",
            "score": s.score_global or 0,
            "url":   s.url,
        }
        for s in scans_termines
    ]

    # ── Répartition par gravité ───────────────────────────────────
    gravites_q = db.session.query(
        Vulnerability.gravite,
        func.count(Vulnerability.id)
    ).join(Scan)\
     .filter(Scan.user_id == user_id)\
     .group_by(Vulnerability.gravite).all()

    par_gravite = [{"name": g, "value": c} for g, c in gravites_q]

    # ── Score moyen par module ────────────────────────────────────
    modules_data = []
    for key, col in [
        ("headers", Scan.score_headers),
        ("csrf",    Scan.score_csrf),
        ("xss",     Scan.score_xss),
        ("sqli",    Scan.score_sqli),
    ]:
        avg = db.session.query(func.avg(col))\
            .filter(Scan.user_id == user_id, col.isnot(None))\
            .scalar()
        if avg is not None:
            modules_data.append({
                "module":     key.upper(),
                "module_key": key,
                "score":      round(avg),
            })

    # ── Top sites (meilleur / pire / récent) ─────────────────────
    tous_scans = Scan.query\
        .filter_by(user_id=user_id, status="termine")\
        .order_by(Scan.score_global.desc()).all()

    top_sites = []
    if tous_scans:
        top_sites.append({"url": tous_scans[0].url,  "score": tous_scans[0].score_global})
    if len(tous_scans) > 1:
        top_sites.append({"url": tous_scans[-1].url, "score": tous_scans[-1].score_global})

    dernier = Scan.query.filter_by(user_id=user_id, status="termine")\
        .order_by(Scan.date.desc()).first()
    if dernier and (not top_sites or dernier.url != top_sites[0]["url"]):
        top_sites.append({"url": dernier.url, "score": dernier.score_global})

    # ── Derniers scans ────────────────────────────────────────────
    derniers = Scan.query\
        .filter_by(user_id=user_id)\
        .order_by(Scan.date.desc()).limit(5).all()

    derniers_scans = [
        {
            "id":           s.id,
            "url":          s.url,
            "score_global": s.score_global,
            "date":         s.date.strftime("%d/%m/%Y") if s.date else "",
        }
        for s in derniers
    ]

    return jsonify({
        "total_scans":     total_scans,
        "scans_ce_mois":   scans_mois,
        "total_vulns":     total_vulns,
        "vulns_critiques": vulns_critiques,
        "meilleur_score":  meilleur_score,
        "meilleur_url":    meilleur_url,
        "score_moyen":     score_moyen,
        "evolution":       evolution,
        "par_gravite":     par_gravite,
        "score_par_module":modules_data,
        "top_sites":       top_sites,
        "derniers_scans":  derniers_scans,
    }), 200