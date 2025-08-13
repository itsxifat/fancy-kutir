import connectDB from "@/config/db";
import ReferralApplicant from "@/models/ReferralApplicant";

export async function POST(request) {
  await connectDB();

  try {
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Response("No userIds provided", { status: 400 });
    }

    // Only delete those with status pending (safe check)
    await ReferralApplicant.deleteMany({
      _id: { $in: userIds },
      status: "pending",
    });

    return new Response(
      JSON.stringify({ message: "Applicants bulk rejected and deleted" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response("Failed to bulk reject applicants", { status: 500 });
  }
}
