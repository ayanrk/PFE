import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/Register.css";

export default function Register() {
  const [form, setForm]       = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* Logo */}
        <div className="register-logo">
          <div className="register-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <path d="M12 2L20 6V12C20 16.4 16.4 20.6 12 22C7.6 20.6 4 16.4 4 12V6L12 2Z"/>
              <path d="M9 12L11 14L15 10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="register-logo-text">PFE Scanner</span>
        </div>

        {/* Onglets */}
        <div className="register-tabs">
          <Link to="/login" className="register-tab">Connexion</Link>
          <span className="register-tab active">Inscription</span>
        </div>

        <h2 className="register-title">Créer un compte</h2>
        <p className="register-subtitle">Rejoignez PFE Scanner gratuitement</p>

        {error && <div className="register-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="register-field">
            <label className="register-label">Nom d'utilisateur</label>
            <input type="text" name="username" placeholder="ex: admin"
              value={form.username} onChange={handleChange}
              required className="register-input" />
          </div>
          <div className="register-field">
            <label className="register-label">Adresse email</label>
            <input type="email" name="email" placeholder="admin@test.com"
              value={form.email} onChange={handleChange}
              required className="register-input" />
          </div>
          <div className="register-field">
            <label className="register-label">Mot de passe</label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange}
              required className="register-input" />
          </div>
          <div className="register-field">
            <label className="register-label">Confirmer le mot de passe</label>
            <input type="password" name="confirm" placeholder="••••••••"
              value={form.confirm} onChange={handleChange}
              required className="register-input" />
          </div>
          <button type="submit" disabled={loading} className="register-btn">
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="register-login-link">
          Déjà un compte ?{" "}
          <Link to="/login" className="register-link">Se connecter</Link>
        </p>

      </div>
    </div>
  );
}