// src/components/Profile.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trophy, Calendar, Clock } from "lucide-react";

import type { User } from "../types";

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [freshRating, setFreshRating] = useState(user.rating);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);

      // 1️⃣ Fetch matches
      const { data: matchRows } = await supabase
        .from("matches")
        .select("*")
        .or(`player1.eq.${user.id},player2.eq.${user.id}`)
        .order("created_at", { ascending: false });

      const enriched: any[] = [];

      // helper fetch email from user_profiles
      async function getEmail(uid: string) {
        const { data } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", uid)
          .single();
        return data?.email ?? "Unknown";
      }

      // 2️⃣ Add emails
      for (const m of matchRows ?? []) {
        const p1 = m.player1
          ? { id: m.player1, username: await getEmail(m.player1) }
          : null;

        const p2 = m.player2
          ? { id: m.player2, username: await getEmail(m.player2) }
          : null;

        const w = m.winner
          ? { id: m.winner, username: await getEmail(m.winner) }
          : null;

        enriched.push({ ...m, player1: p1, player2: p2, winner: w });
      }

      setMatches(enriched);

      // 3️⃣ Update fresh rating
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("rating")
        .eq("id", user.id)
        .single();

      if (prof?.rating !== undefined) setFreshRating(prof.rating);

      setLoading(false);
    }

    fetchAll();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
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
          <button onClick={onLogout} className="px-4 py-2 bg-red-600 rounded">
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* USER INFO */}
          <div className="bg-gray-800 p-6 border border-gray-700 rounded-lg">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-full mx-auto flex items-center justify-center text-2xl font-bold text-white">
                {user.username[0].toUpperCase()}
              </div>

              <h2 className="text-2xl font-bold text-white mt-3">{user.username}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300">Rating</span>
                </div>
                <span className="text-2xl font-bold text-white">{freshRating}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Joined</span>
                </div>
                <span className="text-white">{user.joinDate}</span>
              </div>

              <div className="flex justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Avg. Solve Time</span>
                </div>
                <span className="text-white">{user.averageSolveTime}s</span>
              </div>
            </div>
          </div>

          {/* MATCH HISTORY */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-800 p-6 border border-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Matches</h3>

              {matches.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No matches yet</p>
              ) : (
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match, idx) => {
                    const opponent =
                      match.player1?.id === user.id ? match.player2 : match.player1;

                    return (
                      <div key={idx} className="p-3 bg-gray-700 rounded flex justify-between">
                        <div className="flex space-x-3 items-center">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              match.winner?.id === user.id ? "bg-green-400" : "bg-red-400"
                            }`}
                          />
                          <div>
                            <div className="text-white">vs {opponent?.username}</div>
                            <div className="text-gray-400 text-sm">{match.problem}</div>
                          </div>
                        </div>
                        <div className="text-right text-gray-300">
                          {match.created_at?.split("T")[0]}
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
