import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import { formatPrice } from '../../utils/format';

export default function Checkout() {
  const { cart, refresh } = useCart();
  const nav = useNavigate();
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!cart || cart.items.length === 0) {
    return <div className="container"><h2>Your cart is empty</h2></div>;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/orders', { shippingAddress: address });
      console.log('Order created:', data);
      await refresh();
      nav('/order-success');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Checkout</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40 }}>
        <form onSubmit={submit}>
          <h2>Shipping Address</h2>
          {(['street','city','state','zip','country'] as const).map((k) => (
            <input
              key={k}
              placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
              value={(address as any)[k]}
              onChange={(e) => setAddress({ ...address, [k]: e.target.value })}
              required
              style={{ width: '100%', padding: 12, marginBottom: 12, border: '1px solid #d1d5db', borderRadius: 8 }}
            />
          ))}
          {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary"
                  style={{ width: '100%', padding: 14, fontSize: 16 }}>
            {loading ? 'Placing order...' : `Place Order - ${formatPrice(cart.total)}`}
          </button>
        </form>

        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2>Order Summary</h2>
          {cart.items.map((item) => (
            <div key={item.product._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>{item.product.name} × {item.quantity}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <hr style={{ margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 18 }}>
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}