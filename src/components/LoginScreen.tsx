import React, { useState } from "react";
import { Sword, Trophy, Code } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { User } from "../types";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // 🔐 Login existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const sessionUser = data.user;
        if (!sessionUser) throw new Error("No user found");

        onLogin({
          id: sessionUser.id,
          username: sessionUser.email?.split("@")[0] || "User",
          email: sessionUser.email || "",
          rating: 1200,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          averageSolveTime: 0,
          favoriteLanguages: [],
          achievements: [],
          joinDate: new Date().toISOString().split("T")[0],
        });
      } else {
        // 🧾 Register new user
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        alert("Signup successful! Please verify your email before logging in.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 flex items-center justify-center p-4">
      <div>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sword className="w-12 h-12 text-green-400 mr-2" />
            <h1 className="text-4xl font-bold text-white">Code Clash</h1>
          </div>
          <p className="text-gray-300">Competitive coding battles</p>
        </div>

        {/* Form Container */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                isLogin
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                !isLogin
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-green-500"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Register"}
            </button>
          </form>
        </div>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <Code className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Multi-Language</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Elo Rating</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <Sword className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Real-time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
