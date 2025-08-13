import connectDB from '@/config/db';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function POST(request) {
  await connectDB();

  try {
    const { id } = await request.json();
    if (!id) {
      return new Response('ID is required', { status: 400 });
    }

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return new Response('Withdrawal request not found', { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return new Response('Withdrawal request already processed', { status: 400 });
    }

    withdrawal.status = 'paid'; // <-- Use 'paid' instead of 'approved'
    withdrawal.paidAt = new Date();

    await withdrawal.save();

    return new Response('Withdrawal approved', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
