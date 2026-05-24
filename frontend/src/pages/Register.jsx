import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

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
        email:    form.email,
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
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15"/>
              <path d="M20 8L32 14V22C32 28.627 26.627 34.627 20 36C13.373 34.627 8 28.627 8 22V14L20 8Z" fill="white" fillOpacity="0.9"/>
              <path d="M16 20L19 23L24 17" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={styles.logoText}>PFE Scanner</span>
          </div>
          <h1 style={styles.tagline}>Créez votre<br />compte gratuit</h1>
          <p style={styles.taglineSub}>Commencez à analyser vos applications web en quelques secondes.</p>
          <div style={styles.steps}>
            {[
              { num: "1", text: "Créez votre compte" },
              { num: "2", text: "Entrez l'URL à scanner" },
              { num: "3", text: "Recevez votre rapport PDF" },
            ].map((s) => (
              <div key={s.num} style={styles.stepItem}>
                <div style={styles.stepNum}>{s.num}</div>
                <span style={styles.stepText}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Créer un compte</h2>
          <p style={styles.subtitle}>Rejoignez PFE Scanner gratuitement</p>

          {error && (
            <div style={styles.errorBox}>⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Nom d'utilisateur</label>
              <input
                type="text"
                name="username"
                placeholder="ex: admin"
                value={form.username}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Adresse email</label>
              <input
                type="email"
                name="email"
                placeholder="admin@test.com"
                value={form.email}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mot de passe</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Confirmer le mot de passe</label>
              <input
                type="password"
                name="confirm"
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p style={styles.loginLink}>
            Déjà un compte ?{" "}
            <Link to="/login" style={styles.link}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
  },
  left: {
    flex: 1,
    background: "linear-gradient(135deg, #0C447C 0%, #185FA5 60%, #378ADD 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
  },
  leftContent: {
    maxWidth: "400px",
    color: "white",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "3rem",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "white",
  },
  tagline: {
    fontSize: "42px",
    fontWeight: "700",
    lineHeight: "1.2",
    marginBottom: "1rem",
    color: "white",
  },
  taglineSub: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.75)",
    marginBottom: "2.5rem",
    lineHeight: "1.6",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  stepNum: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    flexShrink: 0,
  },
  stepText: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.85)",
  },
  right: {
    width: "480px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "3rem",
    background: "#F7FAFC",
  },
  card: {
    width: "100%",
    background: "white",
    borderRadius: "16px",
    padding: "2.5rem",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#0C447C",
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#718096",
    marginBottom: "1.5rem",
  },
  errorBox: {
    background: "#FCEBEB",
    border: "1px solid #F09595",
    color: "#A32D2D",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#4A5568",
  },
  input: {
    border: "1.5px solid #E2E8F0",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#1A202C",
    outline: "none",
    background: "white",
  },
  button: {
    background: "linear-gradient(135deg, #185FA5, #0C447C)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "600",
    marginTop: "0.5rem",
    transition: "opacity 0.2s",
  },
  loginLink: {
    textAlign: "center",
    marginTop: "1.5rem",
    fontSize: "14px",
    color: "#718096",
  },
  link: {
    color: "#185FA5",
    fontWeight: "600",
    textDecoration: "none",
  },
};