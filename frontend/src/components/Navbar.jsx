import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { path: "/",        label: "Accueil"    },
    { path: "/scan",    label: "Scanner"    },
    { path: "/history", label: "Historique" },
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>

        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15"/>
            <path d="M20 8L32 14V22C32 28.627 26.627 34.627 20 36C13.373 34.627 8 28.627 8 22V14L20 8Z" fill="white" fillOpacity="0.9"/>
            <path d="M16 20L19 23L24 17" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={styles.logoText}>PFE Scanner</span>
        </Link>

        {/* Links */}
        <div style={styles.links}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                ...styles.link,
                ...(location.pathname === link.path ? styles.linkActive : {}),
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* User */}
        <div style={styles.userSection}>
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span style={styles.username}>{user?.username}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>

      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: "linear-gradient(90deg, #0C447C, #185FA5)",
    boxShadow: "0 2px 12px rgba(12,68,124,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 2rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
  },
  logoText: {
    fontSize: "18px",
    fontWeight: "700",
    color: "white",
  },
  links: {
    display: "flex",
    gap: "8px",
  },
  link: {
    color: "rgba(255,255,255,0.75)",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    padding: "6px 16px",
    borderRadius: "8px",
    transition: "all 0.2s",
    fontFamily: "'Segoe UI', sans-serif",
  },
  linkActive: {
    color: "white",
    background: "rgba(255,255,255,0.15)",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "700",
  },
  username: {
    color: "white",
    fontSize: "14px",
    fontWeight: "500",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "'Segoe UI', sans-serif",
    transition: "all 0.2s",
  },
};