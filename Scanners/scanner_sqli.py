# scanners/scanner_sqli.py

import subprocess
import os
import sys
import requests

# ============================================
# CONFIGURATION
# ============================================

SQLMAP_PATH = os.path.join(
    os.path.dirname(__file__),
    "..", "Tools", "sqlmap", "sqlmap.py"
)

# ← RAPPORTS_DIR supprimé : plus de génération de fichiers CSV


# ============================================
# FONCTION LOGIN
# ============================================

def get_cookie(url, username=None, password=None):
    if not username or not password:
        return None

    try:
        session = requests.Session()

        parties  = url.split("/")
        base_url = parties[0] + "//" + parties[2]

        login_url = (base_url + "/dvwa/login.php"
                     if "dvwa" in url.lower()
                     else base_url + "/login.php")

        session.post(login_url, data={
            "username": username,
            "password": password,
            "Login": "Login"
        }, verify=False, timeout=10)

        cookies = session.cookies.get_dict()

        if not cookies:
            print("⚠️  Aucun cookie récupéré")
            return None

        cookie_str = "; ".join([f"{k}={v}" for k, v in cookies.items()])

        if "dvwa" in url.lower():
            cookie_str += "; security=low"

        print(f"✅ Cookie récupéré : {cookie_str[:60]}...")
        return cookie_str

    except Exception as e:
        print(f"⚠️  Erreur login : {e}")
        return None


# ============================================
# FONCTION PRINCIPALE
# ============================================

def scanner_sqli(url, cookie=None, username=None, password=None):

    print(f"\n{'='*60}")
    print(f"  SCAN SQL INJECTION")
    print(f"  URL cible : {url}")
    print(f"{'='*60}\n")

    resultats = {
        "url": url,
        "vulnerabilites": [],
        "type_injection": [],
        "base_de_donnees": None,
        "parametres_vulnerables": [],
        "score": 100,
        "erreur": None
    }

    # ── Étape 1 : Vérifier sqlmap ────────────────────────────────
    if not os.path.exists(SQLMAP_PATH):
        resultats["erreur"] = "sqlmap non trouvé."
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats

    # ← os.makedirs supprimé : plus de création du dossier reports/sqli
    print(f"✅ sqlmap trouvé\n")

    # ── Étape 2 : Authentification ───────────────────────────────
    if cookie:
        print(f"✅ Cookie fourni manuellement\n")
    elif username and password:
        print(f"🔐 Tentative de login automatique...")
        cookie = get_cookie(url, username, password)
    else:
        print(f"🌐 Site public — pas d'authentification\n")

    # ── Étape 3 : Construire la commande sqlmap ──────────────────
    commande = [
        sys.executable,
        SQLMAP_PATH,
        "--url",        url,
        "--batch",
        "--level",      "1",   # réduit le nombre de tests
        "--risk",       "1",
        "--forms",
        "--timeout",    "10",
        "--time-sec",   "3",   # réduit le délai time-based (défaut=5s)
        "--disable-coloring",
        "--flush-session",
    ]

    if cookie:
        commande += ["--cookie", cookie]

    print(f"Lancement de sqlmap...")

    # ── Étape 4 : Lancer sqlmap ──────────────────────────────────
    try:
        process = subprocess.run(
            commande,
            capture_output=True,
            text=True,
            timeout=300
        )

        sortie  = process.stdout
        erreurs = process.stderr

        if erreurs:
            print("=== Erreurs ===")
            print(erreurs)

    except subprocess.TimeoutExpired:
        resultats["erreur"] = "sqlmap a dépassé le temps limite"
        print(f"❌ Timeout")
        return resultats

    except FileNotFoundError:
        resultats["erreur"] = "Python non trouvé"
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats

    # ── Étape 5 : Analyser la sortie ────────────────────────────
    lignes = sortie.split("\n")

    for ligne in lignes:
        ligne_lower = ligne.lower()
        ligne_strip = ligne.strip()

        # Paramètre vulnérable — sqlmap écrit : "Parameter: id (GET)"
        if ligne_strip.lower().startswith("parameter:"):
            parametre = ligne_strip[len("parameter:"):].strip()
            if parametre not in resultats["parametres_vulnerables"]:
                resultats["parametres_vulnerables"].append(parametre)

        # Type d'injection — sqlmap écrit : "Type: boolean-based blind"
        if ligne_strip.lower().startswith("type:"):
            type_brut = ligne_strip[5:].strip()

            if "boolean-based" in type_brut.lower():
                if "Boolean-based" not in resultats["type_injection"]:
                    resultats["type_injection"].append("Boolean-based")
            elif "time-based" in type_brut.lower():
                if "Time-based" not in resultats["type_injection"]:
                    resultats["type_injection"].append("Time-based")
            elif "error-based" in type_brut.lower():
                if "Error-based" not in resultats["type_injection"]:
                    resultats["type_injection"].append("Error-based")
            elif "union" in type_brut.lower():
                if "UNION-based" not in resultats["type_injection"]:
                    resultats["type_injection"].append("UNION-based")

        # Confirmation injection
        if "injection point" in ligne_lower and (
                "resumed" in ligne_lower or "identified" in ligne_lower):
            resultats["score"] = 0

        # Base de données — sqlmap écrit : "[INFO] the back-end DBMS is MySQL"
        if "the back-end dbms is" in ligne_lower:
            bdd = ligne.split("is")[-1].strip()
            resultats["base_de_donnees"] = bdd

    # Construire la vulnérabilité après la boucle
    if resultats["type_injection"] or resultats["parametres_vulnerables"]:
        resultats["score"] = 0

        parties_detail = []
        if resultats["parametres_vulnerables"]:
            parties_detail.append(
                f"Paramètre(s) : {', '.join(resultats['parametres_vulnerables'])}"
            )
        if resultats["type_injection"]:
            parties_detail.append(
                f"Techniques : {', '.join(resultats['type_injection'])}"
            )

        resultats["vulnerabilites"].append({
            "type":     "SQL Injection",
            "gravite":  "CRITIQUE",
            "detail":   " — ".join(parties_detail),
            "solution": (
                "Utiliser des requêtes préparées (Prepared Statements), "
                "valider et échapper toutes les entrées utilisateur"
            )
        })

    # ── Étape 6 : Résultat final ─────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  RÉSULTAT FINAL SQL INJECTION")
    print(f"{'='*60}")

    if resultats["vulnerabilites"]:
        print(f"  ❌ VULNÉRABLE à SQL Injection !")
        if resultats["parametres_vulnerables"]:
            print(f"  Paramètres      : {', '.join(resultats['parametres_vulnerables'])}")
        if resultats["type_injection"]:
            print(f"  Techniques      : {', '.join(resultats['type_injection'])}")
        if resultats["base_de_donnees"]:
            print(f"  Base de données : {resultats['base_de_donnees']}")
        for v in resultats["vulnerabilites"]:
            print(f"\n  → {v['detail']}")
            print(f"  💡 Solution : {v['solution']}")
    else:
        print(f"  ✅ Aucune injection SQL détectée")

    print(f"\n  Score : {resultats['score']}/100")
    print(f"{'='*60}\n")

    return resultats


# ============================================
# LANCEMENT DIRECT
# ============================================
if __name__ == "__main__":

    url = input("Entrez l'URL à scanner : ").strip()
    if not url.startswith("http"):
        url = "http://" + url

    auth = input("\nLe site nécessite-t-il une authentification ? (o/n) : ").strip().lower()

    if auth == "o":
        choix = input("Cookie manuel ou login automatique ? (cookie/login) : ").strip().lower()

        if choix == "cookie":
            cookie = input("Entrez votre cookie : ").strip()
            scanner_sqli(url, cookie=cookie)

        elif choix == "login":
            username = input("Username : ").strip()
            password = input("Password : ").strip()
            scanner_sqli(url, username=username, password=password)
    else:
        scanner_sqli(url)