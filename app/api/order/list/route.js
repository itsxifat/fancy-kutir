import connectDB from "@/config/db";
import Order from "@/models/order";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    await connectDB();

    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch orders with product populated
    const orders = await Order.find({ userId })
      .populate("items.product", "name price offerPrice")
      .lean();

    // Enrich orders with total amount, paidAmount, and dueAmount
    const enrichedOrders = orders.map(order => {
      const amount = order.items.reduce((sum, item) => {
        const price =
          item.product?.offerPrice ?? item.product?.price ?? 0;
        return sum + item.quantity * price;
      }, 0);

      return {
        ...order,
        amount, // total amount based on product prices
        paidAmount: order.paidAmount ?? 0,
        dueAmount: order.dueAmount ?? 0,
      };
    });

    return NextResponse.json({
      success: true,
      orders: enrichedOrders.reverse(), // newest orders first
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
