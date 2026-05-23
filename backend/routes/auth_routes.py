from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
import bcrypt

from models import db
from models.user import User

auth_bp = Blueprint("auth", __name__)


# ============================================
# POST /api/auth/register
# ============================================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validation des champs
    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Tous les champs sont obligatoires"}), 400

    username = data["username"].strip()
    email    = data["email"].strip().lower()
    password = data["password"]

    # Vérifier si l'utilisateur existe déjà
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Cet email est déjà utilisé"}), 409

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Ce nom d'utilisateur est déjà pris"}), 409

    # Hasher le mot de passe
    password_hash = bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    # Créer l'utilisateur
    user = User(
        username=username,
        email=email,
        password=password_hash
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Compte créé avec succès",
        "user": user.to_dict()
    }), 201


# ============================================
# POST /api/auth/login
# ============================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email et mot de passe requis"}), 400

    email    = data["email"].strip().lower()
    password = data["password"]

    # Chercher l'utilisateur
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    # Vérifier le mot de passe
    if not bcrypt.checkpw(password.encode("utf-8"), user.password.encode("utf-8")):
        return jsonify({"error": "Email ou mot de passe incorrect"}), 401

    # Générer les tokens JWT
    access_token  = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message":       "Connexion réussie",
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user":          user.to_dict()
    }), 200


# ============================================
# GET /api/auth/me  (route protégée)
# ============================================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user    = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Utilisateur non trouvé"}), 404

    return jsonify({"user": user.to_dict()}), 200


# ============================================
# POST /api/auth/refresh
# ============================================
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id      = get_jwt_identity()
    access_token = create_access_token(identity=str(user_id))

    return jsonify({"access_token": access_token}), 200