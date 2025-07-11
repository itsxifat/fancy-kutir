"use client";
import React, { useEffect, useState } from "react";
import { assets } from "@/assets/assets";
import Image from "next/image";
import { useAppContext } from "@/context/AppContext";
import Footer from "@/components/seller/Footer";
import Loading from "@/components/Loading";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";


const Orders = () => {
  const { isSeller, currency, getToken, user } = useAppContext();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (!isSeller) {
      router.replace("/");
    }
  }, [isSeller, router]);

  const fetchSellerOrders = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/order/seller-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setOrders(data.orders.reverse());
      } else {
        toast.error(data.message || "Failed to fetch orders.");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to fetch orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSellerOrders();
    }
  }, [user]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = await getToken();

      const { data } = await axios.post(
        "/api/order/update-status",
        { orderId, status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!data.success) {
        toast.error(data.message || "Failed to update order");
        return;
      }

      toast.success(data.message || "Order updated");

      if (newStatus === "approved") {
        const approvedOrder = orders.find((o) => o._id === orderId);
        const address = approvedOrder.address;

        const payload = {
          invoice: approvedOrder._id,
          recipient_name: address?.fullName || "N/A",
          recipient_phone: address?.phoneNumber || "",
          recipient_address: `${address?.area}, ${address?.city}, ${address?.state}`,
          cod_amount: approvedOrder.amount || 0,
          note: "Deliver ASAP",
          item_description: approvedOrder.items
            .map((item) => `${item.product?.name || "Product"} x ${item.quantity}`)
            .join(", "),
          delivery_type: 0,
        };

        const shipRes = await axios.post("/api/ship-order", payload);

        if (shipRes.data?.status === 200) {
          toast.success("Order sent to Steadfast!");
          console.log("Steadfast response:", shipRes.data);
        } else {
          toast.error("Failed to send to Steadfast");
          console.error("Steadfast error:", shipRes.data);
        }

        // Facebook Pixel events
        if (typeof window !== "undefined" && window.fbq) {

          // Purchase event
          window.fbq('track', 'Purchase', {
            value: approvedOrder.amount,
            currency: 'BDT',
            contents: approvedOrder.items.map(item => ({
              id: item.product?._id || '',
              quantity: item.quantity,
            })),
            content_type: 'product',
            transaction_id: approvedOrder.paymentInfo?.transactionId || '',
          });
        }
      }

      if (newStatus === "reject") {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
      } else {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Error updating order");
    }
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="md:p-10 p-4 space-y-5">
          <h2 className="text-lg font-medium">Orders</h2>

          <div className="mb-4">
            <label className="mr-2 font-medium">Filter by Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded p-1"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          <div className="max-w-4xl rounded-md">
            {filteredOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No orders found.</p>
            ) : (
              filteredOrders.map((order, index) => (
                <div
                  key={order._id || index}
                  className="flex flex-col md:flex-row gap-5 justify-between p-5 border-t border-gray-300"
                >
                  <div className="flex-1 flex gap-5 max-w-80">
                    <Image
                      className="max-w-16 max-h-16 object-cover"
                      src={assets.box_icon}
                      alt="box_icon"
                      width={64}
                      height={64}
                    />
                    <p className="flex flex-col gap-3">
                      <span className="font-medium">
                        {order.items
                          .map((item) => `${item.product?.name || "Product"} x ${item.quantity}`)
                          .join(", ")}
                      </span>
                      <span className="font-medium">
                        {order.items
                          .map((item) => `${item.product?._id || "ProductId"} x ${item.quantity}`)
                          .join(", ")}
                      </span>
                      <span>Items : {order.items.length}</span>
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-medium">{order.address?.fullName || "No Name"}</span>
                      <br />
                      <span>{order.address?.area || "No area"}</span>
                      <br />
                      <span>{`${order.address?.city || ""}, ${order.address?.state || ""}`}</span>
                      <br />
                      <span>{order.address?.phoneNumber || "No phone"}</span>
                    </p>
                  </div>
                  <p className="font-medium my-auto">
                    {currency}
                    {order.amount}
                  </p>
                  <div>
                    <p className="flex flex-col mb-2">
                      <span>Method : {order.paymentInfo?.method}</span>
                      <span>Account : {order.paymentInfo?.number}</span>
                      <span>TrxId : {order.paymentInfo?.transactionId}</span>
                      <span>Date : {new Date(order.date).toLocaleDateString()}</span>
                      <span>
                        Payment :{" "}
                        {order.status === "pending"
                          ? "Pending"
                          : order.status === "approved"
                          ? "Approved"
                          : order.status === "reject"
                          ? "Rejected"
                          : "Unknown"}
                      </span>
                    </p>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="reject">Reject</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Orders;
