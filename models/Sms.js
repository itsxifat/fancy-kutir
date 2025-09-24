import mongoose from 'mongoose';

const SmsSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  amount: { type: String, required: true },
  trxId: { type: String, required: true },
  receivedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Sms || mongoose.model('Sms', SmsSchema);
