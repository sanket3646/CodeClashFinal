// src/components/Profile.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trophy, Calendar, Clock, Code } from "lucide-react";

import type { User } from "../types";

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⭐ NEW: fresh rating loaded from Supabase user_profiles
  const [freshRating, setFreshRating] = useState<number>(user.rating);

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);

      // 1️⃣ Fetch matches (no joins)
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .or(`player1.eq.${user.id},player2.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Match fetch error:", error);
        setLoading(false);
        return;
      }

      const enriched: any[] = [];

      // 2️⃣ Fetch user emails (auth)
      for (let m of data) {
        let p1 = null;
        let p2 = null;
        let w = null;

        if (m.player1) {
          const { data: u1 } = await supabase.auth.getUser(m.player1);
          p1 = { id: m.player1, username: u1?.user?.email ?? "Unknown" };
        }

        if (m.player2) {
          const { data: u2 } = await supabase.auth.getUser(m.player2);
          p2 = { id: m.player2, username: u2?.user?.email ?? "Unknown" };
        }

        if (m.winner) {
          const { data: uw } = await supabase.auth.getUser(m.winner);
          w = { id: m.winner, username: uw?.user?.email ?? "Unknown" };
        }

        enriched.push({
          ...m,
          player1: p1,
          player2: p2,
          winner: w,
        });
      }

      setMatches(enriched);

      // 3️⃣ Fetch the UPDATED rating from user_profiles
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("rating")
        .eq("id", user.id)
        .single();

      if (prof?.rating !== undefined) {
        setFreshRating(prof.rating);
      }

      setLoading(false);
    };

    fetchMatches();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* USER INFO */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-lineargradient-to-br from-green-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-white">
                  {user.username}
                </h2>
                <p className="text-gray-400">{user.email}</p>
              </div>

              <div className="space-y-4">

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Rating</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {freshRating}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className="text-gray-300">Joined</span>
                  </div>
                  <span className="text-white">{user.joinDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Avg. Solve Time</span>
                  </div>
                  <span className="text-white">{user.averageSolveTime}s</span>
                </div>

              </div>
            </div>

            {/* FAVORITE LANGUAGES */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Favorite Languages
                </h3>
              </div>

              <div className="space-y-2">
                {user.favoriteLanguages.length === 0 && (
                  <p className="text-gray-400">No languages added yet</p>
                )}

                {user.favoriteLanguages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-300">{lang}</span>
                    <div className="w-16 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-400 h-2 rounded-full"
                        style={{ width: `${Math.max(20, 100 - index * 20)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* MATCH HISTORY */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Recent Matches
              </h3>

              {matches.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No matches played yet
                </p>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match, index) => {
                    const opponent =
                      match.player1?.id === user.id
                        ? match.player2
                        : match.player1;

                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              match.winner?.id === user.id
                                ? "bg-green-400"
                                : "bg-red-400"
                            }`}
                          ></div>

                          <div>
                            <div className="text-white font-medium">
                              vs {opponent?.username || "Unknown"}
                            </div>

                            <div className="text-sm text-gray-400">
                              {match.problem?.title || "Unknown Problem"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-white font-medium">
                            {match.winner?.id === user.id ? "Won" : "Lost"}
                          </div>
                          <div className="text-sm text-gray-400">
                            {match.created_at?.split("T")[0] ?? "Unknown"}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
