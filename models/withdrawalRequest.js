import mongoose from 'mongoose';

const WithdrawalRequestSchema = new mongoose.Schema(
  {
    referralCode: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    accountNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'rejected'], default: 'pending' },
    requestedAt: { type: Date, default: Date.now },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.WithdrawalRequest ||
  mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
