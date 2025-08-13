'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ReferLoginPage() {
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/refer/login', { referralCode, password });

      if (res.data && res.data.referralCode) {
        localStorage.setItem('referralCode', res.data.referralCode);
        window.location.href = '/refer/dashboard';  // Redirect on successful login
      } else if (res.data && res.data.message) {
        setError(res.data.message);
      } else {
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Login failed due to network or server error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white space-y-5">
      <h2 className="text-2xl font-bold text-center text-orange-600">Referral Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Referral Code"
          className="w-full border px-4 py-2 rounded"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border px-4 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white font-semibold transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
