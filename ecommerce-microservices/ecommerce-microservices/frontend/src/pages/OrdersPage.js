import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  PENDING:    { label: 'En attente',   color: '#d97706', bg: '#fef9c3', icon: '⏳', step: 0 },
  CONFIRMED:  { label: 'Confirmée',    color: '#2563eb', bg: '#eff6ff', icon: '✅', step: 1 },
  PROCESSING: { label: 'En préparation', color: '#7c3aed', bg: '#f5f3ff', icon: '⚙️', step: 2 },
  SHIPPED:    { label: 'Expédiée',     color: '#0891b2', bg: '#ecfeff', icon: '🚚', step: 3 },
  DELIVERED:  { label: 'Livrée',       color: '#16a34a', bg: '#dcfce7', icon: '📦', step: 4 },
  CANCELLED:  { label: 'Annulée',      color: '#dc2626', bg: '#fee2e2', icon: '❌', step: -1 },
};

const STEPS = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée'];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function StatusProgress({ status }) {
  const cfg = STATUS[status] || STATUS.PENDING;
  if (status === 'CANCELLED') return null;
  return (
    <div style={prog.wrapper}>
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div style={prog.step}>
            <div style={{
              ...prog.dot,
              background: i <= cfg.step ? '#2563eb' : '#e2e8f0',
              border: i === cfg.step ? '3px solid #93c5fd' : '2px solid transparent',
              boxShadow: i === cfg.step ? '0 0 0 3px #dbeafe' : 'none',
            }}>
              {i <= cfg.step && <span style={{ fontSize: 10, color: 'white' }}>✓</span>}
            </div>
            <span style={{ ...prog.label, color: i <= cfg.step ? '#2563eb' : '#94a3b8', fontWeight: i === cfg.step ? 700 : 400 }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ ...prog.line, background: i < cfg.step ? '#2563eb' : '#e2e8f0' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onExpand, expanded }) {
  const cfg = STATUS[order.status] || STATUS.PENDING;
  const date = new Date(order.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div style={card.wrapper}>
      {/* Header */}
      <div style={card.header} onClick={() => onExpand(order.id)}>
        <div style={card.headerLeft}>
          <span style={{ fontSize: 22 }}>{cfg.icon}</span>
          <div>
            <div style={card.orderId}>Commande #{order.id}</div>
            <div style={card.date}>{date}</div>
          </div>
        </div>
        <div style={card.headerRight}>
          <span style={{ ...card.badge, color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
          <span style={card.total}>{Number(order.totalAmount).toFixed(2)} DT</span>
          <span style={{ color: '#94a3b8', fontSize: 18 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Progress */}
      {expanded && (
        <div style={card.body}>
          <StatusProgress status={order.status} />

          {/* Items */}
          <div style={card.section}>
            <div style={card.sectionTitle}>🛍️ Articles commandés</div>
            <div style={card.itemsList}>
              {order.items?.map((item, i) => (
                <div key={i} style={card.item}>
                  <div style={card.itemInfo}>
                    <span style={card.itemName}>{item.productName || `Produit #${item.productId}`}</span>
                    <span style={card.itemQty}>× {item.quantity}</span>
                  </div>
                  <div style={card.itemPrices}>
                    <span style={card.itemUnit}>{Number(item.unitPrice).toFixed(2)} DT / unité</span>
                    <span style={card.itemSubtotal}>{Number(item.subtotal).toFixed(2)} DT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping + Total */}
          <div style={card.bottomRow}>
            <div style={card.shippingBox}>
              <span style={card.shippingLabel}>📍 Adresse de livraison</span>
              <span style={card.shippingAddr}>{order.shippingAddress}</span>
            </div>
            <div style={card.totalBox}>
              <div style={card.totalRow}>
                <span>Sous-total</span>
                <span>{Number(order.totalAmount).toFixed(2)} DT</span>
              </div>
              <div style={card.totalRow}>
                <span>Livraison</span>
                <span style={{ color: '#16a34a' }}>Gratuite</span>
              </div>
              <div style={{ ...card.totalRow, fontWeight: 800, fontSize: 16, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
                <span>Total</span>
                <span style={{ color: '#2563eb' }}>{Number(order.totalAmount).toFixed(2)} DT</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data } = await ordersAPI.getMyOrders();
      // Sort by most recent first
      setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      // Auto-expand the first order
      if (data.length > 0) setExpandedId(data[0].id);
    } catch (err) {
      setError('Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === 'DELIVERED').length,
    totalSpent: orders.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.totalAmount), 0),
  };

  return (
    <div style={page.container}>
      {/* Header */}
      <div style={page.header}>
        <div>
          <h1 style={page.title}>📦 Mes Commandes</h1>
          <p style={page.subtitle}>Suivez l'état de toutes vos commandes</p>
        </div>
        <button style={page.shopBtn} onClick={() => navigate('/')}>
          🛍️ Continuer mes achats
        </button>
      </div>

      {/* Stats */}
      {!loading && orders.length > 0 && (
        <div style={page.statsGrid}>
          <div style={page.statCard}>
            <span style={page.statNum}>{stats.total}</span>
            <span style={page.statLabel}>Total commandes</span>
          </div>
          <div style={page.statCard}>
            <span style={{ ...page.statNum, color: '#2563eb' }}>{stats.pending}</span>
            <span style={page.statLabel}>En cours</span>
          </div>
          <div style={page.statCard}>
            <span style={{ ...page.statNum, color: '#16a34a' }}>{stats.delivered}</span>
            <span style={page.statLabel}>Livrées</span>
          </div>
          <div style={page.statCard}>
            <span style={{ ...page.statNum, color: '#7c3aed' }}>{stats.totalSpent.toFixed(2)} DT</span>
            <span style={page.statLabel}>Total dépensé</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      {!loading && orders.length > 0 && (
        <div style={page.filters}>
          {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((f) => {
            const cfg = STATUS[f];
            const count = f === 'ALL' ? orders.length : orders.filter((o) => o.status === f).length;
            if (f !== 'ALL' && count === 0) return null;
            return (
              <button
                key={f}
                style={{ ...page.filterBtn, ...(filter === f ? page.filterBtnActive : {}) }}
                onClick={() => setFilter(f)}
              >
                {cfg ? cfg.icon : '🗂️'} {cfg ? cfg.label : 'Toutes'}
                <span style={{ ...page.filterCount, background: filter === f ? '#2563eb' : '#e2e8f0', color: filter === f ? 'white' : '#64748b' }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={page.center}>
          <div style={page.spinner} />
          <p style={{ color: '#64748b', marginTop: 12 }}>Chargement des commandes…</p>
        </div>
      ) : error ? (
        <div style={page.center}>
          <span style={{ fontSize: 48 }}>😕</span>
          <p style={{ color: '#dc2626' }}>{error}</p>
          <button style={page.retryBtn} onClick={loadOrders}>Réessayer</button>
        </div>
      ) : orders.length === 0 ? (
        <div style={page.empty}>
          <span style={{ fontSize: 64 }}>🛒</span>
          <h3 style={{ margin: '12px 0 4px', color: '#1e293b' }}>Aucune commande pour le moment</h3>
          <p style={{ color: '#64748b', margin: '0 0 20px' }}>Explorez notre catalogue et passez votre première commande !</p>
          <button style={page.shopBtn} onClick={() => navigate('/')}>🛍️ Voir le catalogue</button>
        </div>
      ) : (
        <div style={page.list}>
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onExpand={handleExpand}
            />
          ))}
          {filtered.length === 0 && (
            <div style={page.center}>
              <p style={{ color: '#94a3b8' }}>Aucune commande avec ce statut.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const page = {
  container: { maxWidth: 900, margin: '0 auto', padding: '28px 20px 60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a' },
  subtitle: { margin: '4px 0 0', color: '#64748b', fontSize: 14 },
  shopBtn: { background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  statCard: { background: 'white', borderRadius: 14, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 },
  statNum: { fontSize: 22, fontWeight: 800, color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#94a3b8', fontWeight: 500 },
  filters: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  filterBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid #e2e8f0', borderRadius: 20, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#475569' },
  filterBtnActive: { background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb', fontWeight: 700 },
  filterCount: { borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 },
  spinner: { width: 36, height: 36, border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%' },
  retryBtn: { background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center' },
  list: { display: 'flex', flexDirection: 'column', gap: 14 },
};

const card = {
  wrapper: { background: 'white', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' },
  header: { padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: 10 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  orderId: { fontWeight: 700, fontSize: 15, color: '#1e293b' },
  date: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  badge: { borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 },
  total: { fontSize: 16, fontWeight: 800, color: '#2563eb' },
  body: { borderTop: '1px solid #f1f5f9', padding: '20px' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10 },
  itemsList: { display: 'flex', flexDirection: 'column', gap: 8 },
  item: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 10, padding: '10px 14px', flexWrap: 'wrap', gap: 8 },
  itemInfo: { display: 'flex', alignItems: 'center', gap: 8 },
  itemName: { fontWeight: 600, fontSize: 14, color: '#1e293b' },
  itemQty: { background: '#e2e8f0', borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 600, color: '#475569' },
  itemPrices: { display: 'flex', alignItems: 'center', gap: 16 },
  itemUnit: { fontSize: 12, color: '#94a3b8' },
  itemSubtotal: { fontSize: 14, fontWeight: 700, color: '#2563eb' },
  bottomRow: { display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  shippingBox: { flex: 1, background: '#f8fafc', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 },
  shippingLabel: { fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  shippingAddr: { fontSize: 13, color: '#475569' },
  totalBox: { background: '#f8fafc', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' },
};

const prog = {
  wrapper: { display: 'flex', alignItems: 'center', padding: '10px 0 20px', overflowX: 'auto' },
  step: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 70 },
  dot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' },
  label: { fontSize: 10, textAlign: 'center', fontWeight: 500, lineHeight: 1.2 },
  line: { flex: 1, height: 3, borderRadius: 99, minWidth: 20, transition: 'background 0.3s', marginBottom: 18 },
};
