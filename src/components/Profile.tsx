import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Trophy, Calendar, Clock, Code, Award, TrendingUp } from "lucide-react";

import type { User, Match } from "../types";

interface ProfileProps {
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error(authError);
        setLoading(false);
        return;
      }

      // Fetch user details from the "users" table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userError) console.error(userError);
      else setUser(userData);

      // Fetch matches where user is player1 or player2
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          player1:player1 (username, id),
          player2:player2 (username, id),
          winner:winner (id)
        `)
        .or(`player1.eq.${user.id},player2.eq.${user.id}`)
        .order("date", { ascending: false });

      if (matchesError) console.error(matchesError);
      else setMatches(matchesData || []);

      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-gray-900">
        No user found
      </div>
    );
  }

  const winRate =
    user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>

        {/* Insert your existing UI structure below this point */}
        {/* ... same UI you pasted, using user and matches state ... */}
      </div>
    </div>
  );
};

export default Profile;
