import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Enables populate("items.product")
        required: true,
      },
      quantity: { type: Number, required: true },
    },
  ],
  amount: { type: Number, required: true }, // total amount
  paidAmount: { type: Number, default: 0 }, // how much paid
  dueAmount: { type: Number, default: 0 }, // remaining
  address: {
    type: Object,
    required: true,
  },
  paymentInfo: {
    number: { type: String, required: true },
    transactionId: { type: String, required: true },
    method: { type: String, default: "Bkash" },
  },
  status: { type: String, default: "pending" },
  date: { type: Date, default: Date.now },
  referralCode: { type: String, default: null },
});

// Backward compatibility: create virtual "productId"
orderSchema.virtual("items.productId")
  .get(function () {
    return this.items?.map(item => item.product?.toString?.());
  });

// Optional: Enable virtuals in JSON output (if needed)
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
