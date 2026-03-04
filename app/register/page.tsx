"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  username: string;
  createdAt: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/register");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }

      const data = await res.json();
      setSuccess(data.message || "User registered successfully");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register New User</h1>
          <p className="mt-1 text-sm text-gray-600">
            Only authenticated admins can register new users.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registration Form */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                  minLength={6}
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                  {success}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Registering..." : "Register User"}
              </button>
            </form>
          </div>

          {/* Registered Users List */}
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Registered Users</h2>
              <button
                onClick={loadUsers}
                disabled={loadingUsers}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {loadingUsers ? "Loading..." : "Refresh"}
              </button>
            </div>
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No registered users yet.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
