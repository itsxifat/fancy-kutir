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
  const [products, setProducts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(null);
  const { getToken, setCartItems } = useAppContext();
  const router = useRouter();

  const bkashNumber = "01963949880";

  const copyBkashNumber = () => {
    navigator.clipboard.writeText(bkashNumber)
      .then(() => toast.success("Bkash number copied!"))
      .catch(() => toast.error("Failed to copy number"));
  };

  const calculateTotal = async (items) => {
    try {
      const fetchedProducts = await Promise.all(
        items.map(async (item) => {
          const productId = item.productId || item.product;
          const quantity = item.quantity;

          const { data } = await axios.get(`/api/product/${productId}`);
          if (data.success && data.product) {
            return {
              name: data.product.name,
              price: data.product.price,
              quantity,
              subtotal: data.product.price * quantity,
            };
          }
          return null;
        })
      );

      const validProducts = fetchedProducts.filter(Boolean);
      setProducts(validProducts);

      const total = validProducts.reduce((sum, p) => sum + p.subtotal, 0);
      setTotalAmount(total);
    } catch (err) {
      console.error(err);
      toast.error("Error calculating total amount.");
    }
  };

  useEffect(() => {
    const orderData = localStorage.getItem("tempOrder");
    if (!orderData) {
      toast.error("No order data found.");
      router.push("/");
      return;
    }

    const parsedOrder = JSON.parse(orderData);
    setTempOrder(parsedOrder);

    if (parsedOrder.items?.length) {
      calculateTotal(parsedOrder.items);
    }
  }, [router]);

  const handlePay = async () => {
    if (!number || !transactionId) {
      return toast.error("Please fill all payment fields.");
    }

    if (!/^01[3-9]\d{8}$/.test(number)) {
      return toast.error("Enter a valid Bkash number.");
    }

    if (transactionId.length < 6) {
      return toast.error("Transaction ID seems too short.");
    }

    if (!tempOrder?.items?.length || !tempOrder?.address) {
      return toast.error("Invalid order data.");
    }

    try {
      const token = await getToken();

      const fixedItems = tempOrder.items.map(item => ({
        product: item.productId || item.product,
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
        // Facebook Pixel AddToCart event
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq('track', 'AddToCart', {
            value: totalAmount,
            currency: 'BDT',
            contents: fixedItems.map(item => ({
              id: item.product,
              quantity: item.quantity,
            })),
            content_type: 'product',
          });
        }

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
    <div className="flex flex-col items-center text-center pt-10 pb-14 min-h-screen bg-white">
      <h1 className="md:text-4xl text-2xl font-medium mb-2">Make Payment</h1>
      <p className="md:text-base text-gray-500 pb-4">
        Send money using Bkash to{" "}
        <span
          onClick={copyBkashNumber}
          className="text-orange-600 font-semibold cursor-pointer hover:underline active:scale-95 transition"
        >
          {bkashNumber}
        </span>
      </p>

      {products.length > 0 && (
        <div className="w-full max-w-2xl text-left bg-gray-50 p-4 rounded shadow mb-4">
          <h2 className="text-lg font-semibold mb-3 text-center">Order Summary</h2>
          {products.map((p, index) => (
            <div key={index} className="flex justify-between py-1 border-b border-gray-200">
              <span>{p.quantity} × {p.name}</span>
              <span>৳{p.subtotal}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-lg mt-4">
            <span>Total:</span>
            <span className="text-orange-600">৳{totalAmount}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 w-[90%] max-w-xl">
        <input
          type="number"
          placeholder="Your Bkash Number"
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
          className="bg-orange-600 text-white py-2 rounded hover:bg-orange-700 font-medium"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default Payment;
