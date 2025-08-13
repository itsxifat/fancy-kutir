import mongoose from "mongoose";

const ReferralProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  referralCode: { type: String, unique: true },
  masterKey: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ReferralProfile || mongoose.model("ReferralProfile", ReferralProfileSchema);

