'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function WithdrawHistory() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      const referralCode = localStorage.getItem('referralCode');
      if (!referralCode) {
        router.push('/refer/login');
        return;
      }

      try {
        const { data } = await axios.post('/api/refer/withdraw/history', { referralCode });
        setWithdrawals(data);
      } catch (error) {
        console.error(error);
        router.push('/refer/login');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [router]);

  if (loading) return <p className="text-center mt-20">Loading withdrawal history...</p>;

  if (withdrawals.length === 0)
    return <p className="text-center mt-20">No withdrawal requests found.</p>;

  return (
    <main className="max-w-4xl mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-3xl font-bold mb-6 text-center">Withdrawal History</h1>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Amount (৳)</th>
            <th className="border border-gray-300 px-4 py-2">Payment Method</th>
            <th className="border border-gray-300 px-4 py-2">Account Number</th>
            <th className="border border-gray-300 px-4 py-2">Status</th>
            <th className="border border-gray-300 px-4 py-2">Requested At</th>
            <th className="border border-gray-300 px-4 py-2">Paid At</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={w._id} className="text-center">
              <td className="border border-gray-300 px-4 py-2">৳{w.amount.toFixed(2)}</td>
              <td className="border border-gray-300 px-4 py-2">{w.paymentMethod}</td>
              <td className="border border-gray-300 px-4 py-2">{w.accountNumber}</td>
              <td
                className={`border border-gray-300 px-4 py-2 font-semibold ${
                  w.status === 'pending'
                    ? 'text-yellow-600'
                    : w.status === 'paid'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {w.status}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {new Date(w.requestedAt).toLocaleDateString()}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {w.paidAt ? new Date(w.paidAt).toLocaleDateString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
