import connectDB from "@/config/db";
import Order from "@/models/order";
import ReferralPurchase from "@/models/ReferralPurchase";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const { orderId, status } = await request.json();

    if (!orderId || !status || !["pending", "approved", "reject"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
    }

    // Handle rejected orders
    if (status === "reject") {
      const deletedOrder = await Order.findByIdAndDelete(orderId);
      if (!deletedOrder) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Order rejected and deleted" });
    }

    // Find and populate order
    const order = await Order.findById(orderId).populate("items.product");
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    order.status = status;
    await order.save();

    // Handle referral purchase
    if (status === "approved" && order.referralCode) {
      // Recalculate actual order total from product prices
      const totalAmount = order.items.reduce((sum, item) => {
        const price = item.product?.offerPrice || 0;
        return sum + price * item.quantity;
      }, 0);

      // Avoid duplicate entries using orderId
      const alreadyLogged = await ReferralPurchase.findOne({ orderId: order._id });

      if (!alreadyLogged) {
        await ReferralPurchase.create({
          orderId: order._id,
          referralCode: order.referralCode,
          buyer: order.address?.fullName || "Anonymous",
          amount: totalAmount,
          date: order.date || new Date(),
        });
      }
    }

    return NextResponse.json({ success: true, message: "Order status updated" });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
