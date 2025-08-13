import connectDB from '@/config/db';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function POST(request) {
  await connectDB();

  try {
    const { referralCode } = await request.json();
    if (!referralCode) return new Response('Referral code required', { status: 400 });

    const withdrawals = await WithdrawalRequest.find({ referralCode }).sort({ requestedAt: -1 });

    return new Response(JSON.stringify(withdrawals), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
