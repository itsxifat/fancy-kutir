import connectDB from "@/config/db";
import ReferralApplicant from "@/models/ReferralApplicant";

export async function POST(request) {
  await connectDB();

  try {
    const { userId } = await request.json();

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const applicant = await ReferralApplicant.findById(userId);

    if (!applicant) {
      return new Response("Applicant not found", { status: 404 });
    }

    if (applicant.status !== "pending") {
      return new Response("Applicant already processed", { status: 400 });
    }

    // Instead of setting status to rejected, delete applicant
    await ReferralApplicant.findByIdAndDelete(userId);

    return new Response(
      JSON.stringify({ message: "Applicant rejected and deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response("Failed to reject applicant", { status: 500 });
  }
}
