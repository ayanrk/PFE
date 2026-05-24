import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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
          <h1 style={styles.tagline}>Sécurisez vos<br />applications web</h1>
          <p style={styles.taglineSub}>Scanner automatique de vulnérabilités — XSS, SQLi, CSRF, Headers</p>
          <div style={styles.features}>
            {["Analyse complète en quelques secondes", "Rapport PDF professionnel", "Historique de tous vos scans"].map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <div style={styles.featureDot}/>
                <span style={styles.featureText}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Connexion</h2>
          <p style={styles.subtitle}>Accédez à votre espace de scan</p>

          {error && (
            <div style={styles.errorBox}>
              <span>⚠ {error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
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

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p style={styles.registerLink}>
            Pas encore de compte ?{" "}
            <Link to="/register" style={styles.link}>Créer un compte</Link>
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
  features: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  featureDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.6)",
    flexShrink: 0,
  },
  featureText: {
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
    transition: "border-color 0.2s",
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
  registerLink: {
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