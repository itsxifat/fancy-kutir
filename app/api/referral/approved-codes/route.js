import connectDB from '@/config/db';
import ReferralApplicant from '@/models/ReferralApplicant';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import User from '@/models/user';

export async function GET(req) {
  try {
    await connectDB();

    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const approvedApplicants = await ReferralApplicant.find({ status: 'approved' }).select('referralCode');

    const codes = approvedApplicants.map(applicant => applicant.referralCode);

    return NextResponse.json({ success: true, codes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
