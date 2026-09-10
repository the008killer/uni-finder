import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import PasswordStrength from '../components/common/PasswordStrength';
import { checkPasswordStrength } from '../utils/password';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const {isValid} = checkPasswordStrength(password);
    if (!isValid) return setError('Password does not meet all requirements');

    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>

        {success ? (
          <div className="bg-green-50 text-green-700 text-xs p-4 rounded-lg border border-green-200">
            Password reset successfully! Redirecting to login...
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">New Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
                <PasswordStrength password={password}/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}