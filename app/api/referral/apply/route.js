import connectDB from "@/config/db";
import ReferralApplicant from "@/models/ReferralApplicant";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid"; // Use UUID for unique referralId

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email = "", mobile = "", referralCode, profileLink, password } = body;

    // Validation: required fields
    if (!name || !referralCode || !profileLink || !password) {
      return NextResponse.json(
        { success: false, message: "Required fields missing." },
        { status: 400 }
      );
    }

    // Check if referralCode or referralId already exists (unique fields)
    const existingCode = await ReferralApplicant.findOne({ referralCode });
    if (existingCode) {
      return NextResponse.json(
        { success: false, message: "Referral code already in use." },
        { status: 409 }
      );
    }

    // Generate unique referralId
    let referralId;
    let existingId;
    do {
      referralId = uuidv4();
      existingId = await ReferralApplicant.findOne({ referralId });
    } while (existingId);

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new referral applicant document
    const newApplicant = await ReferralApplicant.create({
      name,
      email,
      mobile,
      referralCode,
      profileLink,
      password: hashedPassword,
      referralId,
    });

    return NextResponse.json({
      success: true,
      message: "Referral application submitted successfully.",
      applicantId: newApplicant._id,
      referralId: newApplicant.referralId,
    });
  } catch (error) {
    console.error("Referral Apply Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}
