import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, verify2FALogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GraduationCapIcon } from '../components/common/Icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const [requires2FA, setRequires2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [twoFACode, setTwoFACode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser({ identifier: email.trim(), password });
      if (res.data.requires2FA){
        setRequire2FA(true);
        setPendingUserId(res.data.userId);
      } else if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/search');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await verify2FALogin(pendingUserId, twoFACode);
      if (res.data.success) {
        const {getMe} = await import ('../services/api');
        const meRes = await getMe();
        login(res.data.token, meRes.data.user);
        navigate('/search')
      } 
    } catch (err){
      setError(err.response?.data?.error);
    } finally {
      setLoading(false);
    }
  }

  if (requires2FA) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
            <p className="text-xs text-slate-500">Enter the 6-digit code from your authenticator app</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">{error}</div>}

          <form onSubmit={handle2FAVerify} className="space-y-4">
            <input
              type="text"
              required
              maxLength={6}
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <button onClick={() => { setRequires2FA(false); setError(''); }} className="w-full text-xs text-slate-500 hover:text-slate-900 font-semibold">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-brand-600 text-white p-2.5 rounded-xl mb-1">
            <GraduationCapIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500">Sign in to access student chats and saved courses</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Username
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com or johndoe"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

         <div className="flex justify-between text-xs">
          <Link to="/forgot-password" className="text-slate-500 hover:text-slate-900 font-semibold">Forgot password?</Link>
          <Link to="/register" className="font-bold text-slate-900 hover:underline">Create Account</Link>
        </div>
      </div>
    </div>
  );
}