# scanners/scanner_csrf.py

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# ============================================
# CONFIGURATION
# ============================================

MOTS_CLES_TOKEN = [
    "csrf", "token", "_token", "xsrf",
    "authenticity_token", "nonce", "csrfmiddlewaretoken"
]

GRAVITE = {
    "token_absent":     "CRITIQUE",
    "samesite_absent":  "ÉLEVÉE",
    "methode_get":      "MOYENNE",
    "aucun_formulaire": "INFO"
}


# ============================================
# FONCTION PRINCIPALE
# ============================================

def scanner_csrf(url, cookie=None):

    print(f"\n{'='*60}")
    print(f"  SCAN CSRF")
    print(f"  URL cible : {url}")
    print(f"{'='*60}\n")

    resultats = {
        "url": url,
        "formulaires": [],
        "cookies": [],
        "score": 0,
        "erreur": None
    }

    # ============================================
    # ÉTAPE 1 : Créer session + authentification
    # ============================================
    session = requests.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    })

    if cookie:
        for part in cookie.split(";"):
            part = part.strip()
            if "=" in part:
                nom, valeur = part.split("=", 1)
                session.cookies.set(nom.strip(), valeur.strip())
        print(f"✅ Cookie configuré\n")
    else:
        print(f"🌐 Site public — pas d'authentification\n")

    # ============================================
    # ÉTAPE 2 : Télécharger la page HTML
    # ============================================
    try:
        response = session.get(url, timeout=10, verify=False, allow_redirects=True)

        print(f"✅ Page téléchargée")
        print(f"   Code HTTP : {response.status_code}")
        print(f"   Taille    : {len(response.text)} caractères\n")

    except requests.exceptions.ConnectionError:
        resultats["erreur"] = "Impossible de se connecter au site."
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats

    except requests.exceptions.Timeout:
        resultats["erreur"] = "Le site ne répond pas."
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats

    # ============================================
    # ÉTAPE 3 : Parser le HTML
    # ============================================
    soup        = BeautifulSoup(response.text, "html.parser")
    formulaires = soup.find_all("form")

    print(f"--- ANALYSE DES FORMULAIRES ---")
    print(f"Nombre de formulaires trouvés : {len(formulaires)}\n")

    if not formulaires:
        print("ℹ️  Aucun formulaire trouvé sur cette page")
        resultats["formulaires"].append({
            "info":    "Aucun formulaire trouvé",
            "gravite": GRAVITE["aucun_formulaire"]
        })

    # ============================================
    # ÉTAPE 4 : Analyser chaque formulaire
    # ============================================
    total_forms    = len(formulaires)
    forms_proteges = 0

    for i, form in enumerate(formulaires):

        print(f"--- Formulaire {i+1} ---")

        action  = form.get("action", "non définie")
        methode = form.get("method", "GET").upper()

        print(f"  Action  : {action}")
        print(f"  Méthode : {methode}")

        resultat_form = {
            "numero":        i + 1,
            "action":        action,
            "methode":       methode,
            "token_csrf":    False,
            "nom_token":     None,
            "vulnerabilites": []
        }

        # Vérification 1 : Méthode GET
        if methode == "GET":
            print(f"  ⚠️  Formulaire en méthode GET")
            print(f"      Les données apparaissent dans l'URL → peu sécurisé")
            resultat_form["vulnerabilites"].append({
                "type":    "Méthode GET",
                "gravite": GRAVITE["methode_get"],
                "detail":  "Formulaire soumis en GET — données visibles dans l'URL"
            })

        # Vérification 2 : Token CSRF
        inputs = form.find_all("input")

        print(f"  Inputs trouvés : {len(inputs)}")
        for inp in inputs:
            nom   = inp.get("name", "sans nom")
            type_ = inp.get("type", "text")
            print(f"    → name='{nom}' type='{type_}'")

        token_trouve = False
        nom_token    = None

        for inp in inputs:
            nom_input = inp.get("name", "").lower()
            valeur    = inp.get("value", "")
            type_inp  = inp.get("type", "").lower()

            if any(mot in nom_input for mot in MOTS_CLES_TOKEN):
                if valeur or type_inp == "hidden":
                    token_trouve = True
                    nom_token    = nom_input
                    break

        if token_trouve:
            forms_proteges += 1
            print(f"  ✅ Token CSRF trouvé : '{nom_token}'")
            resultat_form["token_csrf"] = True
            resultat_form["nom_token"]  = nom_token
        else:
            print(f"  ❌ Aucun token CSRF — Formulaire VULNÉRABLE")
            resultat_form["vulnerabilites"].append({
                "type":    "Token CSRF absent",
                "gravite": GRAVITE["token_absent"],
                "detail":  f"Le formulaire '{action}' n'a pas de token CSRF"
            })

        print()
        resultats["formulaires"].append(resultat_form)

    # ============================================
    # ÉTAPE 5 : Analyser les cookies
    # ============================================
    print(f"--- ANALYSE DES COOKIES ---\n")

    # On analyse les cookies de la session (inclut ceux injectés manuellement)
    tous_les_cookies = session.cookies

    if not tous_les_cookies:
        print("ℹ️  Aucun cookie détecté\n")
    else:
        for ck in tous_les_cookies:
            print(f"Cookie : {ck.name}")

            resultat_cookie = {
                "nom":      ck.name,
                "secure":   False,
                "httponly": False,
                "samesite": None,
                "vulnerabilites": []
            }

            # Secure
            if ck.secure:
                print(f"  ✅ Secure : Oui")
                resultat_cookie["secure"] = True
            else:
                print(f"  ❌ Secure : Non — cookie envoyé aussi en HTTP")
                resultat_cookie["vulnerabilites"].append({
                    "type":    "Cookie non sécurisé",
                    "gravite": "ÉLEVÉE",
                    "detail":  "Cookie transmis en HTTP non chiffré"
                })

            # HttpOnly
            extra    = ck._rest
            httponly = extra.get("HttpOnly", None)
            if httponly is not None:
                print(f"  ✅ HttpOnly : Oui")
                resultat_cookie["httponly"] = True
            else:
                print(f"  ❌ HttpOnly : Non — cookie accessible via JavaScript")
                resultat_cookie["vulnerabilites"].append({
                    "type":    "HttpOnly absent",
                    "gravite": "ÉLEVÉE",
                    "detail":  "Cookie lisible par JavaScript — risque de vol via XSS"
                })

            # SameSite
            samesite = extra.get("SameSite", None)
            if samesite:
                print(f"  ✅ SameSite : {samesite}")
                resultat_cookie["samesite"] = samesite
            else:
                print(f"  ❌ SameSite : Absent — cookie envoyé depuis n'importe quel site")
                resultat_cookie["vulnerabilites"].append({
                    "type":    "SameSite absent",
                    "gravite": GRAVITE["samesite_absent"],
                    "detail":  "Cookie envoyé automatiquement depuis d'autres sites"
                })

            print()
            resultats["cookies"].append(resultat_cookie)

    # ============================================
    # ÉTAPE 6 : Score final
    # ============================================
    if total_forms > 0:
        score = int((forms_proteges / total_forms) * 100)
    else:
        score = 50

    resultats["score"] = score

    print(f"{'='*60}")
    print(f"  RÉSULTAT FINAL CSRF")
    print(f"{'='*60}")
    print(f"  Formulaires protégés : {forms_proteges}/{total_forms}")
    print(f"  Score sécurité       : {score}/100")

    if score == 100:
        print(f"  Niveau               : 🟢 BON")
    elif score >= 50:
        print(f"  Niveau               : 🟡 MOYEN")
    else:
        print(f"  Niveau               : 🔴 FAIBLE — Site vulnérable")

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
        cookie = input("Entrez votre cookie (ex: PHPSESSID=xxx; security=low) : ").strip()
        scanner_csrf(url, cookie=cookie)
    else:
        scanner_csrf(url)
        