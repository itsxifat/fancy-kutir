import { NextResponse } from "next/server";
import axios from "axios";

// ✅ Securely stored API keys
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY;

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      invoice,
      recipient_name,
      recipient_phone,
      recipient_address,
      cod_amount,
      note,
      item_description,
      delivery_type,
    } = body;

    const response = await axios.post(
      "https://portal.packzy.com/api/v1/create_order",
      {
        invoice,
        recipient_name,
        recipient_phone,
        recipient_address,
        cod_amount,
        note,
        item_description,
        delivery_type,
      },
      {
        headers: {
          "Api-Key": STEADFAST_API_KEY,
          "Secret-Key": STEADFAST_SECRET_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Steadfast API Error:", error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, error: error?.response?.data || error.message },
      { status: 500 }
    );
  }
}
