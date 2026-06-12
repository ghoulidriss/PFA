import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.register({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      login(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>🛒 ShopBot</div>
        <h2 style={styles.title}>Créer un compte</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Nom d'utilisateur</label>
            <input
              style={styles.input}
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="votre nom d'utilisateur"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="votre@email.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              style={styles.input}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirmer le mot de passe</label>
            <input
              style={styles.input}
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
        <p style={styles.link}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f8fafc',
  },
  card: {
    background: 'white', borderRadius: 16, padding: 40,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: 400,
  },
  logo: { textAlign: 'center', fontSize: 32, marginBottom: 8 },
  title: { textAlign: 'center', margin: '0 0 24px', color: '#1e293b', fontSize: 22 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 600, color: '#475569' },
  input: {
    border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px',
    fontSize: 14, outline: 'none',
  },
  btn: {
    background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
    padding: '12px', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8,
  },
  error: {
    background: '#fee2e2', color: '#dc2626', padding: '10px 14px',
    borderRadius: 8, fontSize: 13, marginBottom: 16,
  },
  link: { textAlign: 'center', marginTop: 16, fontSize: 14, color: '#64748b' },
};
