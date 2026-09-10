import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import { ArrowLeftIcon } from '../components/common/Icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-6">
        <Link to="/login" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
          <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to login
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>

        {sent ? (
          <div className="space-y-3">
            <div className="bg-green-50 text-green-700 text-xs p-4 rounded-lg border border-green-200">
              If an account exists with that email, a reset link has been sent. Check your inbox (and spam folder).
            </div>
            <p className="text-xs text-slate-500">The link expires in 1 hour.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500">Enter your email and we'll send you a link to reset your password.</p>
            {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}