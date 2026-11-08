
import {
  FieldValue,
  type Query,
  type DocumentData,
} from 'firebase-admin/firestore';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore(getApps()[0] ?? initializeApp());

export interface ProductData {
  [key: string]: any;
  id: string;
  _id: string;
  name: string;
}

const PRODUCTS_COLLECTION = 'products';

// Get a single product by ID
export const getProduct = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw {
      status: 400,
      message: 'Invalid Product ID',
    };
  }

  const productRef = db.collection(PRODUCTS_COLLECTION).doc(id);
  const snapshot = await productRef.get();

  if (!snapshot.exists) {
    throw {
      status: 404,
      message: 'Product not found',
    };
  }

 return {
  id: snapshot.id,
  _id: snapshot.id,
  ...snapshot.data(),
} as ProductData;
};

// Get all products with pagination, filtering and sorting
export const listProducts = async (
  filter: Record<string, any> = {},
  page = 1,
  limit = 12
) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(100, Math.max(1, Number(limit) || 12));

  const skip = (page - 1) * limit;

  let query: Query<DocumentData> =
    db.collection(PRODUCTS_COLLECTION);

  // Apply equality filters
  Object.entries(filter).forEach(([field, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query = query.where(field, '==', value);
    }
  });

  // Get total matching products
  const countSnapshot = await query.count().get();
  const total = countSnapshot.data().count;

  // Fetch paginated products
  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .offset(skip)
    .limit(limit)
    .get();

 const items = snapshot.docs.map((productDoc) => {
  return {
    id: productDoc.id,
    _id: productDoc.id,
    ...productDoc.data(),
  };
});

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

// Create a new product
export const createProduct = async (
  data: Record<string, any>,
  userId: string
) => {
  if (!userId) {
    throw {
      status: 401,
      message: 'User ID is required',
    };
  }

  const productData = {
    ...data,
    createdBy: userId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const productRef = await db
    .collection(PRODUCTS_COLLECTION)
    .add(productData);

  const snapshot = await productRef.get();

  return {
  id: productRef.id,
  _id: productRef.id,
  ...snapshot.data(),
} as ProductData;
};

// Update an existing product
export const updateProduct = async (
  id: string,
  data: Record<string, any>
) => {
  if (!id || typeof id !== 'string') {
    throw {
      status: 400,
      message: 'Invalid Product ID',
    };
  }

  const productRef = db.collection(PRODUCTS_COLLECTION).doc(id);
  const snapshot = await productRef.get();

  if (!snapshot.exists) {
    throw {
      status: 404,
      message: 'Product not found',
    };
  }

  await productRef.update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const updatedSnapshot = await productRef.get();

  return {
  id: updatedSnapshot.id,
  _id: updatedSnapshot.id,
  ...updatedSnapshot.data(),
} as ProductData;
};

// Delete a product
export const deleteProduct = async (id: string) => {
  if (!id || typeof id !== 'string') {
    throw {
      status: 400,
      message: 'Invalid Product ID',
    };
  }

  const productRef = db.collection(PRODUCTS_COLLECTION).doc(id);
  const snapshot = await productRef.get();

  if (!snapshot.exists) {
    throw {
      status: 404,
      message: 'Product not found',
    };
  }

  const product = {
    id: snapshot.id,
    _id: snapshot.id,
    ...snapshot.data(),
  };

  await productRef.delete();

  return {
    message: 'Product deleted successfully',
    product,
  };
};
