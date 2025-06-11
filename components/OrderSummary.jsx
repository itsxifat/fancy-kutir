"use client";

import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import axios from "axios";

const OrderSummary = () => {
  const router = useRouter(); // ✅ only declared once

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

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const handleProceedToPayment = () => {
    if (!selectedAddress) {
      return toast.error("Please select an address.");
    }

    let cartItemsArray = Object.entries(cartItems)
      .map(([product, quantity]) => ({ product, quantity }))
      .filter((item) => item.quantity > 0);

    if (cartItemsArray.length === 0) {
      return toast.error("Your cart is empty.");
    }

    const tempOrder = {
      address: selectedAddress,
      items: cartItemsArray,
    };

    localStorage.setItem("tempOrder", JSON.stringify(tempOrder));
    router.push("/payment");
  };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user]);

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5">
      <h2 className="text-xl md:text-2xl font-medium text-gray-700">
        Order Summary
      </h2>
      <hr className="border-gray-500/30 my-5" />

      <div className="space-y-6">
        <div>
          <label className="block mb-2 text-gray-600">Select Address</label>
          <div className="relative border text-sm">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2 bg-white text-left text-gray-700"
            >
              {selectedAddress
                ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                : "Select Address"}
            </button>
            {isDropdownOpen && (
              <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                {userAddresses.map((address, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                    onClick={() => handleAddressSelect(address)}
                  >
                    {address.fullName}, {address.area}, {address.city},{" "}
                    {address.state}
                  </li>
                ))}
                <li
                  onClick={() => router.push("/add-address")}
                  className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                >
                  + Add New Address
                </li>
              </ul>
            )}
          </div>
        </div>

        <hr className="border-gray-500/30 my-5" />

        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="text-gray-600">Items ({getCartCount()})</p>
            <p className="text-gray-800">
              {currency}
              {getCartAmount()}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-gray-600">Shipping Fee</p>
            <p className="text-gray-800">Free</p>
          </div>
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
            <p>Total</p>
            <p>
              {currency}
              {getCartAmount()}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleProceedToPayment}
        className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700"
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default OrderSummary;
