import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck } from "lucide-react";
import "../styles/Navbar.css";

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
    // ← Admin retiré d'ici
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="10" fill="white" fillOpacity="0.15"/>
            <path d="M20 8L32 14V22C32 28.627 26.627 34.627 20 36C13.373 34.627 8 28.627 8 22V14L20 8Z" fill="white" fillOpacity="0.9"/>
            <path d="M16 20L19 23L24 17" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="navbar-logo-text">PFE Scanner</span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${location.pathname === link.path ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          {/* Visible uniquement pour l'admin */}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`navbar-link navbar-link-admin ${location.pathname === "/admin" ? "active" : ""}`}
            >
              <ShieldCheck size={14} />
              Admin
            </Link>
          )}
        </div>

        <div className="navbar-user">
          <div className="navbar-user-badge">
            <div className="navbar-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="navbar-username">{user?.username}</span>
          </div>
          <button onClick={handleLogout} className="navbar-logout-btn">
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}