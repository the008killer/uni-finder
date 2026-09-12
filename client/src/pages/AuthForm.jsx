import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { GraduationCapIcon } from '../components/common/Icons';
import PasswordStrength from '../components/common/PasswordStrength';
import { checkPasswordStrength } from '../utils/password';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function mapFirebaseError(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered. Try signing in.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Invalid email or password.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    case 'auth/popup-closed-by-user': return 'Sign-in was cancelled.';
    case 'auth/unauthorized-domain': return 'This domain is not authorized in Firebase Console.';
    default: return null;
  }
}

export default function AuthForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // After Firebase auth, create session on our Express backend
  const establishSession = async (idToken, extra = {}) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://uni-finder-vq8c.onrender.com/api'}/auth/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Session failed');
    return data;
  };

  const completeSignIn = async (user, extra = {}) => {
    const idToken = await user.getIdToken();
    const session = await establishSession(idToken, extra);
    login(session.token, session.user);
    navigate('/search');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await completeSignIn(result.user, {
        name: result.user.displayName || '',
        email: result.user.email,
      });
    } catch (err) {
      setError(mapFirebaseError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      const { isValid } = checkPasswordStrength(form.password);
      if (!isValid) {
        setError('Password does not meet all strength requirements.');
        setLoading(false);
        return;
      }
    }

    try {
      let credential;
      if (mode === 'register') {
        credential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        if (form.name.trim()) {
          await updateProfile(credential.user, { displayName: form.name.trim() });
        }
      } else {
        credential = await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      await completeSignIn(credential.user, {
        name: form.name.trim() || credential.user.displayName || '',
        email: credential.user.email,
      });
    } catch (err) {
      setError(mapFirebaseError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email) return setError('Please enter your email address.');
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, form.email);
      setResetMessage('Password reset link sent! Check your email.');
      setTimeout(() => setMode('login'), 3000);
    } catch (err) {
      setError(mapFirebaseError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex bg-brand-600 text-white p-2.5 rounded-xl mb-1">
            <GraduationCapIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'register' ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'register'
              ? 'Join students exploring degrees in Germany & Austria'
              : 'Sign in to access student chats and saved courses'}
          </p>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
        >
          <svg viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-semibold">or</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setResetMessage(''); }}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); setResetMessage(''); }}
            className={`flex-1 text-xs font-bold py-2 rounded-md transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
          >
            Sign Up
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">{error}</div>}
        {resetMessage && <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg border border-green-200">{resetMessage}</div>}

        {/* Forgot Password Form */}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-500">Enter your email to receive a password reset link.</p>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className="w-full text-xs text-slate-500 hover:text-slate-900 font-semibold">
              ← Back to login
            </button>
          </form>
        ) : (
          /* Email/Password Form */
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'register' && (
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="Full name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
            )}
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required placeholder="Email address"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
            <div>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} required placeholder="Password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600" />
              {mode === 'register' && <PasswordStrength password={form.password} />}
            </div>
            {mode === 'login' && (
              <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="text-xs text-slate-500 hover:text-brand-600 font-semibold underline text-right w-full block">
                Forgot password?
              </button>
            )}
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}