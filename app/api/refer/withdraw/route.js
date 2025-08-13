import connectDB from '@/config/db';
import ReferralApplicant from '@/models/ReferralApplicant';
import Purchase from '@/models/ReferralPurchase';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function POST(request) {
  await connectDB();

  try {
    const { referralCode, paymentMethod, accountNumber, amount } = await request.json();

    if (!referralCode || !paymentMethod || !accountNumber || !amount) {
      return new Response('Missing required fields', { status: 400 });
    }

    const user = await ReferralApplicant.findOne({ referralCode, status: 'approved' });
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Calculate total earnings from purchases
    const purchases = await Purchase.find({ referralCode });
    const totalEarnings = purchases.reduce((sum, p) => sum + p.amount * 0.1, 0);

    // Calculate total amount already withdrawn (sum of all approved or pending withdrawals)
    const withdrawals = await WithdrawalRequest.find({ referralCode });
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Calculate available balance for withdrawal
    const availableBalance = totalEarnings - totalWithdrawn;

    if (amount > availableBalance) {
      return new Response('Requested amount exceeds available balance', { status: 400 });
    }

    const withdrawal = new WithdrawalRequest({
      referralCode,
      paymentMethod,
      accountNumber,
      amount,
      status: 'pending',
      requestedAt: new Date(),
    });

    await withdrawal.save();

    return new Response('Withdrawal request submitted successfully', { status: 201 });
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
