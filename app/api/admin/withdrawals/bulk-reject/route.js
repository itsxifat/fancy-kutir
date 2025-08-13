import connectDB from '@/config/db';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function POST(request) {
  await connectDB();

  try {
    const { requestIds } = await request.json();
    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return new Response('Request IDs required', { status: 400 });
    }

    await WithdrawalRequest.deleteMany({ _id: { $in: requestIds } });

    return new Response('Withdrawal requests deleted', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
