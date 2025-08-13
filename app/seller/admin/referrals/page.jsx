"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function ReferralAdminPage() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchApplicants = async () => {
    try {
      const { data } = await axios.get("/api/admin/referrals/all");
      setApplicants(data);
    } catch (error) {
      alert("Failed to load applicants");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  // Reject with toast confirmation (single)
  const rejectApplicant = (userId) => {
    if (processingId) return;

    const toastId = toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <span>Confirm deletion of this applicant?</span>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.loading("Deleting...", { id: t.id });
                setProcessingId(userId);
                try {
                  await axios.post("/api/admin/referrals/reject", { userId });
                  toast.success("Applicant deleted", { id: t.id });
                  fetchApplicants();
                  setSelectedIds((prev) => {
                    const copy = new Set(prev);
                    copy.delete(userId);
                    return copy;
                  });
                } catch (err) {
                  toast.error("Delete failed", { id: t.id });
                  console.error(err);
                } finally {
                  setProcessingId(null);
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
        duration: 10000, // 10 seconds to respond
        position: "top-center",
      }
    );
  };

  // Bulk reject with toast confirmation
  const bulkReject = () => {
    if (processingId) return;

    if (selectedIds.size === 0) {
      alert("Select applicants first");
      return;
    }

    const toastId = toast(
      (t) => (
        <div className="flex flex-col space-y-2">
          <span>Confirm deletion of {selectedIds.size} applicants?</span>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.loading("Deleting...", { id: t.id });
                setProcessingId("bulk");
                try {
                  await axios.post("/api/admin/referrals/bulk-reject", {
                    userIds: Array.from(selectedIds),
                  });
                  toast.success("Applicants deleted", { id: t.id });
                  fetchApplicants();
                  setSelectedIds(new Set());
                } catch (err) {
                  toast.error("Bulk delete failed", { id: t.id });
                  console.error(err);
                } finally {
                  setProcessingId(null);
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

  const approveApplicant = async (userId) => {
    if (processingId) return;
    setProcessingId(userId);
    try {
      await axios.post("/api/admin/referrals/approve", { userId });
      toast.success("Applicant approved");
      fetchApplicants();
      setSelectedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(userId);
        return copy;
      });
    } catch (error) {
      toast.error("Approval failed");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSelect = (userId) => {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(userId)) copy.delete(userId);
      else copy.add(userId);
      return copy;
    });
  };

  return (
    <main className="flex-1 p-6 max-w-7xl mx-auto">
      <Toaster />
      <h1 className="text-3xl font-semibold mb-6">Referral Applications</h1>

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
        <p>Loading...</p>
      ) : applicants.length === 0 ? (
        <p className="text-gray-600">No referral applications found.</p>
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
                        setSelectedIds(new Set(applicants.map((a) => a._id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                    checked={selectedIds.size === applicants.length && applicants.length > 0}
                  />
                </th>
                <th className="p-3 border-b border-gray-300 text-left">Name</th>
                <th className="p-3 border-b border-gray-300 text-left">Email</th>
                <th className="p-3 border-b border-gray-300 text-left">Mobile</th>
                <th className="p-3 border-b border-gray-300 text-left">Referral Code</th>
                <th className="p-3 border-b border-gray-300 text-left">Profile Link</th>
                <th className="p-3 border-b border-gray-300 text-left">Status</th>
                <th className="p-3 border-b border-gray-300 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant) => (
                <tr
                  key={applicant._id}
                  className={`border-b border-gray-200 ${
                    selectedIds.has(applicant._id) ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(applicant._id)}
                      onChange={() => toggleSelect(applicant._id)}
                      disabled={applicant.status !== "pending"}
                    />
                  </td>
                  <td className="p-3">{applicant.name}</td>
                  <td className="p-3">{applicant.email || "-"}</td>
                  <td className="p-3">{applicant.mobile || "-"}</td>
                  <td className="p-3">{applicant.referralCode}</td>
                  <td className="p-3">
                    <a
                      href={applicant.profileLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      Link
                    </a>
                  </td>
                  <td
                    className={`p-3 font-semibold ${
                      applicant.status === "pending"
                        ? "text-yellow-600"
                        : applicant.status === "approved"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {applicant.status}
                  </td>
                  <td className="p-3 text-center space-x-2">
                    {applicant.status === "pending" ? (
                      <>
                        <button
                          disabled={processingId === applicant._id}
                          onClick={() => approveApplicant(applicant._id)}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          {processingId === applicant._id ? "Approving..." : "Approve"}
                        </button>
                        <button
                          disabled={processingId === applicant._id}
                          onClick={() => rejectApplicant(applicant._id)}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded"
                        >
                          {processingId === applicant._id ? "Rejecting..." : "Reject"}
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
