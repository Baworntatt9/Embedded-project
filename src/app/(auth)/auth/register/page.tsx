"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (tel: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(tel);
  };

  const handleRegister = async () => {
    setError("");
    setIsHovered(false);

    if (!name || !tel || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (name.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!validatePhone(tel)) {
      setError("Please enter a valid 10-digit phone number.");
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Create Account</h1>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2 uppercase">
              Phone Number
            </label>
            <input
              type="tel"
              value={tel}
              onChange={(e) => {
                setTel(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0812345678"
              disabled={isLoading}
              maxLength={10}
            />
          </div>

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
                  handleRegister();
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
              onClick={handleRegister}
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
                      ? "opacity-100 -translate-x-18"
                      : "opacity-0 -translate-x-20"
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
                {isLoading ? "Creating..." : "Create Account"}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              className="text-[#007BE5] hover:underline cursor-pointer"
              onClick={() => router.push("/auth/login")}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
