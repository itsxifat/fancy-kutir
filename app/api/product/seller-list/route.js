import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authSeller from "@/lib/authSeller";
import connectDB from "@/config/db";
import Product from "@/models/product";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    await connectDB();
    const products = await Product.find({ }); // Only fetch the current seller’s products
    return NextResponse.json({ success: true, products }, { status: 200 });
      

    

  } catch (error) {
   return NextResponse.json({ success: false, error: error.message });
  }
}
