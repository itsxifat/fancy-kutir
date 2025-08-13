import connectDB from "@/config/db";
import ReferralApplicant from "@/models/ReferralApplicant";

export async function POST(req) {
  await connectDB();
  const { userId } = await req.json();

  if (!userId) {
    return new Response("Missing userId", { status: 400 });
  }

  const applicant = await ReferralApplicant.findById(userId);
  if (!applicant) {
    return new Response("Applicant not found", { status: 404 });
  }
  if (applicant.status !== "pending") {
    return new Response("Applicant is not pending", { status: 400 });
  }

  applicant.status = "approved";
  await applicant.save();

  return new Response(JSON.stringify({ message: "Approved" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
