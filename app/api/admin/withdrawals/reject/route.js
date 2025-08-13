import connectDB from '@/config/db';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function POST(request) {
  await connectDB();

  try {
    const { id } = await request.json();
    if (!id) return new Response('Missing withdrawal request ID', { status: 400 });

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) return new Response('Withdrawal request not found', { status: 404 });
    if (withdrawal.status !== 'pending')
      return new Response('Cannot reject non-pending request', { status: 400 });

    // Option 1: Delete request from DB
    await WithdrawalRequest.findByIdAndDelete(id);

    // Option 2: Or update status to rejected (if you want to keep history)
    // withdrawal.status = 'rejected';
    // await withdrawal.save();

    return new Response('Withdrawal rejected and deleted', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
