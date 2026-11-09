
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

import { db } from '../data/firebase';
import { useAuth } from './AuthContext';

// ==========================================
// 1. WISHLIST ITEM INTERFACE
// ==========================================

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  category?: string;
  createdAt?: unknown;
}

// ==========================================
// 2. PRODUCT INPUT INTERFACE
// ==========================================

interface WishlistProduct {
  id?: string;
  _id?: string;
  productId?: string;
  name?: string;
  price?: number | string;
  image?: string;
  imageUrl?: string;
  category?: string;
}

// ==========================================
// 3. CONTEXT INTERFACE
// ==========================================

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  error: string | null;
  addToWishlist: (product: WishlistProduct) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

// ==========================================
// 4. CREATE CONTEXT
// ==========================================

const WishlistContext = createContext<
  WishlistContextType | undefined
>(undefined);

// ==========================================
// 5. WISHLIST PROVIDER
// ==========================================

export const WishlistProvider = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();

  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==========================================
  // 6. REAL-TIME WISHLIST LISTENER
  // ==========================================

  useEffect(() => {
    if (!user?.uid) {
      setWishlist([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'wishlist'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: WishlistItem[] = snapshot.docs.map(
          (wishlistDoc) => {
            const data = wishlistDoc.data();

            return {
              id: wishlistDoc.id,
              userId: data.userId || '',
              productId: data.productId || '',
              name: data.name || '',
              price: Number(data.price || 0),
              imageUrl:
                data.imageUrl ||
                data.image ||
                '',
              category: data.category || '',
              createdAt: data.createdAt
            };
          }
        );

        setWishlist(items);
        setLoading(false);
        setError(null);

        console.log('Wishlist loaded successfully');
      },
      (err) => {
        console.error('Wishlist listener error:', err);

        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // ==========================================
  // 7. ADD TO WISHLIST
  // ==========================================

  const addToWishlist = useCallback(
    async (product: WishlistProduct) => {
      if (!user?.uid) {
        throw new Error('Please log in first.');
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
        throw new Error('Invalid product information.');
      }

      if (!Number.isFinite(price) || price < 0) {
        throw new Error('Invalid product price.');
      }

      const imageUrl =
        product.imageUrl ||
        product.image ||
        '';

      // Deterministic ID prevents duplicate entries.
      const wishlistDocumentId =
        `${user.uid}_${productId}`;

      await setDoc(
        doc(db, 'wishlist', wishlistDocumentId),
        {
          userId: user.uid,
          productId,
          name,
          price,
          imageUrl,
          category: product.category || '',
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      console.log('Product added to wishlist');
    },
    [user?.uid]
  );

  // ==========================================
  // 8. REMOVE FROM WISHLIST
  // ==========================================

  const removeFromWishlist = useCallback(
    async (id: string) => {
      if (!user?.uid || !id) {
        throw new Error('Invalid wishlist request.');
      }

      const item = wishlist.find(
        product => product.id === id
      );

      if (!item || item.userId !== user.uid) {
        throw new Error('Wishlist item not found.');
      }

      await deleteDoc(doc(db, 'wishlist', id));

      console.log('Wishlist item removed');
    },
    [user?.uid, wishlist]
  );

  // ==========================================
  // 9. CHECK WISHLIST PRODUCT
  // ==========================================

  const isInWishlist = useCallback(
    (productId: string) => {
      return wishlist.some(
        item => item.productId === productId
      );
    },
    [wishlist]
  );

  // ==========================================
  // 10. PROVIDER
  // ==========================================

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// ==========================================
// 11. CUSTOM HOOK
// ==========================================

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      'useWishlist must be used within WishlistProvider'
    );
  }

  return context;
};
