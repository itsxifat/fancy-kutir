import connectDB from "@/config/db";
import ReferralApplicant from "@/models/ReferralApplicant";

export async function GET() {
  await connectDB();

  try {
    const applicants = await ReferralApplicant.find()
      .select("-__v -password") // exclude internal fields & password
      .sort({ createdAt: -1 })
      .lean();

    return new Response(JSON.stringify(applicants), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to fetch applicants", { status: 500 });
  }
}
