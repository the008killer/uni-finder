import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../utils/firebase-client";
import { useAuth } from "../context/AuthContext";
import { GraduationCapIcon } from "../components/common/Icons";
import PasswordStrength from "../components/common/PasswordStrength";
import { checkPasswordStrength } from "../utils/password";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

function mapFirebaseError(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email address or password.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in the Firebase Console Settings.";
    default:
      return null;
  }
}

export default function AuthForm() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, login, loading: authLoading } = useAuth();

  const [mode, setMode] = useState("login"); // 'login' | 'register' | 'forgot' | 'setNewPassword'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  // Custom password reset state
  const [oobCode, setOobCode] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  // 1. Guard: Redirect logged-in users away from the login page immediately
  useEffect(() => {
    if (!authLoading && user && mode !== "setNewPassword") {
      navigate("/search", { replace: true });
    }
  }, [user, authLoading, navigate, mode]);

  // 2. Action link handler: Check if user arrived via an in-app password reset email link
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    const code = searchParams.get("oobCode");

    if (urlMode === "resetPassword" && code) {
      setOobCode(code);
      setMode("setNewPassword");

      verifyPasswordResetCode(auth, code).catch((err) => {
        console.error("Invalid reset code:", err);
        setError(
          "This password reset link is invalid or has expired. Please request a new one.",
        );
      });
    }
  }, [searchParams]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Establish standard JWT session on Express backend using Firebase ID Token
  const establishSession = async (idToken, extra = {}) => {
    const baseUrl =
      import.meta.env.VITE_API_URL ||
      "https://uni-finder-vq8c.onrender.com/api";
    const cleanUrl = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;

    const res = await fetch(`${cleanUrl}/auth/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Authentication session bridge failed.");
    }
    return data;
  };

  const completeSignIn = async (firebaseUser, extra = {}) => {
    const idToken = await firebaseUser.getIdToken();
    const session = await establishSession(idToken, extra);
    login(session.token, session.user);
    navigate("/search");
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await completeSignIn(result.user, {
        name: result.user.displayName || "",
        email: result.user.email,
      });
    } catch (err) {
      setError(
        mapFirebaseError(err.code) || err.message || "Google sign-in failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      const { isValid } = checkPasswordStrength(form.password);
      if (!isValid) {
        setError("Password does not meet all strength requirements.");
        setLoading(false);
        return;
      }
    }

    try {
      let credential;
      if (mode === "register") {
        credential = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password,
        );
        if (form.name.trim()) {
          await updateProfile(credential.user, {
            displayName: form.name.trim(),
          });
        }
      } else {
        credential = await signInWithEmailAndPassword(
          auth,
          form.email,
          form.password,
        );
      }

      await completeSignIn(credential.user, {
        name: form.name.trim() || credential.user.displayName || "",
        email: credential.user.email,
      });
    } catch (err) {
      setError(
        mapFirebaseError(err.code) || err.message || "Authentication failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!form.email || !form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setResetMessage("");

    try {
      // Points reset completion back to your main site hash router
      const actionCodeSettings = {
        url: "https://www.adhikariashwin0.com.np/unifinder/#/login",
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, form.email.trim(), actionCodeSettings);
      setResetMessage(
        "Password reset email sent! Check your inbox (and spam folder).",
      );
      setForm({ name: "", email: "", password: "" });
      setTimeout(() => setMode("login"), 4000);
    } catch (err) {
      setError(
        mapFirebaseError(err.code) ||
          err.message ||
          "Failed to send reset email.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e) => {
    e.preventDefault();

    const { isValid } = checkPasswordStrength(newPassword);
    if (!isValid) {
      setError("Password does not meet all strength requirements.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setResetMessage(
        "Password reset successfully! Redirecting to login page...",
      );
      setTimeout(() => {
        setMode("login");
        setResetMessage("");
        setNewPassword("");
        setOobCode(null);
        setSearchParams({}); 
      }, 3000);
    } catch (err) {
      setError(
        mapFirebaseError(err.code) ||
          err.message ||
          "Failed to set new password.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Spinner while loading initial global session
  if (authLoading || (user && !authLoading && mode !== "setNewPassword")) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
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
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === "register"
              ? "Create Account"
              : mode === "setNewPassword"
                ? "Set New Password"
                : "Welcome Back"}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === "register"
              ? "Join students exploring degrees in Germany & Austria"
              : mode === "setNewPassword"
                ? "Enter a strong new password for your account"
                : "Sign in to access student chats and saved courses"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        {resetMessage && (
          <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg border border-green-200">
            {resetMessage}
          </div>
        )}

        {/* 1. New Password Reset Form */}
        {mode === "setNewPassword" ? (
          <form onSubmit={handleSetNewPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
              <PasswordStrength password={newPassword} />
            </div>
            <button
              type="submit"
              disabled={loading || !newPassword}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              {loading ? "Setting Password..." : "Update Password"}
            </button>
          </form>
        ) : mode === "forgot" ? (
          /* 2. Forgot Password Email Requester */
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your email address and we will dispatch a secure link to
              reset your account credentials.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Sending Request..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setResetMessage("");
              }}
              className="w-full text-xs text-slate-500 hover:text-slate-900 font-semibold transition"
            >
              ← Back to login
            </button>
          </form>
        ) : (
          /* 3. Standard Login / Sign Up Forms */
          <>
            {/* Google Popup CTA */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold select-none">
                or
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Email Form Toggle Tabs */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setResetMessage("");
                }}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition ${mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError("");
                  setResetMessage("");
                }}
                className={`flex-1 text-xs font-bold py-2 rounded-md transition ${mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
                />
                {mode === "register" && (
                  <PasswordStrength password={form.password} />
                )}
              </div>

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                    setResetMessage("");
                  }}
                  className="text-xs text-slate-500 hover:text-brand-600 font-semibold underline text-right w-full block transition"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-3 rounded-xl transition disabled:opacity-50 shadow-sm"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Sign In with Email"
                    : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
