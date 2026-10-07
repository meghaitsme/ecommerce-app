import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import PLP from './pages/customer/PLP';
import PDP from './pages/customer/PDP';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderSuccess from './pages/customer/OrderSuccess';
import Login from './pages/customer/Login';
import Register from './pages/customer/Register';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';

function Protected({ children, admin }: { children: JSX.Element; admin?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <div className="container"><h2>Admin only</h2></div>;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<PLP />} />
            <Route path="/product/:id" element={<PDP />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
            <Route path="/order-success" element={<Protected><OrderSuccess /></Protected>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/products" element={<Protected admin><AdminProducts /></Protected>} />
            <Route path="/admin/orders" element={<Protected admin><AdminOrders /></Protected>} />
            <Route path="*" element={<div className="container"><h2>404</h2></div>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}