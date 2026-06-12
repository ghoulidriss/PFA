import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productsAPI } from '../services/api';

const STATUS_LABELS = {
  AVAILABLE: { label: '✅ Disponible', color: '#16a34a' },
  OUT_OF_STOCK: { label: '❌ Épuisé', color: '#dc2626' },
  DISCONTINUED: { label: '🚫 Discontinué', color: '#9ca3af' },
};

export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getAll();
      setProducts(data);
      const cats = [...new Set(data.map((p) => p.category))];
      setCategories(cats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search) return loadProducts();
    try {
      const { data } = await productsAPI.search(search);
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  const handleCategoryFilter = async (cat) => {
    setCategory(cat);
    if (!cat) return loadProducts();
    try {
      const { data } = await productsAPI.getByCategory(cat);
      setProducts(data);
    } catch (err) { console.error(err); }
  };

  const filtered = products;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Catalogue Produits</h1>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button style={styles.searchBtn} onClick={handleSearch}>Rechercher</button>

        <select
          style={styles.select}
          value={category}
          onChange={(e) => handleCategoryFilter(e.target.value)}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Chargement...</div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((product) => {
            const statusInfo = STATUS_LABELS[product.status] || STATUS_LABELS.AVAILABLE;
            return (
              <div
                key={product.id}
                style={styles.card}
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div style={styles.cardHeader}>
                  <span style={styles.category}>{product.category}</span>
                  <span style={{ ...styles.status, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                <h3 style={styles.productName}>{product.name}</h3>
                <p style={styles.description}>
                  {product.description?.substring(0, 80)}...
                </p>
                <div style={styles.cardFooter}>
                  <span style={styles.price}>{product.price} DT</span>
                  <span style={styles.stock}>Stock: {product.stockQuantity}</span>
                </div>
                <button
                  style={{
                    ...styles.addBtn,
                    opacity: product.status !== 'AVAILABLE' ? 0.5 : 1,
                  }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}
                >
                  Voir le produit →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={styles.empty}>Aucun produit trouvé.</div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: '24px', maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 700, color: '#1e293b', marginBottom: 24 },
  filters: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 200, border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '10px 14px', fontSize: 14,
  },
  searchBtn: {
    background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
    padding: '10px 20px', cursor: 'pointer', fontWeight: 600,
  },
  select: {
    border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 14,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 20,
  },
  card: {
    background: 'white', borderRadius: 12, padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
    display: 'flex', flexDirection: 'column', gap: 10,
    cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  category: {
    background: '#eff6ff', color: '#2563eb', borderRadius: 20,
    padding: '3px 10px', fontSize: 11, fontWeight: 600,
  },
  status: { fontSize: 12, fontWeight: 600 },
  productName: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' },
  description: { margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 20, fontWeight: 700, color: '#2563eb' },
  stock: { fontSize: 12, color: '#64748b' },
  addBtn: {
    background: '#2563eb', color: 'white', border: 'none', borderRadius: 8,
    padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 8,
  },
  loading: { textAlign: 'center', padding: 60, color: '#64748b' },
  empty: { textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 },
};
