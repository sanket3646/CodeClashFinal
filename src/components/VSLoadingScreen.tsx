import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function VSLoadingScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadMatch = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Failed to load match:", error);
        return;
      }

      setMatch(data);
      setLoading(false);

      // If both players are present -> start match
      if (data.status === "ready") {
        navigate(`/battle/${id}`);
      }
    };

    loadMatch();

    // Real-time subscription to match updates
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updated = payload.new;
          setMatch(updated);

          if (updated.status === "ready") {
            navigate(`/battle/${id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  if (loading || !match) {
    return (
      <div className="text-white text-center mt-20">
        Loading match...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center space-y-6">
      <h1 className="text-4xl font-bold">Match Found</h1>

      <div className="flex space-x-12 items-center text-center">
        <div className="text-2xl">
          Player 1
          <div className="text-sm text-gray-400 mt-1">{match.player1}</div>
        </div>

        <div className="text-3xl font-bold">VS</div>

        <div className="text-2xl">
          {match.player2 ? "Player 2" : "Waiting..."}
          <div className="text-sm text-gray-400 mt-1">
            {match.player2 ?? "—"}
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-xl">
        Match Code:{" "}
        <span className="font-bold text-green-400">{match.code}</span>
      </div>

      <p className="text-gray-400 text-sm">
        {match.player2
          ? "Starting match..."
          : "Waiting for another player to join..."}
      </p>
    </div>
  );
}
