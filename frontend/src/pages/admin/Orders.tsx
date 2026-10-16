import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';

interface OrderDoc {
  _id: string;
  user: { _id: string; name: string; email: string };
  items: { name: string; price: number; quantity: number }[];
  total: number;
  status: string;
  shippingAddress: {
    street: string; city: string; state: string; zip: string; country: string;
  };
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Update failed');
    }
  };

  const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="container">
      <h1>Admin Orders</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && orders.length === 0 && <p>No orders yet.</p>}

      {!loading && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((o) => (
            <div key={o._id} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <strong>Order #{o._id.slice(-8)}</strong>
                  <p style={{ color: '#6b7280', fontSize: 13 }}>
                    {o.user?.name} ({o.user?.email})
                  </p>
                  <p style={{ color: '#6b7280', fontSize: 13 }}>
                    {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 20, fontWeight: 'bold' }}>{formatPrice(o.total)}</p>
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    style={{ marginTop: 6, padding: 6, borderRadius: 6, border: '1px solid #d1d5db' }}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                {o.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{item.name} {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
                <strong>Ship to:</strong> {o.shippingAddress.street}, {o.shippingAddress.city},
                {o.shippingAddress.state} {o.shippingAddress.zip}, {o.shippingAddress.country}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}