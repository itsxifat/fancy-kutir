import mongoose from 'mongoose';

const ReferralPurchaseSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    referralCode: { type: String, required: true },
    buyer: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ReferralPurchaseSchema.index({ orderId: 1 });

export default mongoose.models.ReferralPurchase ||
  mongoose.model('ReferralPurchase', ReferralPurchaseSchema);
