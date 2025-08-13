'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ReferRegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    profileLink: '',
    referralCode: '',
    password: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        contact: form.email || form.mobile,
        email: form.email,
        mobile: form.mobile,
        profileLink: form.profileLink,
        referralCode: form.referralCode,
        password: form.password,
      };

      await axios.post('/api/referral/apply', payload, { withCredentials: true });
      setSubmitted(true);
    } catch (err) {
      alert("Error: " + err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold mb-2 text-green-600">✅ Submitted!</h2>
        <p className="text-gray-700">Please wait for admin approval. Once approved, you'll receive your Master Key.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded p-6 w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-orange-600">Join Referral Program</h2>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="border p-2 rounded mt-1"
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="border p-2 rounded mt-1"
              placeholder="e.g., john@example.com"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Mobile</label>
            <input
              type="text"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              className="border p-2 rounded mt-1"
              placeholder="e.g., 01xxxxxxxxx"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Profile/Page Link</label>
          <input
            name="profileLink"
            value={form.profileLink}
            onChange={handleChange}
            required
            className="border p-2 rounded mt-1"
            placeholder="https://facebook.com/your-page"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Preferred Referral Code</label>
          <input
            name="referralCode"
            value={form.referralCode}
            onChange={handleChange}
            required
            className="border p-2 rounded mt-1"
            placeholder="e.g., johnref2025"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700">Create Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="border p-2 rounded mt-1"
            placeholder="Choose a secure password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 rounded text-white bg-orange-600 hover:bg-orange-700 transition font-semibold"
        >
          {loading ? 'Submitting...' : 'Apply Now'}
        </button>
      </form>
    </div>
  );
}
