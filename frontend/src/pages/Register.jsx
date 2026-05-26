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
    if (form.password !== form.confirm) { setError("Les mots de passe ne correspondent pas"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", { username: form.username, email: form.email, password: form.password });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-left">
        <div className="register-left-content">
          <div className="register-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15"/>
              <path d="M20 8L32 14V22C32 28.627 26.627 34.627 20 36C13.373 34.627 8 28.627 8 22V14L20 8Z" fill="white" fillOpacity="0.9"/>
              <path d="M16 20L19 23L24 17" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="register-logo-text">PFE Scanner</span>
          </div>
          <h1 className="register-tagline">Créez votre<br />compte gratuit</h1>
          <p className="register-tagline-sub">Commencez à analyser vos applications web en quelques secondes.</p>
          <div className="register-steps">
            {[{num:"1",text:"Créez votre compte"},{num:"2",text:"Entrez l'URL à scanner"},{num:"3",text:"Recevez votre rapport PDF"}].map((s) => (
              <div key={s.num} className="register-step-item">
                <div className="register-step-num">{s.num}</div>
                <span className="register-step-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="register-right">
        <div className="register-card">
          <h2 className="register-title">Créer un compte</h2>
          <p className="register-subtitle">Rejoignez PFE Scanner gratuitement</p>
          {error && <div className="register-error">⚠ {error}</div>}
          <form onSubmit={handleSubmit} className="register-form">
            <div className="register-field">
              <label className="register-label">Nom d'utilisateur</label>
              <input type="text" name="username" placeholder="ex: admin" value={form.username} onChange={handleChange} required className="register-input" />
            </div>
            <div className="register-field">
              <label className="register-label">Adresse email</label>
              <input type="email" name="email" placeholder="admin@test.com" value={form.email} onChange={handleChange} required className="register-input" />
            </div>
            <div className="register-field">
              <label className="register-label">Mot de passe</label>
              <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required className="register-input" />
            </div>
            <div className="register-field">
              <label className="register-label">Confirmer le mot de passe</label>
              <input type="password" name="confirm" placeholder="••••••••" value={form.confirm} onChange={handleChange} required className="register-input" />
            </div>
            <button type="submit" disabled={loading} className="register-btn">
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>
          <p className="register-login-link">
            Déjà un compte ? <Link to="/login" className="register-link">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
