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
    """
    Vérifie si le payload est encodé dans la réponse.
    Si encodé → site protégé
    Si brut   → site vulnérable
    """
    payload_encode = (
        payload
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("'", "&#039;")
        .replace('"', "&quot;")
    )
    return payload_encode in contenu


# ============================================
# FONCTION : Extraire paramètres URL
# ============================================

def extraire_parametres(url):
    parametres = {}
    if "?" in url:
        # Enlever l'ancre (#) si présente
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
        # Enlever l'ancre de l'URL
        url_propre = url.split("#")[0]
        params = extraire_parametres(url)
        params[param] = payload

        url_test = url_propre.split("?")[0] + "?" + "&".join(
            [f"{k}={v}" for k, v in params.items()]
        )

        response = session.get(url_test, verify=False, timeout=10)
        contenu = response.text

        # Vérification correcte
        if payload in contenu and not est_encode(payload, contenu):
            # Payload brut présent → VULNÉRABLE
            return "vulnerable", url_test

        elif est_encode(payload, contenu):
            # Payload encodé → PROTÉGÉ
            return "protege", url_test

        else:
            return "absent", url_test

    except Exception as e:
        return "erreur", str(e)


# ============================================
# FONCTION PRINCIPALE
# ============================================

def scanner_xss(url, cookie=None, username=None, password=None):

    print(f"\n{'='*60}")
    print(f"  SCAN XSS")
    print(f"  URL cible : {url}")
    print(f"{'='*60}\n")

    resultats = {
        "url": url,
        "vulnerabilites": [],
        "proteges": [],
        "payloads_reussis": [],
        "parametres_vulnerables": [],
        "score": 100,
        "erreur": None
    }

    # ============================================
    # ÉTAPE 1 : Créer session HTTP
    # ============================================
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    })

    # ============================================
    # ÉTAPE 2 : Gérer authentification
    # ============================================
    if cookie:
        # Parser et ajouter les cookies
        for part in cookie.split(";"):
            part = part.strip()
            if "=" in part:
                nom, valeur = part.split("=", 1)
                session.cookies.set(nom.strip(), valeur.strip())
        print(f"✅ Cookie configuré\n")

    elif username and password:
        print(f"🔐 Login automatique...")
        try:
            parties = url.split("/")
            base_url = parties[0] + "//" + parties[2]

            if "dvwa" in url.lower():
                login_url = base_url + "/dvwa/login.php"
            else:
                login_url = base_url + "/login.php"

            print(f"   URL login : {login_url}")

            session.post(login_url, data={
                "username": username,
                "password": password,
                "Login": "Login"
            }, verify=False, timeout=10)

            session.cookies.set("security", "low")
            print(f"✅ Login réussi\n")

        except Exception as e:
            print(f"⚠️  Erreur login : {e}\n")

    else:
        print(f"🌐 Site public — pas d'authentification\n")


    # ============================================
    # ÉTAPE 3 : Tester paramètres URL
    # ============================================
    parametres = extraire_parametres(url)

    if parametres:
        print(f"Paramètres URL trouvés : {list(parametres.keys())}")
        print(f"Test de {len(PAYLOADS_XSS)} payloads par paramètre...\n")

        for param in parametres:

            # Ignorer les tokens CSRF
            if any(mot in param.lower() for mot in ["token", "csrf", "nonce"]):
                print(f"  ⏭️  Paramètre '{param}' ignoré (token de sécurité)")
                continue

            print(f"  → Test paramètre : '{param}'")
            vulnerable = False
            protege = False

            for payload in PAYLOADS_XSS:
                statut, url_test = tester_payload_url(
                    url, param, payload, session
                )

                if statut == "vulnerable":
                    print(f"  ❌ VULNÉRABLE !")
                    print(f"     Payload : {payload}")
                    print(f"     URL     : {url_test}\n")

                    resultats["vulnerabilites"].append({
                        "type": "XSS Reflected",
                        "gravite": "CRITIQUE",
                        "parametre": param,
                        "payload": payload,
                        "url": url_test,
                        "solution": "Utiliser htmlspecialchars() pour encoder les sorties"
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


    # ============================================
    # ÉTAPE 4 : Tester formulaires
    # ============================================
    print(f"Recherche de formulaires...")
    formulaires = extraire_formulaires(url, session)
    print(f"Formulaires trouvés : {len(formulaires)}\n")

    for i, form in enumerate(formulaires):
        action = form.get("action", "")
        methode = form.get("method", "get").lower()
        inputs = form.find_all("input")

        # Construire l'URL d'action complète
        if not action or action == "#":
            action_url = url.split("?")[0]
        elif action.startswith("http"):
            action_url = action
        else:
            parties = url.split("/")
            base = parties[0] + "//" + parties[2]
            action_url = base + "/" + action.lstrip("/")

        print(f"  Formulaire {i+1} — action={action_url} méthode={methode}")

        for inp in inputs:
            nom = inp.get("name", "")
            type_inp = inp.get("type", "text")
            valeur_defaut = inp.get("value", "test")

            # Ignorer les champs non textuels et les tokens
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
                    # Construire les données du formulaire
                    data = {}
                    for inp2 in inputs:
                        nom2 = inp2.get("name", "")
                        if nom2:
                            data[nom2] = inp2.get("value", "test")

                    # Injecter le payload dans le champ testé
                    data[nom] = payload

                    if methode == "post":
                        response = session.post(
                            action_url,
                            data=data,
                            verify=False,
                            timeout=10
                        )
                    else:
                        response = session.get(
                            action_url,
                            params=data,
                            verify=False,
                            timeout=10
                        )

                    contenu = response.text

                    if payload in contenu and not est_encode(payload, contenu):
                        print(f"    ❌ VULNÉRABLE ! Payload : {payload}\n")
                        resultats["vulnerabilites"].append({
                            "type": "XSS via formulaire",
                            "gravite": "CRITIQUE",
                            "parametre": nom,
                            "payload": payload,
                            "solution": "Encoder les entrées avec htmlspecialchars()"
                        })
                        resultats["score"] = 0
                        break

                    elif est_encode(payload, contenu):
                        print(f"    ✅ Champ '{nom}' — encodage correct\n")
                        resultats["proteges"].append(nom)
                        break

                except Exception as e:
                    print(f"    ⚠️  Erreur : {e}")
                    continue


    # ============================================
    # ÉTAPE 5 : Résultat final
    # ============================================
    print(f"\n{'='*60}")
    print(f"  RÉSULTAT FINAL XSS")
    print(f"{'='*60}")

    if resultats["vulnerabilites"]:
        print(f"  ❌ VULNÉRABLE au XSS !")
        print(f"  Vulnérabilités : {len(resultats['vulnerabilites'])}\n")
        for v in resultats["vulnerabilites"]:
            print(f"  → Type      : {v['type']}")
            print(f"    Paramètre : {v['parametre']}")
            print(f"    Payload   : {v['payload']}")
            print(f"    Solution  : {v['solution']}\n")
    else:
        print(f"  ✅ Aucune vulnérabilité XSS détectée")

    if resultats["proteges"]:
        print(f"  Paramètres protégés : {resultats['proteges']}")

    # Calcul score final
    total = len(resultats["vulnerabilites"]) + len(resultats["proteges"])
    if total > 0:
        proteges_count = len(resultats["proteges"])
        resultats["score"] = int((proteges_count / total) * 100)

    print(f"\n  Score sécurité : {resultats['score']}/100")

    if resultats["score"] == 100:
        print(f"  Niveau : 🟢 BON")
    elif resultats["score"] >= 50:
        print(f"  Niveau : 🟡 MOYEN")
    else:
        print(f"  Niveau : 🔴 FAIBLE")

    print(f"{'='*60}\n")

    return resultats


# ============================================
# LANCEMENT DIRECT
# ============================================
if __name__ == "__main__":

    url = input("Entrez l'URL à scanner : ")
    if not url.startswith("http"):
        url = "http://" + url

    auth = input("\nLe site nécessite une authentification ? (o/n) : ").lower()

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