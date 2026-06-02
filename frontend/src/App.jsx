import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login     from "./pages/Login";
import Register  from "./pages/Register";
import Home      from "./pages/Home";
import ScanPage  from "./pages/ScanPage";
import History   from "./pages/History";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
          }/>
          <Route path="/scan" element={
            <ProtectedRoute><ScanPage /></ProtectedRoute>
          }/>
          <Route path="/history" element={
            <ProtectedRoute><History /></ProtectedRoute>
          }/>
          <Route path="/admin" element={
            <AdminRoute><AdminPage /></AdminRoute>
          }/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}