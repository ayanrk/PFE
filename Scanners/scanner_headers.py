import requests
import urllib3

# Désactive les warnings SSL (certificats non valides)
# Utile pour tester des sites avec HTTPS mal configuré
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


# ============================================
# CONFIGURATION : Les headers à vérifier
# ============================================

HEADERS_SECURITE = {
    "X-Frame-Options": {
        "gravite": "ÉLEVÉE",
        "risque": "Le site peut être intégré dans une iframe par un attaquant (Clickjacking)",
        "solution": "Ajouter : X-Frame-Options: DENY ou SAMEORIGIN"
    },
    "Content-Security-Policy": {
        "gravite": "CRITIQUE",
        "risque": "Des scripts malveillants peuvent s'exécuter sur la page (XSS)",
        "solution": "Ajouter : Content-Security-Policy: default-src 'self'"
    },
    "Strict-Transport-Security": {
        "gravite": "ÉLEVÉE",
        "risque": "La connexion peut être dégradée de HTTPS vers HTTP",
        "solution": "Ajouter : Strict-Transport-Security: max-age=31536000"
    },
    "X-Content-Type-Options": {
        "gravite": "MOYENNE",
        "risque": "Le navigateur peut mal interpréter le type des fichiers",
        "solution": "Ajouter : X-Content-Type-Options: nosniff"
    },
    "Referrer-Policy": {
        "gravite": "MOYENNE",
        "risque": "Des informations sensibles peuvent être envoyées à d'autres sites",
        "solution": "Ajouter : Referrer-Policy: no-referrer"
    },
    "X-XSS-Protection": {
        "gravite": "FAIBLE",
        "risque": "Protection XSS désactivée sur les anciens navigateurs",
        "solution": "Ajouter : X-XSS-Protection: 1; mode=block"
    },
    "Permissions-Policy": {
        "gravite": "MOYENNE",
        "risque": "Le site ne contrôle pas l'accès caméra/micro/localisation",
        "solution": "Ajouter : Permissions-Policy: geolocation=(), microphone=()"
    }
}


# ============================================
# FONCTION PRINCIPALE : Scanner les headers
# ============================================

def scanner_headers(url):

    print(f"\n{'='*60}")
    print(f"  SCAN HTTP SECURITY HEADERS")
    print(f"  URL cible : {url}")
    print(f"{'='*60}\n")

    resultats = {
        "url": url,
        "headers_presents": [],
        "headers_absents": [],
        "headers_reçus": {},
        "score": 0,
        "erreur": None
    }

    # ============================================
    # ÉTAPE 1 : Envoyer la requête HTTP
    # ============================================
    try:
        response = requests.get(
            url,
            timeout=10,        # abandonner après 10 secondes
            verify=False,      # ignorer les erreurs de certificat SSL
            allow_redirects=True  # suivre les redirections automatiquement
        )

        print(f"✅ Connexion réussie")
        print(f"   Code HTTP    : {response.status_code}")
        print(f"   Serveur      : {response.headers.get('Server', 'Non communiqué')}")
        print(f"   URL finale   : {response.url}")

        # Sauvegarder tous les headers reçus
        resultats["headers_reçus"] = dict(response.headers)

    except requests.exceptions.ConnectionError:
        resultats["erreur"] = "Impossible de se connecter au site. Vérifiez l'URL."
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats

    except requests.exceptions.Timeout:
        resultats["erreur"] = "Le site ne répond pas (timeout)."
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats

    except requests.exceptions.MissingSchema:
        resultats["erreur"] = "URL invalide. Ajoutez http:// ou https://"
        print(f"❌ Erreur : {resultats['erreur']}")
        return resultats


    # ============================================
    # ÉTAPE 2 : Analyser chaque header
    # ============================================
    print(f"\n--- ANALYSE DES HEADERS ---\n")

    total_headers = len(HEADERS_SECURITE)
    headers_presents = 0

    for nom_header, infos in HEADERS_SECURITE.items():

        if nom_header in response.headers:
            # ✅ Header présent
            headers_presents += 1
            valeur = response.headers[nom_header]

            print(f"✅ PRÉSENT   | {nom_header}")
            print(f"             | Valeur : {valeur}\n")

            resultats["headers_presents"].append({
                "header": nom_header,
                "valeur": valeur
            })

        else:
            # ❌ Header absent = vulnérabilité
            print(f"❌ ABSENT    | {nom_header}")
            print(f"             | Gravité : {infos['gravite']}")
            print(f"             | Risque  : {infos['risque']}")
            print(f"             | Fix     : {infos['solution']}\n")

            resultats["headers_absents"].append({
                "header": nom_header,
                "gravite": infos["gravite"],
                "risque": infos["risque"],
                "solution": infos["solution"]
            })


    # ============================================
    # ÉTAPE 3 : Calculer le score de sécurité
    # ============================================
    score = int((headers_presents / total_headers) * 100)
    resultats["score"] = score

    print(f"\n{'='*60}")
    print(f"  RÉSULTAT FINAL")
    print(f"{'='*60}")
    print(f"  Headers présents : {headers_presents}/{total_headers}")
    print(f"  Headers absents  : {total_headers - headers_presents}/{total_headers}")
    print(f"  Score sécurité   : {score}/100")

    # Niveau de sécurité global
    if score >= 80:
        print(f"  Niveau           : 🟢 BON")
    elif score >= 50:
        print(f"  Niveau           : 🟡 MOYEN")
    else:
        print(f"  Niveau           : 🔴 FAIBLE — Site vulnérable")

    print(f"{'='*60}\n")

    return resultats


# ============================================
# LANCEMENT DU SCAN
# ============================================

if __name__ == "__main__":
    url = input("Entrez l'URL à scanner : ")

    # Ajouter http:// si l'utilisateur l'a oublié
    if not url.startswith("http"):
        url = "http://" + url

    resultats = scanner_headers(url)