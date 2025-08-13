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
    const { address, items, paymentInfo, referralCode, paidAmount, dueAmount } = body;

    // Basic validation
    if (!userId || !address || !items || !items.length || !paymentInfo) {
      return NextResponse.json({ success: false, message: "Invalid order data." });
    }

    for (const item of items) {
      if (!item.product || !item.quantity) {
        return NextResponse.json({ success: false, message: "Each item must have a product and quantity." });
      }
    }

    // Calculate total amount
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product not found: ${item.product}`);
      amount += product.price * item.quantity;
    }

    // Map items correctly to match Order schema
    const mappedItems = items.map(item => ({
      product: item.product, // ✅ Matches schema exactly
      quantity: item.quantity,
    }));

    // Use paidAmount and dueAmount from frontend if provided, else fallback logic
    const paid =
      typeof paidAmount === "number"
        ? paidAmount
        : paymentInfo.method === "CashOnDelivery"
        ? 100
        : amount;

    const due =
      typeof dueAmount === "number"
        ? dueAmount
        : paymentInfo.method === "CashOnDelivery"
        ? amount - paid
        : 0;

    const newOrder = new Order({
      userId,
      address,
      items: mappedItems, // ✅ Correct field
      amount,
      paidAmount: paid,
      dueAmount: due,
      paymentInfo,
      status: 'pending',
      date: Date.now(),
      referralCode: referralCode || null,
    });

    await newOrder.save();

    // Clear user cart
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = [];
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
