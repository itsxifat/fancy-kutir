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
        return NextResponse.json({ success: false }, { status: 403 });
    }

    await connectDB();


    // 1. Get orders for user (address field contains address _id)
    const orders = await Order.find({  }).lean();

    // 2. Extract all address IDs from orders
    const addressIds = [...new Set(orders.map(order => order.address.toString()))];

    // 3. Fetch all addresses for those IDs
    const addresses = await Address.find({ _id: { $in: addressIds } }).lean();

    // 4. Create a map for quick lookup by addressId
    const addressMap = new Map(addresses.map(addr => [addr._id.toString(), addr]));

    // 5. Extract all productIds from all orders
    const productIds = [
      ...new Set(
        orders.flatMap(order =>
          order.items.map(item => item.productId?.toString()).filter(Boolean)
        )
      ),
    ];

    // 6. Fetch all products for those productIds
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    // 7. Create product map
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // 8. Attach address object & product info to each order
    const enrichedOrders = orders.map(order => {
      return {
        ...order,
        address: addressMap.get(order.address.toString()) || null,
        items: order.items.map(item => ({
          ...item,
          product: productMap.get(item.productId?.toString()) || null,
        })),
      };
    });

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
