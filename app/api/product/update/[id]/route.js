import connectDB from '@/config/db'; // your MongoDB connection helper
import Product from '@/models/product'; // your Product mongoose model
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = params;

  try {
    await connectDB();

    const auth = getAuth(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields if needed
    const { name, category, price, offerPrice, description } = data;
    if (!name || !category || price == null || offerPrice == null) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find product to update and check ownership
    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Optional: Check if the logged-in user owns this product (depends on your model)
    if (product.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update product fields
    product.name = name;
    product.category = category;
    product.price = price;
    product.offerPrice = offerPrice;
    product.description = description || product.description;

    await product.save();

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
