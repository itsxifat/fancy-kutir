import mongoose from "mongoose";

const ReferralApplicantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    mobile: { type: String, default: "" },
    referralCode: { type: String, required: true, unique: true },
    profileLink: { type: String, required: true },
    password: { type: String, required: true },
    referralId: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.models.ReferralApplicant ||
  mongoose.model("ReferralApplicant", ReferralApplicantSchema);
