import { useEffect, useState } from 'react';
import api from '../../api/axios';
import type { Product } from '../../types';
import { formatPrice } from '../../utils/format';


export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '', description: '', price: 0, image: '', category: 'Electronics', stock: 0
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products');
      setProducts(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', price: 0, image: '', category: 'Electronics', stock: 0 });
    setEditing(null);
    setError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.put(`/products/${editing}`, form);
      } else {
        await api.post('/products', form);
      }
      resetForm();
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Save failed');
    }
  };

  const edit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      category: p.category,
      stock: p.stock,
    });
    setEditing(p._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const del = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  const inputStyle = { width: '100%', padding: 10, marginBottom: 10, border: '1px solid #d1d5db', borderRadius: 8 };

  return (
    <div className="container">
      <h1>Admin Products</h1>

      <form onSubmit={submit} style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <h2>{editing ? 'Edit Product' : 'Add New Product'}</h2>

        <input style={inputStyle} placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} required />

        <textarea style={{ ...inputStyle, minHeight: 80 }} placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} required />

        <input style={inputStyle} type="number" placeholder="Price" value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} required />

        <input style={inputStyle} placeholder="Image URL" value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })} required />

        <select style={inputStyle} value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option>Electronics</option>
          <option>Clothing</option>
          <option>Books</option>
        </select>

        <input style={inputStyle} type="number" placeholder="Stock" value={form.stock}
          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} required />

        {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" className="btn-primary">
            {editing ? 'Update Product' : 'Add Product'}
          </button>
          {editing && (
            <button type="button" onClick={resetForm}
              style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>Existing Products ({products.length})</h2>
      {loading ? <p>Loading...</p> : (
        <table style={{ width: '100%', background: 'white', borderRadius: 12, overflow: 'hidden' }}>
          <thead style={{ background: '#f3f4f6' }}>
            <tr>
              <th style={{ padding: 12, textAlign: 'left' }}>Image</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Category</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Price</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Stock</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 12 }}>
                  <img src={p.image} alt={p.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6 }} />
                </td>
                <td style={{ padding: 12, fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: 12 }}>{p.category}</td>
                <td style={{ padding: 12 }}>{formatPrice(p.price)}</td>
                <td style={{ padding: 12 }}>{p.stock}</td>
                <td style={{ padding: 12 }}>
                  <button onClick={() => edit(p)}
                    style={{ marginRight: 8, padding: '6px 12px', borderRadius: 6, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button onClick={() => del(p._id)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}