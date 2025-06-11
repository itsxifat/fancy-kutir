'use client';

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

const Payment = () => {
  const [number, setNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [tempOrder, setTempOrder] = useState(null);
  const { getToken, setCartItems } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    const orderData = localStorage.getItem("tempOrder");
    if (orderData) {
      setTempOrder(JSON.parse(orderData));
    } else {
      toast.error("No order data found.");
      router.push("/");
    }
  }, [router]);

  const handlePay = async () => {
    if (!number || !transactionId) {
      return toast.error("Please fill all payment fields.");
    }

    if (!tempOrder?.items?.length || !tempOrder?.address) {
      return toast.error("Invalid order data.");
    }

    try {
      const token = await getToken();

      const fixedItems = tempOrder.items.map(item => ({
        product: item.productId || item.product, // covers both naming styles
        quantity: item.quantity,
      }));

      const { data } = await axios.post(
        "/api/order/create",
        {
          address: tempOrder.address,
          items: fixedItems,
          paymentInfo: {
            number,
            transactionId,
            method: "Bkash",
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.success) {
        toast.success("Order placed successfully!");
        localStorage.removeItem("tempOrder");
        setCartItems({});
        router.push("/order-placed");
      } else {
        toast.error(data.message || "Order failed.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center pt-8 pb-14 h-screen">
      <h1 className="md:text-4xl text-2xl font-medium">Make Payment</h1>
      <p className="md:text-base text-gray-500/80 pb-8">
        Send money using Bkash to 01963949880
      </p>

      <div className="flex flex-col gap-4 w-[60%] max-w-xl">
        <input
          type="number"
          placeholder="Your Number"
          className="border border-gray-300 rounded p-2 text-center"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <input
          type="text"
          placeholder="Transaction ID"
          className="border border-gray-300 rounded p-2 text-center"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
        />
        <button
          onClick={handlePay}
          className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
        >
          Pay
        </button>
      </div>
    </div>
  );
};

export default Payment;
