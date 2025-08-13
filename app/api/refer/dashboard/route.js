import connectDB from '@/config/db';
import ReferralApplicant from '@/models/ReferralApplicant';
import Purchase from '@/models/ReferralPurchase';
import WithdrawalRequest from '@/models/withdrawalRequest';

export async function POST(request) {
  await connectDB();

  try {
    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode) {
      return new Response(
        JSON.stringify({ success: false, message: 'Referral code required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = await ReferralApplicant.findOne({ referralCode, status: 'approved' });
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, message: 'Unauthorized or user not approved' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch purchases with this referral code
    const purchases = await Purchase.find({ referralCode: user.referralCode });

    // Sum up total earnings (10% commission)
    const totalEarnings = purchases.reduce((sum, p) => sum + (p.amount || 0) * 0.1, 0);

    // Fetch withdrawals with relevant status
    const withdrawals = await WithdrawalRequest.find({
      referralCode: user.referralCode,
      status: { $in: ['pending', 'paid'] },
    });

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

    // Optionally: calculate lifetimeEarnings differently or just set equal
    const lifetimeEarnings = totalEarnings;

    // Debug log
    console.log(`Referral Dashboard Data for ${user.referralCode}`, {
      totalEarnings,
      totalWithdrawn,
      purchasesCount: purchases.length,
      withdrawalsCount: withdrawals.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        name: user.name,
        referralCode: user.referralCode,
        totalEarnings,
        totalWithdrawn,
        lifetimeEarnings,
        purchases,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in referral dashboard API:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
