import connectDB from "@/config/db";
import Product from "@/models/product";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  await connectDB();

  try {
    const product = await Product.findById(params.id);

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        price: product.offerPrice || product.price, // use offerPrice if available
      },
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ success: false, message: "Invalid product ID" }, { status: 400 });
  }
}
