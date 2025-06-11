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

    // 1. Get orders (no filter shown here, you can add seller/user filter)
    const orders = await Order.find({}).lean();

    // 2. Extract all address IDs safely (fix here)
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

    // 3. Fetch all addresses for those IDs
    const addresses = await Address.find({ _id: { $in: addressIds } }).lean();

    // 4. Map for lookup
    const addressMap = new Map(addresses.map(addr => [addr._id.toString(), addr]));

    // 5. Extract product IDs from all orders
    const productIds = [
      ...new Set(
        orders.flatMap(order =>
          order.items.map(item => item.productId?.toString()).filter(Boolean)
        )
      ),
    ];

    // 6. Fetch products
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    // 7. Product lookup map
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    // 8. Attach address and product objects
    const enrichedOrders = orders.map(order => ({
      ...order,
      address:
        addressMap.get(
          typeof order.address === "string"
            ? order.address
            : order.address?._id?.toString()
        ) || null,
      items: order.items.map(item => ({
        ...item,
        product: productMap.get(item.productId?.toString()) || null,
      })),
    }));

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
