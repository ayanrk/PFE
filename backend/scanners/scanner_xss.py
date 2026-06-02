# scanners/scanner_XSS.py

import requests
from bs4 import BeautifulSoup
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ============================================
# CONFIGURATION
# ============================================

PAYLOADS_XSS = [
    # Basiques
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "<svg onload=alert('XSS')>",
    
    # Contournement filtres basiques
    "<SCRIPT>alert('XSS')</SCRIPT>",
    "<scr<script>ipt>alert('XSS')</scr</script>ipt>",
    "<%2Fscript><script>alert('XSS')</script>",
    
    # Attributs HTML
    "<body onload=alert('XSS')>",
    "<input autofocus onfocus=alert('XSS')>",
    "<select onchange=alert('XSS')>",
    "<iframe src=javascript:alert('XSS')>",
    
    # Encodage
    "<script>alert(String.fromCharCode(88,83,83))</script>",
    "&#60;script&#62;alert('XSS')&#60;/script&#62;",
    
    # Sans parenthèses
    "<script>alert`XSS`</script>",
    
    # Protocoles
    "javascript:alert('XSS')",
    "data:text/html,<script>alert('XSS')</script>",
]


# ============================================
# FONCTION : Vérifier si payload est encodé
# ============================================

def est_encode(payload, contenu):
    payload_encode = (
        payload
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("'", "&#039;")
        .replace('"', "&quot;")
    )
    return payload_encode in contenu


# ============================================
# FONCTION : Extraire le contexte HTML autour du payload
# ============================================

def extraire_html_snippet(contenu, payload, context_chars=300):
    """
    Retourne un extrait HTML centré autour du payload injecté.
    """
    try:
        idx = contenu.find(payload)
        if idx == -1:
            return None
        start = max(0, idx - context_chars)
        end   = min(len(contenu), idx + len(payload) + context_chars)
        snippet = contenu[start:end].strip()
        # Nettoyer un peu les espaces excessifs
        import re
        snippet = re.sub(r'\n\s*\n', '\n', snippet)
        return snippet[:800]  # max 800 chars pour le stockage
    except Exception:
        return None


# ============================================
# FONCTION : Extraire paramètres URL
# ============================================

def extraire_parametres(url):
    parametres = {}
    if "?" in url:
        url_propre = url.split("#")[0]
        base, query = url_propre.split("?", 1)
        for param in query.split("&"):
            if "=" in param:
                nom, valeur = param.split("=", 1)
                parametres[nom] = valeur
    return parametres


# ============================================
# FONCTION : Extraire formulaires
# ============================================

def extraire_formulaires(url, session):
    try:
        response = session.get(url, verify=False, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        return soup.find_all("form")
    except Exception as e:
        print(f"⚠️  Erreur extraction formulaires : {e}")
        return []


# ============================================
# FONCTION : Tester payload dans URL
# ============================================

def tester_payload_url(url, param, payload, session):
    try:
        url_propre = url.split("#")[0]
        params = extraire_parametres(url)
        params[param] = payload

        url_test = url_propre.split("?")[0] + "?" + "&".join(
            f"{k}={v}" for k, v in params.items()
        )

        response = session.get(url_test, verify=False, timeout=10)
        contenu  = response.text

        if payload in contenu and not est_encode(payload, contenu):
            snippet = extraire_html_snippet(contenu, payload)
            return "vulnerable", url_test, snippet
        elif est_encode(payload, contenu):
            return "protege", url_test, None
        else:
            return "non_refleti", url_test, None

    except Exception as e:
        print(f"  ⚠️  Erreur test URL : {e}")
        return "erreur", None, None


# ============================================
# FONCTION PRINCIPALE : scanner_xss
# ============================================

def scanner_xss(url, cookie=None, username=None, password=None):
    print(f"\n{'='*60}")
    print(f"  SCANNER XSS")
    print(f"{'='*60}")
    print(f"  Cible : {url}\n")

    resultats = {
        "score":                  100,
        "vulnerabilites":         [],
        "payloads_reussis":       [],
        "parametres_vulnerables": [],
        "proteges":               [],
        "erreur":                 None
    }

    session = requests.Session()

    # ── Authentification ──────────────────────────────────────────
    if cookie:
        for part in cookie.split(";"):
            part = part.strip()
            if "=" in part:
                name, value = part.split("=", 1)
                session.cookies.set(name.strip(), value.strip())
        print(f"🍪 Cookie appliqué\n")

    elif username and password:
        try:
            login_url = url.split("/")[0] + "//" + url.split("/")[2] + "/login.php"
            login_data = {"username": username, "password": password, "Login": "Login"}
            session.post(login_url, data=login_data, verify=False, timeout=10)
            session.cookies.set("security", "low")
            print(f"✅ Login réussi\n")
        except Exception as e:
            print(f"⚠️  Erreur login : {e}\n")

    else:
        print(f"🌐 Site public — pas d'authentification\n")


    # ── ÉTAPE 3 : Tester paramètres URL ─────────────────────────
    parametres = extraire_parametres(url)

    if parametres:
        print(f"Paramètres URL trouvés : {list(parametres.keys())}")
        print(f"Test de {len(PAYLOADS_XSS)} payloads par paramètre...\n")

        for param in parametres:
            if any(mot in param.lower() for mot in ["token", "csrf", "nonce"]):
                print(f"  ⏭️  Paramètre '{param}' ignoré (token de sécurité)")
                continue

            print(f"  → Test paramètre : '{param}'")
            vulnerable = False
            protege    = False

            for payload in PAYLOADS_XSS:
                statut, url_test, html_snippet = tester_payload_url(url, param, payload, session)

                if statut == "vulnerable":
                    print(f"  ❌ VULNÉRABLE !")
                    print(f"     Payload : {payload}")
                    print(f"     URL     : {url_test}\n")

                    resultats["vulnerabilites"].append({
                        "type":         "XSS Reflected",
                        "gravite":      "CRITIQUE",
                        "parametre":    param,
                        "payload":      payload,
                        "url":          url_test,
                        "url_test":     url_test,
                        "html_snippet": html_snippet,
                        "solution":     "Utiliser htmlspecialchars() pour encoder les sorties. Implémenter une Content Security Policy (CSP)."
                    })
                    resultats["payloads_reussis"].append(payload)
                    resultats["parametres_vulnerables"].append(param)
                    resultats["score"] = 0
                    vulnerable = True
                    break

                elif statut == "protege":
                    protege = True

            if not vulnerable:
                if protege:
                    print(f"  ✅ Paramètre '{param}' — encodage correct\n")
                    resultats["proteges"].append(param)
                else:
                    print(f"  ✅ Paramètre '{param}' — non reflété\n")

    else:
        print(f"ℹ️  Aucun paramètre dans l'URL\n")


    # ── ÉTAPE 4 : Tester formulaires ─────────────────────────────
    print(f"Recherche de formulaires...")
    formulaires = extraire_formulaires(url, session)
    print(f"Formulaires trouvés : {len(formulaires)}\n")

    for i, form in enumerate(formulaires):
        action  = form.get("action", "")
        methode = form.get("method", "get").lower()
        inputs  = form.find_all("input")

        if not action or action == "#":
            action_url = url.split("?")[0]
        elif action.startswith("http"):
            action_url = action
        else:
            parties    = url.split("/")
            base       = parties[0] + "//" + parties[2]
            action_url = base + "/" + action.lstrip("/")

        print(f"  Formulaire {i+1} — action={action_url} méthode={methode}")

        for inp in inputs:
            nom       = inp.get("name", "")
            type_inp  = inp.get("type", "text")

            if not nom:
                continue
            if type_inp in ["submit", "button", "image", "file"]:
                continue
            if any(mot in nom.lower() for mot in ["token", "csrf", "nonce"]):
                print(f"    ⏭️  Champ '{nom}' ignoré (token)")
                continue

            print(f"    → Test champ : '{nom}'")

            for payload in PAYLOADS_XSS:
                try:
                    data = {}
                    for inp2 in inputs:
                        nom2 = inp2.get("name", "")
                        if nom2:
                            data[nom2] = inp2.get("value", "test")

                    data[nom] = payload

                    if methode == "post":
                        response = session.post(action_url, data=data, verify=False, timeout=10)
                    else:
                        response = session.get(action_url, params=data, verify=False, timeout=10)

                    contenu = response.text

                    if payload in contenu and not est_encode(payload, contenu):
                        html_snippet = extraire_html_snippet(contenu, payload)
                        url_test_form = action_url + ("?" + "&".join(f"{k}={v}" for k, v in data.items()) if methode == "get" else "")

                        print(f"    ❌ VULNÉRABLE ! Champ='{nom}' Payload={payload}\n")

                        resultats["vulnerabilites"].append({
                            "type":         "XSS Stored/Reflected (formulaire)",
                            "gravite":      "CRITIQUE",
                            "parametre":    nom,
                            "payload":      payload,
                            "url":          action_url,
                            "url_test":     url_test_form,
                            "html_snippet": html_snippet,
                            "solution":     "Encoder les sorties HTML avec htmlspecialchars(). Valider et filtrer toutes les entrées côté serveur. Implémenter une CSP stricte."
                        })
                        resultats["payloads_reussis"].append(payload)
                        if nom not in resultats["parametres_vulnerables"]:
                            resultats["parametres_vulnerables"].append(nom)
                        resultats["score"] = 0
                        break

                except Exception as e:
                    print(f"    ⚠️  Erreur : {e}")
                    continue

    # ── Résultat final ────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  RÉSULTAT FINAL XSS")
    print(f"{'='*60}")

    if resultats["vulnerabilites"]:
        print(f"  ❌ {len(resultats['vulnerabilites'])} vulnérabilité(s) XSS détectée(s)")
    else:
        print(f"  ✅ Aucune vulnérabilité XSS détectée")

    print(f"  Score : {resultats['score']}/100")
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
        choix = input("Cookie manuel ou login automatique ? (cookie/login) : ").lower()
        if choix == "cookie":
            cookie = input("Entrez votre cookie (ex: security=low; PHPSESSID=xxx) : ")
            scanner_xss(url, cookie=cookie)
        elif choix == "login":
            username = input("Username : ")
            password = input("Password : ")
            scanner_xss(url, username=username, password=password)
        else:
            print("Choix invalide — scan sans authentification")
            scanner_xss(url)
    else:
        scanner_xss(url)