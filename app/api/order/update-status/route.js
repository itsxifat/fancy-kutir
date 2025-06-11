import connectDB from "@/config/db";
import Order from "@/models/order";
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

    if (status === "reject") {
      // Delete the order if status is reject
      const deletedOrder = await Order.findByIdAndDelete(orderId);
      if (!deletedOrder) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Order rejected and deleted" });
    } else {
      const order = await Order.findById(orderId);
      if (!order) {
        return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
      }
      order.status = status;
      await order.save();
      return NextResponse.json({ success: true, message: "Order status updated" });
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
