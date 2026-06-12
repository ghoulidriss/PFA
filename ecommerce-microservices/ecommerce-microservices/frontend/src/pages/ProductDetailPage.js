import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI } from '../services/api';

const STATUS_CONFIG = {
  AVAILABLE:    { label: 'Disponible',  color: '#16a34a', bg: '#dcfce7', icon: '✅' },
  OUT_OF_STOCK: { label: 'Épuisé',      color: '#dc2626', bg: '#fee2e2', icon: '❌' },
  DISCONTINUED: { label: 'Discontinué', color: '#9ca3af', bg: '#f3f4f6', icon: '🚫' },
};

const CATEGORY_ICONS = {
  Électronique: '💻', Electronics: '💻',
  Vêtements: '👕', Clothing: '👕',
  Alimentation: '🍎', Food: '🍎',
  Livres: '📚', Books: '📚',
  Sport: '⚽', Sports: '⚽',
  Maison: '🏠', Home: '🏠',
  Beauté: '💄', Beauty: '💄',
  Jouets: '🧸', Toys: '🧸',
};

const PRODUCT_PLACEHOLDER = (name, category) => {
  const icon = CATEGORY_ICONS[category] || '📦';
  const colors = ['#eff6ff','#f0fdf4','#fef9c3','#fdf4ff','#fff7ed','#f0f9ff'];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return { icon, bg: colors[idx] };
};

// ─── Order Modal ─────────────────────────────────────────────────────────────
function OrderModal({ product, qty, onConfirm, onClose, loading, error }) {
  const [address, setAddress] = useState('');
  const total = (product.price * qty).toFixed(2);

  return (
    <div style={modal.overlay} onClick={onClose}>
      <div style={modal.box} onClick={(e) => e.stopPropagation()}>
        <div style={modal.header}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <h2 style={modal.title}>Confirmer la commande</h2>
          <button style={modal.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Order summary */}
        <div style={modal.summary}>
          <div style={modal.summaryRow}>
            <span style={modal.summaryLabel}>Produit</span>
            <span style={modal.summaryValue}>{product.name}</span>
          </div>
          <div style={modal.summaryRow}>
            <span style={modal.summaryLabel}>Quantité</span>
            <span style={modal.summaryValue}>{qty} unité{qty > 1 ? 's' : ''}</span>
          </div>
          <div style={modal.summaryRow}>
            <span style={modal.summaryLabel}>Prix unitaire</span>
            <span style={modal.summaryValue}>{Number(product.price).toFixed(2)} DT</span>
          </div>
          <div style={{ ...modal.summaryRow, borderTop: '2px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
            <span style={{ ...modal.summaryLabel, fontWeight: 700, color: '#1e293b' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#2563eb' }}>{total} DT</span>
          </div>
        </div>

        {/* Address input */}
        <div style={modal.field}>
          <label style={modal.fieldLabel}>📍 Adresse de livraison *</label>
          <textarea
            style={modal.textarea}
            placeholder="Ex: 12 Rue des Fleurs, Tunis 1002, Tunisie"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />
        </div>

        {error && <div style={modal.error}>❌ {error}</div>}

        <div style={modal.actions}>
          <button style={modal.cancelBtn} onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button
            style={{ ...modal.confirmBtn, opacity: (!address.trim() || loading) ? 0.6 : 1 }}
            onClick={() => address.trim() && onConfirm(address)}
            disabled={!address.trim() || loading}
          >
            {loading ? '⏳ En cours…' : '✅ Confirmer la commande'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [orderError, setOrderError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await productsAPI.getById(id);
        setProduct(data);
      } catch {
        setError('Produit introuvable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleConfirmOrder = async (address) => {
    setOrdering(true);
    setOrderError(null);
    try {
      const { data } = await ordersAPI.create({
        items: [{ productId: product.id, quantity: qty }],
        shippingAddress: address,
      });
      setShowModal(false);
      setOrderSuccess(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Erreur lors de la commande.';
      setOrderError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: '#64748b', marginTop: 12 }}>Chargement du produit…</p>
    </div>
  );

  if (error || !product) return (
    <div style={styles.center}>
      <div style={{ fontSize: 56 }}>😕</div>
      <p style={{ color: '#dc2626', fontSize: 16, marginTop: 12 }}>{error || 'Produit introuvable.'}</p>
      <button style={styles.backBtn} onClick={() => navigate('/')}>← Retour au catalogue</button>
    </div>
  );

  const status = STATUS_CONFIG[product.status] || STATUS_CONFIG.AVAILABLE;
  const placeholder = PRODUCT_PLACEHOLDER(product.name, product.category);
  const available = product.status === 'AVAILABLE' && product.stockQuantity > 0;
  const maxQty = Math.min(product.stockQuantity, 10);

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/')}>← Retour au catalogue</button>

      <div style={styles.card}>
        {/* Left — Image */}
        <div style={styles.imageSection}>
          <div style={{ ...styles.imagePlaceholder, background: placeholder.bg }}>
            <span style={styles.placeholderIcon}>{placeholder.icon}</span>
          </div>
          <div style={styles.categoryBadge}>
            {CATEGORY_ICONS[product.category] || '📦'} {product.category}
          </div>
        </div>

        {/* Right — Details */}
        <div style={styles.infoSection}>
          <div style={{ ...styles.statusBadge, color: status.color, background: status.bg }}>
            {status.icon} {status.label}
          </div>

          <h1 style={styles.productName}>{product.name}</h1>
          <p style={styles.description}>{product.description}</p>

          <div style={styles.priceBlock}>
            <span style={styles.price}>{Number(product.price).toFixed(2)} DT</span>
            {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
              <span style={styles.lowStock}>⚠️ Plus que {product.stockQuantity} en stock !</span>
            )}
          </div>

          <div style={styles.stockRow}>
            <span style={styles.stockLabel}>Stock disponible</span>
            <div style={styles.stockBar}>
              <div style={{
                ...styles.stockFill,
                width: `${Math.min((product.stockQuantity / 100) * 100, 100)}%`,
                background: product.stockQuantity > 20 ? '#16a34a' : product.stockQuantity > 5 ? '#f59e0b' : '#dc2626',
              }} />
            </div>
            <span style={styles.stockCount}>{product.stockQuantity} unités</span>
          </div>

          <div style={styles.metaGrid}>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Référence</span>
              <span style={styles.metaValue}>#{String(product.id).padStart(4, '0')}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Catégorie</span>
              <span style={styles.metaValue}>{product.category}</span>
            </div>
            <div style={styles.metaItem}>
              <span style={styles.metaLabel}>Statut</span>
              <span style={{ ...styles.metaValue, color: status.color }}>{status.label}</span>
            </div>
          </div>

          {/* Success banner */}
          {orderSuccess && (
            <div style={styles.successBanner}>
              <div style={styles.successTop}>
                <span style={{ fontSize: 20 }}>🎉</span>
                <strong>Commande #{orderSuccess.id} passée avec succès !</strong>
              </div>
              <p style={styles.successSub}>
                Statut : <strong>{orderSuccess.status}</strong> — Total : <strong>{Number(orderSuccess.totalAmount).toFixed(2)} DT</strong>
              </p>
              <button style={styles.viewOrdersBtn} onClick={() => navigate('/orders')}>
                📦 Voir mes commandes →
              </button>
            </div>
          )}

          {/* Order section */}
          {!orderSuccess && (available ? (
            <div style={styles.orderSection}>
              <div style={styles.qtyRow}>
                <span style={styles.qtyLabel}>Quantité</span>
                <div style={styles.qtyControls}>
                  <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>
                  <span style={styles.qtyValue}>{qty}</span>
                  <button style={styles.qtyBtn} onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>+</button>
                </div>
                <span style={styles.totalPrice}>= {(product.price * qty).toFixed(2)} DT</span>
              </div>
              <button style={styles.orderBtn} onClick={() => { setOrderError(null); setShowModal(true); }}>
                🛒 Commander maintenant
              </button>
            </div>
          ) : (
            <div style={styles.unavailableBox}>
              <span style={{ fontSize: 24 }}>😔</span>
              <p style={{ margin: 0, color: '#64748b' }}>Ce produit n'est pas disponible pour le moment.</p>
            </div>
          ))}
        </div>
      </div>

      {/* ShopBot prompt */}
      <div style={styles.chatPrompt}>
        <span style={{ fontSize: 28 }}>🤖</span>
        <div>
          <p style={styles.chatPromptTitle}>Des questions sur ce produit ?</p>
          <p style={styles.chatPromptSub}>Demandez à ShopBot — cliquez sur 💬 en bas à droite.</p>
        </div>
      </div>

      {/* Order Modal */}
      {showModal && (
        <OrderModal
          product={product}
          qty={qty}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowModal(false)}
          loading={ordering}
          error={orderError}
        />
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 },
  spinner: { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%' },
  backBtn: { background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, color: '#475569', fontWeight: 500, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 6 },
  card: { background: 'white', borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', display: 'flex', gap: 0, overflow: 'hidden', flexWrap: 'wrap' },
  imageSection: { flex: '0 0 400px', minWidth: 280, padding: 32, display: 'flex', flexDirection: 'column', gap: 16, borderRight: '1px solid #f1f5f9', background: '#fafbff' },
  imagePlaceholder: { borderRadius: 16, aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)' },
  placeholderIcon: { fontSize: 100, lineHeight: 1, userSelect: 'none' },
  categoryBadge: { background: '#eff6ff', color: '#2563eb', borderRadius: 30, padding: '6px 16px', fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'inline-block', alignSelf: 'center' },
  infoSection: { flex: 1, padding: '36px 36px', display: 'flex', flexDirection: 'column', gap: 18, minWidth: 280 },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 600, alignSelf: 'flex-start' },
  productName: { margin: 0, fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.25 },
  description: { margin: 0, fontSize: 15, color: '#475569', lineHeight: 1.7 },
  priceBlock: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  price: { fontSize: 36, fontWeight: 800, color: '#2563eb' },
  lowStock: { fontSize: 13, color: '#d97706', fontWeight: 600, background: '#fef9c3', padding: '3px 10px', borderRadius: 20 },
  stockRow: { display: 'flex', alignItems: 'center', gap: 10 },
  stockLabel: { fontSize: 13, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' },
  stockBar: { flex: 1, height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' },
  stockFill: { height: '100%', borderRadius: 99 },
  stockCount: { fontSize: 13, color: '#64748b', whiteSpace: 'nowrap', minWidth: 60, textAlign: 'right' },
  metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, background: '#f8fafc', borderRadius: 12, padding: 16 },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 3 },
  metaLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: 14, color: '#1e293b', fontWeight: 600 },
  orderSection: { display: 'flex', flexDirection: 'column', gap: 12 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  qtyLabel: { fontSize: 14, fontWeight: 600, color: '#475569' },
  qtyControls: { display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' },
  qtyBtn: { width: 36, height: 36, border: 'none', background: '#f8fafc', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#475569' },
  qtyValue: { width: 44, textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#1e293b' },
  totalPrice: { fontSize: 15, fontWeight: 700, color: '#2563eb' },
  orderBtn: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' },
  successBanner: { background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 },
  successTop: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#15803d', fontSize: 15 },
  successSub: { margin: 0, fontSize: 13, color: '#166534' },
  viewOrdersBtn: { background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13, alignSelf: 'flex-start' },
  unavailableBox: { background: '#f8fafc', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: '1px dashed #cbd5e1', textAlign: 'center' },
  chatPrompt: { marginTop: 28, background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 },
  chatPromptTitle: { margin: 0, fontWeight: 700, color: '#1e293b', fontSize: 15 },
  chatPromptSub: { margin: '4px 0 0', color: '#64748b', fontSize: 13 },
};

const modal = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 },
  box: { background: 'white', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' },
  header: { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 10 },
  title: { margin: 0, flex: 1, color: 'white', fontSize: 18, fontWeight: 700 },
  closeBtn: { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  summary: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: '#64748b' },
  summaryValue: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
  field: { padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: 600, color: '#374151' },
  textarea: { border: '1px solid #d1d5db', borderRadius: 10, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' },
  error: { margin: '12px 24px 0', background: '#fee2e2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  actions: { padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: '#475569' },
  confirmBtn: { background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 3px 8px rgba(22,163,74,0.3)' },
};
