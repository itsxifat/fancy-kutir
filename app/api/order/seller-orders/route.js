import connectDB from "@/config/db";
import Address from "@/models/address";
import Order from "@/models/order";
import Product from "@/models/product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    // 1. Fetch all orders
    const orders = await Order.find({}).lean();

    // 2. Extract all address IDs safely
    const addressIds = [
      ...new Set(
        orders
          .map(order => {
            if (typeof order.address === "string") return order.address;
            if (order.address && typeof order.address === "object" && order.address._id) {
              return order.address._id.toString();
            }
            return null;
          })
          .filter(Boolean)
      ),
    ];

    // 3. Fetch all addresses
    const addresses = await Address.find({ _id: { $in: addressIds } }).lean();
    const addressMap = new Map(addresses.map(addr => [addr._id.toString(), addr]));

    // 4. Extract all product IDs from orders
    const productIds = [
      ...new Set(
        orders.flatMap(order =>
          order.items.map(item => item.product?.toString()).filter(Boolean)
        )
      ),
    ];

    // 5. Fetch all products
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // 6. Enrich orders with product details and calculate amounts
    const enrichedOrders = orders.map(order => {
      const enrichedItems = order.items.map(item => {
        const product = productMap.get(item.product?.toString()) || null;
        return {
          ...item,
          product,
        };
      });

      const amount = enrichedItems.reduce((sum, item) => {
        const price = item.product?.offerPrice ?? item.product?.price ?? 0;
        return sum + item.quantity * price;
      }, 0);

      const paidAmount = order.paidAmount ?? 0;
      const dueAmount = order.dueAmount ?? (amount - paidAmount);

      return {
        ...order,
        address:
          addressMap.get(
            typeof order.address === "string"
              ? order.address
              : order.address?._id?.toString()
          ) || null,
        items: enrichedItems,
        amount,
        paidAmount,
        dueAmount,
      };
    });

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
