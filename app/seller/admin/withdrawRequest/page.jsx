"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function WithdrawApprovalPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Fetch all withdrawal requests
  const fetchRequests = async () => {
    try {
      const { data } = await axios.get("/api/admin/withdrawals/all");
      setRequests(data);
    } catch (error) {
      alert("Failed to load withdrawal requests");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Approve withdrawal request
  const approveRequest = async (id) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      await axios.post("/api/admin/withdrawals/approve", { id });
      toast.success("Withdrawal approved");
      fetchRequests();
      setSelectedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    } catch (error) {
      toast.error("Approval failed");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  // Reject (delete) withdrawal request with confirmation toast
  const rejectRequest = (id) => {
    if (processingId) return;

    toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <span>Confirm rejection (deletion) of this withdrawal request?</span>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.loading("Rejecting...", { id: t.id });
                setProcessingId(id);
                try {
                  await axios.post("/api/admin/withdrawals/reject", { id });
                  toast.success("Withdrawal request rejected and deleted", { id: t.id });
                  fetchRequests();
                  setSelectedIds((prev) => {
                    const copy = new Set(prev);
                    copy.delete(id);
                    return copy;
                  });
                } catch (err) {
                  toast.error("Reject failed", { id: t.id });
                  console.error(err);
                } finally {
                  setProcessingId(null);
                  toast.dismiss(t.id);
                }
              }}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
      }
    );
  };

  // Bulk reject selected requests with confirmation toast
  const bulkReject = () => {
    if (processingId) return;

    if (selectedIds.size === 0) {
      alert("Select requests first");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <span>Confirm rejection (deletion) of {selectedIds.size} withdrawal requests?</span>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.loading("Rejecting...", { id: t.id });
                setProcessingId("bulk");
                try {
                  await axios.post("/api/admin/withdrawals/bulk-reject", {
                    ids: Array.from(selectedIds),
                  });
                  toast.success("Withdrawal requests rejected and deleted", { id: t.id });
                  fetchRequests();
                  setSelectedIds(new Set());
                } catch (err) {
                  toast.error("Bulk reject failed", { id: t.id });
                  console.error(err);
                } finally {
                  setProcessingId(null);
                  toast.dismiss(t.id);
                }
              }}
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Confirm
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        position: "top-center",
      }
    );
  };

  // Select/deselect requests
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-3xl font-semibold mb-6">Withdrawal Requests</h1>

      <div className="mb-4">
        <button
          onClick={bulkReject}
          disabled={processingId === "bulk"}
          className={`px-6 py-2 rounded-md text-white font-semibold ${
            processingId === "bulk"
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {processingId === "bulk" ? "Rejecting..." : "Bulk Reject Selected"}
        </button>
      </div>

      {loading ? (
        <p>Loading withdrawal requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-600">No withdrawal requests found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-md shadow overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border-b border-gray-300">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(new Set(requests.map((r) => r._id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    checked={selectedIds.size === requests.length && requests.length > 0}
                  />
                </th>
                <th className="p-3 border-b border-gray-300 text-left">Referral Code</th>
                <th className="p-3 border-b border-gray-300 text-left">Payment Method</th>
                <th className="p-3 border-b border-gray-300 text-left">Account Number</th>
                <th className="p-3 border-b border-gray-300 text-left">Amount (৳)</th>
                <th className="p-3 border-b border-gray-300 text-left">Status</th>
                <th className="p-3 border-b border-gray-300 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req._id}
                  className={`border-b border-gray-200 ${
                    selectedIds.has(req._id) ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(req._id)}
                      onChange={() => toggleSelect(req._id)}
                      disabled={req.status !== "pending"}
                    />
                  </td>
                  <td className="p-3">{req.referralCode}</td>
                  <td className="p-3">{req.paymentMethod}</td>
                  <td className="p-3">{req.accountNumber}</td>
                  <td className="p-3">{req.amount.toFixed(2)}</td>
                  <td
                    className={`p-3 font-semibold ${
                      req.status === "pending"
                        ? "text-yellow-600"
                        : req.status === "approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {req.status}
                  </td>
                  <td className="p-3 text-center space-x-2">
                    {req.status === "pending" ? (
                      <>
                        <button
                          disabled={processingId === req._id}
                          onClick={() => approveRequest(req._id)}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          {processingId === req._id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          disabled={processingId === req._id}
                          onClick={() => rejectRequest(req._id)}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          {processingId === req._id ? "Rejecting..." : "Reject"}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
