import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import { getAuth } from '@clerk/nextjs/server';
import Order from '@/models/order';
import Product from '@/models/product';
import User from '@/models/user';

export async function POST(request) {
  try {
    await connectDB();

    const { userId } = getAuth(request);
    const body = await request.json();
    const { address, items, paymentInfo } = body;

    if (!userId || !address || !items || !items.length || !paymentInfo) {
      return NextResponse.json({ success: false, message: "Invalid order data." });
    }

    for (const item of items) {
      if (!item.product || !item.quantity) {
        return NextResponse.json({ success: false, message: "Each item must have a product and quantity." });
      }
    }

    // Calculate total amount
    const amount = await items.reduce(async (accP, item) => {
      const acc = await accP;
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);
      return acc + product.price * item.quantity;
    }, 0);

    const mappedItems = items.map(item => ({
      productId: item.product,
      quantity: item.quantity,
    }));

    const newOrder = new Order({
      userId,
      address,
      items: mappedItems,
      amount,
      paymentInfo,
      status: 'pending',
      date: Date.now(),
    });

    await newOrder.save();

    const user = await User.findById(userId);
    if (user) {
      user.cartItems = [];
      await user.save();
    }

    return NextResponse.json({ success: true, message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
