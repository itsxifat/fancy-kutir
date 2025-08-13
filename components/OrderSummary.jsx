'use client';

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

const OrderSummary = () => {
  const router = useRouter();
  const {
    currency,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [referralCode, setReferralCode] = useState("");
  const [approvedReferralCodes, setApprovedReferralCodes] = useState([]);
  const [paymentType, setPaymentType] = useState("cod"); // 'cod' or 'full'

  const fetchUserAddresses = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/user/get-address", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        } else {
          toast.error("No addresses found. Please add an address.");
        }
      }
    } catch (error) {
      console.error("Failed to fetch user addresses:", error);
    }
  };

  const fetchApprovedReferralCodes = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/referral/approved-codes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setApprovedReferralCodes(data.codes);
      }
    } catch (error) {
      console.error("Failed to fetch approved referral codes:", error);
    }
  };

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const handleProceedToPayment = async () => {
    if (!selectedAddress) return toast.error("Please select an address.");

    let cartItemsArray = Object.entries(cartItems)
      .map(([product, quantity]) => ({ product, quantity }))
      .filter((item) => item.quantity > 0);

    if (cartItemsArray.length === 0) {
      return toast.error("Your cart is empty.");
    }

    const trimmedCode = referralCode.trim();
    if (trimmedCode && !approvedReferralCodes.includes(trimmedCode)) {
      return toast.error("Invalid referral code. Please enter a valid one or leave it empty.");
    }

    const totalAmount = getCartAmount();
    const paidAmount = paymentType === "cod" ? 100 : totalAmount;
    const dueAmount = paymentType === "cod" ? totalAmount - 100 : 0;

    const tempOrder = {
      address: selectedAddress,
      items: cartItemsArray,
      referralCode: trimmedCode || null,
      paymentType,
      paidAmount,
      dueAmount,
    };

    localStorage.setItem("tempOrder", JSON.stringify(tempOrder));
    router.push("/payment");
  };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
      fetchApprovedReferralCodes();
    }
  }, [user]);

  const totalAmount = getCartAmount();
  const paidAmount = paymentType === "cod" ? 100 : totalAmount;
  const dueAmount = paymentType === "cod" ? totalAmount - 100 : 0;

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5 rounded-md">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700 mb-4">Order Summary</h2>
      <hr className="border-gray-500/30 mb-5" />

      <div className="space-y-6">
        {/* Address Dropdown */}
        <div>
          <label className="block mb-2 text-gray-600">Select Address</label>
          <div className="relative border text-sm rounded-md">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2 bg-white text-left text-gray-700 rounded-md"
            >
              {selectedAddress
                ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                : "Select Address"}
            </button>
            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5 rounded-md max-h-48 overflow-auto">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city}, {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center font-semibold"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Referral Code */}
        <div>
          <label htmlFor="referralCode" className="block mb-2 text-gray-600">
            Referral Code (optional)
          </label>
          <input
            id="referralCode"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
            className="w-full border border-gray-300 rounded px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-600"
          />
        </div>

        {/* Payment Options */}
        <div>
          <label className="block mb-2 text-gray-600">Payment Method</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="cod"
                checked={paymentType === "cod"}
                onChange={() => setPaymentType("cod")}
              />
              <span>Cash on Delivery (Pay ৳100 now, rest on delivery)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="full"
                checked={paymentType === "full"}
                onChange={() => setPaymentType("full")}
              />
              <span>Full Paid (Pay full amount now)</span>
            </label>
          </div>
        </div>

        <hr className="border-gray-500/30" />

        {/* Summary */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Items ({getCartCount()})</span>
            <span className="text-gray-800">{currency}{totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Shipping</span>
            <span className="text-gray-800">Free</span>
          </div>
          <div className="flex justify-between border-t pt-3 font-semibold text-base">
            <span>Total</span>
            <span>{currency}{totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>You'll Pay Now</span>
            <span className="text-green-600 font-medium">{currency}{paidAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>Due on Delivery</span>
            <span className="text-red-600 font-medium">{currency}{dueAmount}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleProceedToPayment}
        className="w-full bg-orange-600 text-white py-3 mt-5 rounded hover:bg-orange-700 transition"
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default OrderSummary;
