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
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15"/>
              <path d="M20 8L32 14V22C32 28.627 26.627 34.627 20 36C13.373 34.627 8 28.627 8 22V14L20 8Z" fill="white" fillOpacity="0.9"/>
              <path d="M16 20L19 23L24 17" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="login-logo-text">PFE Scanner</span>
          </div>
          <h1 className="login-tagline">Sécurisez vos<br />applications web</h1>
          <p className="login-tagline-sub">Scanner automatique de vulnérabilités — XSS, SQLi, CSRF, Headers</p>
          <div className="login-features">
            {["Analyse complète en quelques secondes","Rapport PDF professionnel","Historique de tous vos scans"].map((f, i) => (
              <div key={i} className="login-feature-item">
                <div className="login-feature-dot" />
                <span className="login-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2 className="login-title">Connexion</h2>
          <p className="login-subtitle">Accédez à votre espace de scan</p>
          {error && <div className="login-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Adresse email</label>
              <input type="email" name="email" placeholder="admin@test.com" value={form.email} onChange={handleChange} required className="login-input" />
            </div>
            <div className="login-field">
              <label className="login-label">Mot de passe</label>
              <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="login-input" />
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
    </div>
  );
}
