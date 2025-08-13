'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function WithdrawPage() {
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchBalances = async () => {
      const referralCode = localStorage.getItem('referralCode');
      if (!referralCode) {
        router.push('/refer/login');
        return;
      }
      try {
        const { data } = await axios.post('/api/refer/dashboard', { referralCode });

        // Assuming your backend returns totalEarnings and also totalWithdrawn in data
        // If not, you might need to create a separate API for totalWithdrawn
        const totalWithdrawnFromAPI = data.totalWithdrawn ?? 0;

        setTotalEarnings(data.totalEarnings);
        setTotalWithdrawn(totalWithdrawnFromAPI);
        setAvailableBalance(data.totalEarnings - totalWithdrawnFromAPI);
      } catch (err) {
        console.error(err);
        localStorage.removeItem('referralCode');
        router.push('/refer/login');
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const numAmount = parseFloat(amount);
    if (!paymentMethod || !accountNumber || !amount) {
      setError('Please fill in all fields');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (numAmount > availableBalance) {
      setError('Requested amount exceeds available balance');
      return;
    }

    setSubmitting(true);
    try {
      const referralCode = localStorage.getItem('referralCode');
      await axios.post('/api/refer/withdraw', {
        referralCode,
        paymentMethod,
        accountNumber,
        amount: numAmount,
      });

      setSuccessMsg('Withdrawal request submitted successfully!');
      setPaymentMethod('');
      setAccountNumber('');
      setAmount('');

      // Redirect to withdraw history page (update this route as needed)
      setTimeout(() => {
        router.push('/refer/withdraw-history');
      }, 1500);
    } catch (err) {
      setError(err?.response?.data || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-500 text-lg font-medium">
        Loading withdraw form...
      </p>
    );

  return (
    <main className="max-w-xl mx-auto mt-16 mb-20 p-6 sm:p-10 bg-white rounded-xl shadow-lg border">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">
        Request Withdrawal
      </h1>

      <p className="mb-6 text-center text-gray-600 text-sm">
        Your available balance is{' '}
        <span className="text-green-700 font-semibold">৳{availableBalance.toFixed(2)}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Method */}
        <div>
          <label
            htmlFor="paymentMethod"
            className="block mb-2 font-medium text-gray-700"
          >
            Payment Method
          </label>
          <select
            id="paymentMethod"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            <option value="">-- Select Method --</option>
            <option value="Bkash">Bkash</option>
            <option value="Rocket">Rocket</option>
            <option value="Nagad">Nagad</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label
            htmlFor="accountNumber"
            className="block mb-2 font-medium text-gray-700"
          >
            Account Number
          </label>
          <input
            id="accountNumber"
            type="text"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block mb-2 font-medium text-gray-700">
            Amount (৳)
          </label>
          <input
            id="amount"
            type="number"
            min="1"
            step="0.01"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        {/* Feedback */}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {successMsg && (
          <p className="text-green-600 text-sm text-center">{successMsg}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 text-white font-semibold rounded transition ${
            submitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
        </button>
      </form>
    </main>
  );
}
