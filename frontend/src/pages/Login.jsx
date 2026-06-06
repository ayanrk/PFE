import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "../styles/Login.css";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.access_token, res.data.refresh_token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2">
              <path d="M12 2L20 6V12C20 16.4 16.4 20.6 12 22C7.6 20.6 4 16.4 4 12V6L12 2Z"/>
              <path d="M9 12L11 14L15 10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="login-logo-text">MiniSec </span>
        </div>

        {/* Onglets */}
        <div className="login-tabs">
          <span className="login-tab active">Connexion</span>
          <Link to="/register" className="login-tab">Inscription</Link>
        </div>

        <h2 className="login-title">Bon retour</h2>
        <p className="login-subtitle">Connectez-vous à votre espace de scan</p>

        {error && <div className="login-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Adresse email</label>
            <input type="email" name="email" placeholder="admin@test.com"
              value={form.email} onChange={handleChange}
              required className="login-input" />
          </div>
          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <input type="password" name="password" placeholder="••••••••"
              value={form.password} onChange={handleChange}
              required className="login-input" />
          </div>
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="login-register-link">
          Pas encore de compte ?{" "}
          <Link to="/register" className="login-link">Créer un compte</Link>
        </p>

      </div>
    </div>
  );
}