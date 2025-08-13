'use client';
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sentOrders, setSentOrders] = useState({});

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
      toast.error(error?.response?.data?.message || "Failed to fetch orders.");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!data.success) return toast.error(data.message || "Failed to update status");

      toast.success(data.message || "Status updated");

      const updatedOrders = orders.map((order) =>
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);

      if (newStatus === "reject") {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error updating order");
    }
  };

  const handleSteadfastShipment = async (order) => {
    try {
      const address = order.address;

      const payload = {
        invoice: order._id,
        recipient_name: address?.fullName || "N/A",
        recipient_phone: address?.phoneNumber || "",
        recipient_address: `${address?.area}, ${address?.city}, ${address?.state}`,
        cod_amount: order.dueAmount || 0,
        note: "Deliver ASAP",
        item_description: order.items
          .map((item) => `${item.product?.name || "Product"} x ${item.quantity}`)
          .join(", "),
        delivery_type: 0,
      };

      const res = await axios.post("/api/ship-order", payload);

      if (res.data?.status === 200) {
        toast.success("Order sent to Steadfast!");
        setSentOrders((prev) => ({ ...prev, [order._id]: true }));
      } else {
        toast.error("Failed to send to Steadfast");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error sending to Steadfast");
    }
  };

  // Filter orders by status first
  let filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  // Then filter by search term
  if (searchTerm.trim() !== "") {
    const lowerTerm = searchTerm.toLowerCase();
    filteredOrders = filteredOrders.filter((order) => {
      const searchStr = [
        order.address?.fullName,
        order.address?.area,
        order.address?.city,
        order.address?.state,
        order.address?.phoneNumber,
        order.paymentInfo?.method,
        order.paymentInfo?.number,
        order.paymentInfo?.transactionId,
        order.referralCode,
        new Date(order.date).toLocaleDateString(),
        order.items
          .map((item) => `${item.product?.name || ""} ${item.product?._id || ""}`)
          .join(" "),
        order._id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchStr.includes(lowerTerm);
    });
  }

  return (
    <div className="flex-1 h-screen overflow-scroll flex flex-col justify-between text-sm">
      {loading ? (
        <Loading />
      ) : (
        <div className="md:p-10 p-4 space-y-5">
          <h2 className="text-lg font-medium">Orders</h2>

          <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
            <div>
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

            <div className="mt-3 md:mt-0 flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by date, account, address, phone, product, etc."
                className="w-full border rounded p-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-10">No orders found.</p>
            ) : (
              filteredOrders.map((order, index) => (
                <div
                  key={order._id || index}
                  className="border border-gray-200 rounded-md p-4 grid grid-cols-1 md:grid-cols-6 gap-4 bg-white shadow-sm"
                >
                  {/* Product Info */}
                  <div className="flex gap-3">
                    <Image
                      className="w-16 h-16 object-cover shrink-0"
                      src={assets.box_icon}
                      alt="box_icon"
                      width={64}
                      height={64}
                    />
                    <div className="text-sm break-words">
                      <p className="font-semibold">
                        {order.items
                          .map((item) => `${item.product?.name || "Product"} x ${item.quantity}`)
                          .join(", ")}
                      </p>
                      <p className="text-gray-500 text-xs break-all">
                        {order.items
                          .map((item) => `${item.product?._id || "ID"} x ${item.quantity}`)
                          .join(", ")}
                      </p>
                      <p>Items: {order.items.length}</p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="text-sm break-words">
                    <p className="font-semibold">{order.address?.fullName || "No Name"}</p>
                    <p>{order.address?.area}</p>
                    <p>
                      {order.address?.city}, {order.address?.state}
                    </p>
                    <p>{order.address?.phoneNumber}</p>
                  </div>

                  {/* Referral */}
                  <div className="text-center text-sm flex flex-col justify-center">
                    <p className="font-semibold">Referral Code:</p>
                    <p>{order.referralCode || "N/A"}</p>
                  </div>

                  {/* Amounts */}
                  <div className="text-sm text-center flex flex-col justify-center font-medium">
                    <p>
                      Total: {currency}
                      {order.amount?.toFixed(2)}
                    </p>
                    <p className="text-green-600">
                      Paid: {currency}
                      {order.paidAmount?.toFixed(2)}
                    </p>
                    {order.dueAmount > 0 && (
                      <p className="text-red-600">
                        Due: {currency}
                        {order.dueAmount?.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="text-sm break-words">
                    <p>Method: {order.paymentInfo?.method}</p>
                    <p>Account: {order.paymentInfo?.number}</p>
                    <p>TrxId: {order.paymentInfo?.transactionId}</p>
                    <p>Date: {new Date(order.date).toLocaleDateString()}</p>
                    <p>
                      Payment:{" "}
                      {order.status === "pending"
                        ? "Pending"
                        : order.status === "approved"
                        ? "Approved"
                        : "Rejected"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 justify-center text-sm">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="border rounded p-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="reject">Reject</option>
                    </select>

                    {order.status === "approved" && (
                      <>
                        {sentOrders[order._id] ? (
                          <span className="text-green-600 font-semibold text-center">
                            Sent to Steadfast
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSteadfastShipment(order)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition w-full"
                          >
                            Send COD ৳{order.dueAmount?.toFixed(2)}
                          </button>
                        )}
                      </>
                    )}
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
