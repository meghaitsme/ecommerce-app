import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';

export default function CartPage() {
  const { cart, update, remove } = useCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container empty-cart">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn-primary">Shop now</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Shopping Cart</h1>
      <div className="cart-list">
        {cart.items.map((item) => (
          <div key={item.product._id} className="cart-item">
            <img src={item.product.image} alt={item.product.name} />
            <div className="cart-item-info">
              <Link to={`/product/${item.product._id}`}>
                <h3>{item.product.name}</h3>
              </Link>
              <p>{formatPrice(item.price)} each</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => update(item.product._id, Number(e.target.value))}
            />
            <p className="line-total">{formatPrice(item.price * item.quantity)}</p>
            <button onClick={() => remove(item.product._id)} className="btn-danger">Remove</button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h2>Total: {formatPrice(cart.total)}</h2>
        <Link to="/checkout" className="btn-primary">Proceed to Checkout</Link>
      </div>
    </div>
  );
}