import Product from '../models/Product.model';
import mongoose from 'mongoose';
// Make sure you import your Product model at the top if it isn't already
// import Product from '../models/Product'; 

export const getProduct = async (id: string) => {
  // 1. Check if the ID is a valid MongoDB 24-character ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid Product ID format");
  }

  // 2. Fetch the product safely
  const product = await Product.findById(id);
  
  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

export const listProducts = async (filter: any = {}, page = 1, limit = 12) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) };
};

export const createProduct = async (data: any, userId: string) =>
  Product.create({ ...data, createdBy: userId });

export const updateProduct = async (id: string, data: any) => {
  const p = await Product.findByIdAndUpdate(id, data, { new: true });
  if (!p) throw { status: 404, message: 'Product not found' };
  return p;
};

export const deleteProduct = async (id: string) => {
  const p = await Product.findByIdAndDelete(id);
  if (!p) throw { status: 404, message: 'Product not found' };
};

