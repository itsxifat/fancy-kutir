'use client';
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Loading from "@/components/Loading";
import toast from "react-hot-toast";
import axios from "axios";

const MyOrders = () => {
  const { currency, getToken, user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/order/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setOrders(data.orders.reverse());
      } else {
        toast.error(data.message || "Failed to fetch orders.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      const message =
        error?.response?.data?.message || error?.message || "Failed to fetch orders.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  return (
    <>
      <Navbar />
      <div className="flex flex-col justify-between px-6 md:px-16 lg:px-32 py-6 min-h-screen">
        <div className="space-y-5">
          <h2 className="text-lg font-medium mt-6">My Orders</h2>
          {loading ? (
            <Loading />
          ) : (
            <div className="max-w-5xl border-t border-gray-300 text-sm">
              {orders.length === 0 ? (
                <p className="py-6 text-gray-500">You have no orders yet.</p>
              ) : (
                orders.map((order, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-5 justify-between p-5 border-b border-gray-300"
                  >
                    {/* Product info */}
                    <div className="flex-1 flex gap-5 max-w-80">
                      <Image
                        className="max-w-16 max-h-16 object-cover"
                        src={assets.box_icon}
                        alt="box_icon"
                      />
                      <div className="flex flex-col gap-3">
                        <span className="font-medium text-base">
                          {order.items
                            .map(
                              (item) =>
                                `${item.product?.name || "Product not found"} x ${item.quantity}`
                            )
                            .join(", ")}
                        </span>
                        <span>Items: {order.items.length}</span>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <p>
                        <span className="font-medium">
                          {order.address?.fullName || "No Name"}
                        </span>
                        <br />
                        <span>{order.address?.area || ""}</span>
                        <br />
                        <span>
                          {[order.address?.city, order.address?.state]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                        <br />
                        <span>{order.address?.phoneNumber || "No phone"}</span>
                      </p>
                    </div>

                    {/* Amount */}
                    <p className="font-medium my-auto whitespace-nowrap">
                      {currency}
                      {order.amount?.toFixed(2)}
                    </p>

                    {/* Payment Info */}
                    <div>
                      <p className="flex flex-col">
                        <span>Method: {order.paymentInfo?.method || "N/A"}</span>
                        {order.paymentInfo?.transactionId && (
                          <span>Transaction ID: {order.paymentInfo.transactionId}</span>
                        )}
                        <span>
                          Date:{" "}
                          {new Date(order.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>
                          Payment:{" "}
                          {order.status === "pending" ? "Pending" : "Completed"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyOrders;
