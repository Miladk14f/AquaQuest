import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets, Mail, Lock, User, AlertCircle } from "lucide-react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "../lib/auth.js";
import { supabaseConfigured } from "../lib/supabase.js";

export default function Login() {
  const [mode,     setMode]     = useState("signin"); // "signin" | "signup"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);
  const navigate = useNavigate();

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-amber mx-auto mb-3" />
          <p className="font-semibold text-gray-800 mb-1">Auth not configured</p>
          <p className="text-sm text-gray-500">Add Supabase env vars to Vercel to enable login.</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
        navigate("/profile");
      } else {
        await signUpWithEmail(email, password, username);
        setDone(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try { await signInWithGoogle(); }
    catch (err) { setError(err.message); }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Droplets className="w-12 h-12 text-teal mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
          <p className="text-gray-500 text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Droplets className="w-10 h-10 text-teal mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "signin" ? "Sign in to WaterQuest" : "Join WaterQuest"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === "signin" ? "Track your cleanup impact" : "Start earning points for real impact"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border border-gray-200
              rounded-xl py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50
              transition-colors mb-4 min-h-[44px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Username" required minLength={3}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={mode === "signin" ? "text" : "email"}
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder={mode === "signin" ? "Email or username" : "Email"} required
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password" required minLength={6}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm
                  focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 rounded-lg p-2">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-teal text-white font-semibold py-2.5 rounded-xl
                hover:bg-teal-dark transition-colors min-h-[44px] text-sm disabled:opacity-60"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === "signin" ? "No account? " : "Already have one? "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}
            className="text-teal font-semibold hover:underline"
          >
            {mode === "signin" ? "Sign up free" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
