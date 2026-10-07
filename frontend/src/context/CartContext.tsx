import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../api/axios';
import type { Cart } from '../types';
import { useAuth } from './AuthContext';

interface CartCtx {
  cart: Cart | null;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
  itemCount: number;
}
const Ctx = createContext<CartCtx>({} as CartCtx);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const { user } = useAuth();

  const refresh = async () => {
    if (!user) { setCart(null); return; }
    try {
      const { data } = await api.get<Cart>('/cart');
      setCart(data);
    } catch { setCart(null); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const add = async (productId: string, quantity = 1) => {
    const { data } = await api.post<Cart>('/cart/add', { productId, quantity });
    setCart(data);
  };
  const update = async (productId: string, quantity: number) => {
    const { data } = await api.put<Cart>(`/cart/item/${productId}`, { quantity });
    setCart(data);
  };
  const remove = async (productId: string) => {
    const { data } = await api.delete<Cart>(`/cart/item/${productId}`);
    setCart(data);
  };

  const itemCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return <Ctx.Provider value={{ cart, add, update, remove, refresh, itemCount }}>{children}</Ctx.Provider>;
};

export const useCart = () => useContext(Ctx);