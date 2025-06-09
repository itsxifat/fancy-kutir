import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true
    },
    items: [{
        productId: { type: String, required: true },
        quantity: { type: Number, required: true },
    }],
    amount: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    status:{
        type: String,
        required: true
    }
});

const Order = mongoose.models.order || mongoose.model("order", orderSchema);

export default Order;