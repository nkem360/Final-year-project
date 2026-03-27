import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Signup({ onSwitchToLogin }) {
  const { signup } = useAuth();

  const [form, setForm]       = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 text-center">
          <span className="text-5xl">✅</span>
          <h2 className="text-2xl font-bold text-emerald-700 mt-4">Account Created!</h2>
          <p className="text-gray-500 mt-2">Your account is ready. You can now sign in.</p>
          <button
            onClick={onSwitchToLogin}
            className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-8 rounded-lg transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <span className="text-5xl">🐾</span>
          <h1 className="text-3xl font-bold text-emerald-700 mt-2">PetAI</h1>
          <p className="text-gray-500 text-sm mt-1">Create your free account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="john_doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm"
              required
              value={form.confirm}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        {/* Switch to Login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-emerald-600 font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
