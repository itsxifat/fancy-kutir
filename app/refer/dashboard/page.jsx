'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  ArrowUpOnSquareIcon,
  ArrowRightCircleIcon,
  ArrowRightOnRectangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import logo from '@/assets/logo.svg';

export default function ReferralDashboard() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Make fetchData stable with useCallback so it can be used on-demand
  const fetchData = useCallback(async () => {
    setLoading(true);
    const referralCode = localStorage.getItem('referralCode');
    if (!referralCode) {
      router.push('/refer/login');
      return;
    }

    try {
      const { data } = await axios.post('/api/refer/dashboard', { referralCode });
      setInfo(data); // Reverse the data to show latest first
    } catch (err) {
      console.error(err);
      localStorage.removeItem('referralCode');
      router.push('/refer/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('referralCode');
    router.push('/refer/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-lg font-medium">
        Loading dashboard...
      </div>
    );
  }

  if (!info) return null;

  const availableBalance = (info.totalEarnings - (info.totalWithdrawn || 0));

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 pb-20">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-y-4 mb-10">
        {/* Logo & Title */}
        <div className="flex items-center gap-x-4">
          <Image src={logo} alt="Logo" width={100} height={100} className="w-30 h-30" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Referral Dashboard
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/')}
            title="Go to Website"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 transition"
          >
            <ArrowRightCircleIcon className="h-5 w-5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => router.push('/refer/withdraw')}
            title="Request Withdrawal"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-md hover:bg-orange-100 transition"
          >
            <ArrowUpOnSquareIcon className="h-5 w-5" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => router.push('/refer/withdraw-history')}
            title="Withdrawal History"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 transition"
          >
            <ClockIcon className="h-5 w-5" />
            <span>Withdrawal History</span>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span>Logout</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-100 transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Welcome */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Welcome, <span className="text-orange-600">{info.name}</span>
        </h2>
      </div>

      {/* Stat Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-orange-50 p-6 rounded-xl shadow border border-orange-200">
          <p className="text-gray-700 uppercase text-xs font-semibold mb-2 tracking-wide">
            Referral Code
          </p>
          <p className="text-xl font-semibold text-orange-700 break-all">
            {info.referralCode}
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-xl shadow border border-green-200">
          <p className="text-gray-700 uppercase text-xs font-semibold mb-2 tracking-wide">
            Total Earnings
          </p>
          <p className="text-xl font-semibold text-green-700">
            ৳{info.totalEarnings.toFixed(2)}
          </p>
        </div>

        <div className="bg-red-50 p-6 rounded-xl shadow border border-red-200">
          <p className="text-gray-700 uppercase text-xs font-semibold mb-2 tracking-wide">
            Total Withdrawn
          </p>
          <p className="text-xl font-semibold text-red-700">
            ৳{(info.totalWithdrawn || 0).toFixed(2)}
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl shadow border border-blue-200">
          <p className="text-gray-700 uppercase text-xs font-semibold mb-2 tracking-wide">
            Available Balance
          </p>
          <p className="text-xl font-semibold text-blue-700">
            ৳{availableBalance.toFixed(2)}
          </p>
        </div>
      </section>

      {/* Purchases List */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 border-b pb-2 border-gray-200">
          Referred Purchases
        </h2>

        {info.purchases.length === 0 ? (
          <p className="text-gray-600 italic">No purchases yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {info.purchases.map((p, idx) => (
              <li
                key={idx}
                className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-y-1 sm:gap-y-0 sm:gap-x-6 text-sm"
              >
                <span className="font-semibold text-gray-800">{p.buyer}</span>
                <span className="text-green-700 font-semibold">
                  ৳{p.amount.toFixed(2)}
                </span>
                <span className="text-gray-500">
                  {new Date(p.date).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
