import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrdersPage from './pages/OrdersPage';
import ChatBot from './components/chat/ChatBot';

function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>
        <span>🛒</span> <strong>ShopBot</strong>
      </div>
      <div style={styles.navLinks}>
        <Link to="/" style={styles.navLink}>Produits</Link>
        <Link to="/orders" style={styles.navLink}>Commandes</Link>
      </div>
      <div style={styles.navUser}>
        <span style={styles.username}>👤 {user?.username}</span>
        <button style={styles.logoutBtn} onClick={logout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <>
      <Navbar />
      {children}
      <ChatBot />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProtectedRoute>
                <ProductDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

const styles = {
  nav: {
    background: 'white', borderBottom: '1px solid #e2e8f0',
    padding: '0 24px', height: 60, display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  navBrand: { fontSize: 18, fontWeight: 700, color: '#2563eb', display: 'flex', gap: 8 },
  navLinks: { display: 'flex', gap: 24 },
  navLink: { color: '#475569', textDecoration: 'none', fontWeight: 500, fontSize: 14 },
  navUser: { display: 'flex', alignItems: 'center', gap: 12 },
  username: { fontSize: 13, color: '#64748b' },
  logoutBtn: {
    background: '#fee2e2', color: '#dc2626', border: 'none',
    borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
  },
};
