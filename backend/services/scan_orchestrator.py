# services/scan_orchestrator.py

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scanners'))

from scanner_headers import scanner_headers
from scanner_csrf import scanner_csrf
from scanner_xss import scanner_xss
from scanner_sqli import scanner_sqli

from models import db
from models.scan import Scan
from models.vulnerability import Vulnerability


def lancer_scan(url, modules, user_id, cookie=None):
    """
    Lance les scanners sélectionnés et sauvegarde les résultats en base.
    modules : liste ex. ["headers", "csrf", "xss", "sqli"]
    """
    from models.module import Module
    modules_actifs = []
    for m in modules:
        mod = Module.query.filter_by(key=m).first()
        if mod and not mod.is_active:
            print(f"Module {m} désactivé par l'admin — ignoré")
        else:
            modules_actifs.append(m)
    modules = modules_actifs

    if not modules:
        raise Exception("Aucun module actif disponible")

    # ── Créer l'entrée scan en base ──────────────────────────────
    scan = Scan(
        user_id = user_id,
        url     = url,
        status  = "en_cours",
        modules = ",".join(modules)
    )
    db.session.add(scan)
    db.session.commit()

    scores = []

    try:
        # ── Module Headers ───────────────────────────────────────
        if "headers" in modules:
            print(f"🔍 Lancement scanner Headers...")
            res = scanner_headers(url)
            scan.score_headers = res.get("score", 0)
            scores.append(res.get("score", 0))

            for h in res.get("headers_absents", []):
                vuln = Vulnerability(
                    scan_id  = scan.id,
                    module   = "headers",
                    type     = h.get("header", ""),
                    gravite  = h.get("gravite", "MOYENNE"),
                    detail   = h.get("risque", ""),
                    solution = h.get("solution", "")
                )
                db.session.add(vuln)

        # ── Module CSRF ──────────────────────────────────────────
        if "csrf" in modules:
            print(f"🔍 Lancement scanner CSRF...")
            res = scanner_csrf(url, cookie=cookie)
            scan.score_csrf = res.get("score", 0)
            scores.append(res.get("score", 0))

            for v in res.get("vulnerabilites", []):
                vuln = Vulnerability(
                    scan_id  = scan.id,
                    module   = "csrf",
                    type     = v.get("type", "CSRF"),
                    gravite  = v.get("gravite", "ÉLEVÉE"),
                    detail   = v.get("detail", ""),
                    solution = v.get("solution", "")
                )
                db.session.add(vuln)

        # ── Module XSS ───────────────────────────────────────────
        if "xss" in modules:
            print(f"🔍 Lancement scanner XSS...")
            res = scanner_xss(url, cookie=cookie)
            scan.score_xss = res.get("score", 0)
            scores.append(res.get("score", 0))

            for v in res.get("vulnerabilites", []):
                vuln = Vulnerability(
                    scan_id      = scan.id,
                    module       = "xss",
                    type         = v.get("type", "XSS Reflected"),
                    gravite      = v.get("gravite", "CRITIQUE"),
                    detail       = f"Paramètre : {v.get('parametre', '')}",
                    solution     = v.get("solution", ""),
                    parametre    = v.get("parametre", ""),
                    payload      = v.get("payload", ""),
                    html_snippet = v.get("html_snippet", None),
                    url_test     = v.get("url_test", v.get("url", None))
                )
                db.session.add(vuln)

        # ── Module SQLi ──────────────────────────────────────────
        if "sqli" in modules:
            print(f"🔍 Lancement scanner SQLi...")
            res = scanner_sqli(url, cookie=cookie)
            scan.score_sqli = res.get("score", 0)
            scores.append(res.get("score", 0))

            for v in res.get("vulnerabilites", []):
                vuln = Vulnerability(
                    scan_id  = scan.id,
                    module   = "sqli",
                    type     = v.get("type", "SQL Injection"),
                    gravite  = v.get("gravite", "CRITIQUE"),
                    detail   = v.get("detail", ""),
                    solution = v.get("solution", "")
                )
                db.session.add(vuln)

        # ── Score global ─────────────────────────────────────────
        scan.score_global = int(sum(scores) / len(scores)) if scores else 0
        scan.status       = "termine"

    except Exception as e:
        scan.status = "erreur"
        print(f"❌ Erreur durant le scan : {e}")

    db.session.commit()
    return scan