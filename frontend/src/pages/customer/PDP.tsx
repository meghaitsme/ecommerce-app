import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import type { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';

export default function PDP() {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const { add } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setProduct(r.data));
  }, [id]);

  if (!product) return <p className="container">Loading...</p>;

  const handleAdd = async () => {
    try {
      await add(product._id, qty);
      nav('/cart');
    } catch {
      alert('Please login to add to cart');
    }
  };

  return (
    <div className="container pdp">
      <div className="pdp-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="pdp-info">
        <h1>{product.name}</h1>
        <p className="category">{product.category}</p>
        <p className="price">{formatPrice(product.price)}</p>
        <p className="desc">{product.description}</p>
        <p className="stock">In stock: {product.stock}</p>
        <div className="qty-row">
          <label>Quantity:</label>
          <input
            type="number"
            min={1}
            max={product.stock}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          Add {qty} to Cart
        </button>
      </div>
    </div>
  );
}