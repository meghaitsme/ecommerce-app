
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react';

import { db } from '../data/firebase';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

import { useAuth } from './AuthContext';

// ==========================================
// 1. CART ITEM INTERFACE
// ==========================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// ==========================================
// 2. PRODUCT INPUT INTERFACE
// ==========================================

interface ProductImage {
  url?: string;
  imageUrl?: string;
}

interface CartProduct {
  id?: string;
  _id?: string;
  productId?: string;
  name?: string;
  price?: number | string;
  image?: string | Array<string | ProductImage>;
  imageUrl?: string;
  images?: Array<string | ProductImage>;
  stock?: number | string;
  stockQuantity?: number | string;
  quantity?: number | string;
  inStock?: boolean;
  [key: string]: unknown;
}

// ==========================================
// 3. CART CONTEXT INTERFACE
// ==========================================

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: CartProduct,
    quantity?: number
  ) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  cartLoading: boolean;
}

// ==========================================
// 4. CREATE CONTEXT
// ==========================================

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

// ==========================================
// 5. NORMALIZE CART DATA
// ==========================================

const normalizeCart = (items: unknown): CartItem[] => {
  if (!Array.isArray(items)) return [];

  return items
    .filter(
      (item): item is Record<string, unknown> =>
        !!item &&
        typeof item === 'object' &&
        !Array.isArray(item)
    )
    .map((item): CartItem | null => {
      const id = String(item.id || '').trim();
      const name = String(item.name || '').trim();
      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !id ||
        !name ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return null;
      }

      return {
        id,
        name,
        price,
        image:
          typeof item.image === 'string'
            ? item.image
            : '',
        quantity
      };
    })
    .filter((item): item is CartItem => item !== null);
};

// ==========================================
// 6. GET PRODUCT IMAGE
// ==========================================

const getProductImage = (product: CartProduct): string => {
  const normalizeImage = (
    value: string | ProductImage | undefined
  ): string => {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (value && typeof value === 'object') {
      return value.url || value.imageUrl || '';
    }

    return '';
  };

  if (typeof product.image === 'string' && product.image.trim()) {
    return product.image.split(',')[0].trim();
  }

  if (Array.isArray(product.image) && product.image.length > 0) {
    return normalizeImage(product.image[0]);
  }

  if (product.imageUrl) {
    return product.imageUrl;
  }

  if (product.images?.length) {
    return normalizeImage(product.images[0]);
  }

  return '';
};

// ==========================================
// 7. CART PROVIDER
// ==========================================

export const CartProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  const { user } = useAuth();

  const cartRef = useRef<CartItem[]>([]);
  const requestVersion = useRef(0);

  const saveQueue = useRef<Promise<void>>(
    Promise.resolve()
  );

  // ==========================================
  // 8. UPDATE LOCAL CART
  // ==========================================

  const updateLocalCart = useCallback(
    (items: CartItem[]) => {
      cartRef.current = items;
      setCart(items);
    },
    []
  );

  // ==========================================
  // 9. SAVE CART TO FIRESTORE
  // ==========================================

  const saveCart = useCallback(
    (newCart: CartItem[], uid: string) => {
      const safeCart = normalizeCart(newCart);

      updateLocalCart(safeCart);

      const cartDocument = doc(db, 'carts', uid);

      // Keep a separate snapshot for this save.
      const snapshot = safeCart.map(item => ({
        ...item
      }));

      saveQueue.current = saveQueue.current
        .catch(error => {
          console.error('Previous cart save failed:', error);
        })
        .then(async () => {
          await setDoc(
            cartDocument,
            {
              userId: uid,
              items: snapshot,
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );

          console.log('Cart saved successfully');
        })
        .catch(error => {
          console.error('Error saving cart:', error);
        });
    },
    [updateLocalCart]
  );

  // ==========================================
  // 10. LOAD CART FROM FIRESTORE
  // ==========================================

  useEffect(() => {
    const version = ++requestVersion.current;
    let active = true;

    const fetchCart = async () => {
      setCartLoading(true);
      updateLocalCart([]);

      if (!user?.uid) {
        setCartLoading(false);
        return;
      }

      try {
        const cartDocument = await getDoc(
          doc(db, 'carts', user.uid)
        );

        if (
          !active ||
          version !== requestVersion.current
        ) {
          return;
        }

        const savedItems = cartDocument.exists()
          ? cartDocument.data().items
          : [];

        updateLocalCart(normalizeCart(savedItems));

        console.log('Cart loaded successfully');
      } catch (error) {
        if (active) {
          console.error('Error fetching cart:', error);
        }
      } finally {
        if (
          active &&
          version === requestVersion.current
        ) {
          setCartLoading(false);
        }
      }
    };

    fetchCart();

    return () => {
      active = false;
    };
  }, [user?.uid, updateLocalCart]);

  // ==========================================
  // 11. ADD PRODUCT TO CART
  // ==========================================

  const addToCart = useCallback(
    (
      product: CartProduct,
      requestedQuantity = 1
    ): boolean => {
      if (!user?.uid || cartLoading) {
        console.error('Cart is not ready or user is not logged in.');
        return false;
      }

      if (!product || typeof product !== 'object') {
        return false;
      }

      const productId = String(
        product.id ||
        product.productId ||
        product._id ||
        ''
      ).trim();

      const name = String(product.name || '').trim();
      const price = Number(product.price);

      if (!productId || !name) {
        console.error('Invalid product information:', product);
        return false;
      }

      if (!Number.isFinite(price) || price < 0) {
        console.error('Invalid product price');
        return false;
      }

      if (
        !Number.isInteger(requestedQuantity) ||
        requestedQuantity < 1
      ) {
        console.error('Invalid requested quantity');
        return false;
      }

      // STOCK VALIDATION

      if (product.inStock === false) {
        console.error('Product is out of stock');
        return false;
      }

      const rawStock =
        product.stock ??
        product.stockQuantity ??
        product.quantity;

      const hasStock =
        rawStock !== undefined &&
        rawStock !== null &&
        rawStock !== '';

      const stock = hasStock
        ? Number(rawStock)
        : undefined;

      if (
        hasStock &&
        (!Number.isInteger(stock) || stock! < 0)
      ) {
        console.error('Invalid product stock');
        return false;
      }

      if (
        hasStock &&
        requestedQuantity > stock!
      ) {
        console.error('Requested quantity exceeds stock');
        return false;
      }

      // CHECK EXISTING ITEM

      const existing = cartRef.current.find(
        item => item.id === productId
      );

      const newQuantity =
        (existing?.quantity || 0) + requestedQuantity;

      if (
        hasStock &&
        newQuantity > stock!
      ) {
        console.error('Total quantity exceeds available stock');
        return false;
      }

      // GET IMAGE

      const image = getProductImage(product);

      // UPDATE CART

      const newCart: CartItem[] = existing
        ? cartRef.current.map(item =>
            item.id === productId
              ? {
                  ...item,
                  name,
                  price,
                  image: image || item.image,
                  quantity: newQuantity
                }
              : item
          )
        : [
            ...cartRef.current,
            {
              id: productId,
              name,
              price,
              image,
              quantity: requestedQuantity
            }
          ];

      saveCart(newCart, user.uid);

      return true;
    },
    [user?.uid, cartLoading, saveCart]
  );

  // ==========================================
  // 12. REMOVE PRODUCT
  // ==========================================

  const removeFromCart = useCallback(
    (productId: string) => {
      if (!user?.uid || cartLoading || !productId) {
        return;
      }

      const newCart = cartRef.current.filter(
        item => item.id !== productId
      );

      saveCart(newCart, user.uid);
    },
    [user?.uid, cartLoading, saveCart]
  );

  // ==========================================
  // 13. CLEAR CART
  // ==========================================

  const clearCart = useCallback(() => {
    if (!user?.uid || cartLoading) {
      return;
    }

    saveCart([], user.uid);
  }, [user?.uid, cartLoading, saveCart]);

  // ==========================================
  // 14. ITEM COUNT
  // ==========================================

  const itemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  // ==========================================
  // 15. PROVIDER
  // ==========================================

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        itemCount,
        cartLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ==========================================
// 16. CUSTOM CART HOOK
// ==========================================

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      'useCart must be used within CartProvider'
    );
  }

  return context;
};
