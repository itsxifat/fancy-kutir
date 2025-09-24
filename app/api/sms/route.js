import connectDB from '@/config/db';
import Sms from '@/models/Sms';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { phone, amount, trxId } = await req.json();

    if (!phone || !amount || !trxId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    const sms = await Sms.create({ phone, amount, trxId });

    return NextResponse.json({ success: true, sms }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
