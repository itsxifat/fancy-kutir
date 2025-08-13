import connectDB from '@/config/db';
import ReferralApplicant from '@/models/ReferralApplicant';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await connectDB();

    const { referralCode, password } = await req.json();

    if (!referralCode || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Referral code and password are required' }),
        { status: 400 }
      );
    }

    // Find approved applicant by referralCode (case-sensitive)
    const applicant = await ReferralApplicant.findOne({
      referralCode,
      status: 'approved',
    });

    if (!applicant) {
      return new Response(
        JSON.stringify({ success: false, message: 'Referral code not found or not approved' }),
        { status: 404 }
      );
    }

    // Compare password (assuming hashed in DB)
    const isMatch = await bcrypt.compare(password, applicant.password);

    if (!isMatch) {
      return new Response(
        JSON.stringify({ success: false, message: 'Incorrect password' }),
        { status: 401 }
      );
    }

    // Login success — return referralCode and any user info needed
    return new Response(
      JSON.stringify({
        success: true,
        referralCode: applicant.referralCode,
        name: applicant.name,
        email: applicant.email,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Referral login error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500 }
    );
  }
}
