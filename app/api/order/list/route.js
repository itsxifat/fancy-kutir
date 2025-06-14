import connectDB from "@/config/db";
import Address from "@/models/address";
import Order from "@/models/order";
import Product from "@/models/product";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    await connectDB();

    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const orders = await Order.find({ userId }).lean();

    const addressIds = [
      ...new Set(
        orders
          .map((order) => {
            const id = order.address;
            return typeof id === "object" && id?._id ? id._id.toString() : id?.toString();
          })
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
      ),
    ];

    const addresses = await Address.find({ _id: { $in: addressIds } }).lean();
    const addressMap = new Map(addresses.map((addr) => [addr._id.toString(), addr]));

    const productIds = [
      ...new Set(
        orders
          .flatMap((order) =>
            order.items.map((item) => item.productId?.toString()).filter((id) => mongoose.Types.ObjectId.isValid(id))
          )
      ),
    ];

    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const enrichedOrders = orders.map((order) => {
      const enrichedItems = order.items.map((item) => {
        const product = productMap.get(item.productId?.toString()) || null;
        return {
          ...item,
          product,
        };
      });

      const amount = enrichedItems.reduce((sum, item) => {
        const price = item.product?.offerPrice ?? item.product?.price ?? 0;
        return sum + item.quantity * price;
      }, 0);

      return {
        ...order,
        address: addressMap.get(order.address?.toString()) || null,
        items: enrichedItems,
        amount,
      };
    });

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
