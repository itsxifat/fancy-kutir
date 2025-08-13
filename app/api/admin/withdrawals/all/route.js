import connectDB from '@/config/db';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function GET() {
  await connectDB();
  try {
    const requests = await WithdrawalRequest.find().sort({ requestedAt: -1 });
    return new Response(JSON.stringify(requests), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response('Failed to fetch withdrawal requests', { status: 500 });
  }
}
