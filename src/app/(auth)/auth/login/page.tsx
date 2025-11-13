"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isHovered, setIsHovered] = React.useState(false);
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setError("");
    setIsHovered(false);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      // จำลอง API call
      // ในโปรเจคจริงใช้: const result = await signIn('credentials', { email, password, redirect: false });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // จำลองว่า login ไม่สำเร็จ (สำหรับ demo)
      // ในโปรเจคจริง: if (!result?.error) { router.push('/dashboard'); } else { setError('...'); }
      setError("That email and password combination is incorrect.");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Sign in</h1>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
          </div>

          <div
            onMouseEnter={() => {
              if (!isLoading) setIsHovered(true);
            }}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full mt-6"
          >
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`w-full bg-black text-white py-3 font-medium transition-all duration-300 flex items-center justify-center border-0 relative ${
                isHovered ? "rounded-none" : "rounded-lg"
              } ${
                isLoading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {!isLoading && (
                <ArrowRight
                  size={20}
                  className={`absolute left-1/2 transition-all duration-300 ${
                    isHovered
                      ? "opacity-100 -translate-x-10"
                      : "opacity-0 -translate-x-12"
                  }`}
                />
              )}
              <span
                className={`${
                  isLoading
                    ? "translate-x-0"
                    : "transition-transform duration-300 " +
                      (isHovered ? "translate-x-2" : "translate-x-0")
                }`}
              >
                {isLoading ? "Loading..." : "Log in"}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-gray-600">
            No account?{" "}
            <a href="#" className="text-[#007BE5] hover:underline">
              Create one
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
