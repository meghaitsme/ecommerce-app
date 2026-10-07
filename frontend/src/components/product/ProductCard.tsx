import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatPrice } from '../../utils/format';

type Product = {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await add(product._id, 1);
      // Optional: brief feedback
      alert(`Added "${product.name}" to cart`);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        alert('Please login to add to cart');
      } else {
        alert('Failed to add to cart. Please try again.');
      }
    }
  };

  return (
    <Link to={`/product/${product._id}`} className="product-card">
      <div className="product-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="product-category">{product.category}</p>
        <p className="product-price">{formatPrice(product.price)}</p>
        <button
          className="btn-primary"
          onClick={handleAdd}
          style={{ width: '100%' }}
        >
          Add to Cart
        </button>
      </div>
    </Link>
  );
}