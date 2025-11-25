import { useState } from "react";
import { Sword, Trophy, Clock, Users, BarChart3 } from "lucide-react";
import type { User } from "../types";
import { useNavigate } from "react-router-dom";

import QuickMatchPopup from "./QuickMatchPopup";
import CreateMatchModal from "./CreateMatchModal";
import JoinMatchModal from "./JoinMatchModal";
import { MatchService } from "../services/MatchService";

interface MainMenuProps {
  user: User;
  onProfile: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ user, onProfile }) => {
  const navigate = useNavigate();

  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Create Match
  const handleCreateMatch = async (
    difficulty: "Beginner" | "Intermediate" | "Advanced"
  ) => {
    try {
      const result = await MatchService.createMatch(user.id, difficulty);

      // FIX — MatchService returns { matchId, code, match }
      navigate(`/vs/${result.matchId}`);

      setShowCreate(false);
      setShowQuickMatch(false);
    } catch (err: any) {
      console.error("Create match error:", err);
      alert(err?.message || "Failed to create match");
    }
  };
const handleLearningModeClick = () => {
    navigate("/result/${matchId}");
};
  // Join Match
  const handleJoinMatch = async (code: string) => {
    try {
      const match = await MatchService.joinMatch(user.id, code);

      // joinMatch returns the DB row → use match.id
      navigate(`/vs/${match.match.id}`);

      setShowJoin(false);
      setShowQuickMatch(false);
    } catch (err: any) {
      console.error("Join match error:", err);
      alert(err?.message || "Failed to join match");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quick Match */}
                <button
                  onClick={() => setShowQuickMatch(true)}
                  className="bg-green-600 hover:bg-green-700 p-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
                >
                  <Sword className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-bold text-lg">Quick Match</div>
                    <div className="text-sm opacity-90">Find an opponent</div>
                  </div>
                </button>

                {/* Learning Mode */}
                <button
                onClick={handleLearningModeClick}
                className="bg-blue-600 hover:bg-blue-700 p-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
                  <Clock className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-bold text-lg">Learning Mode</div>
                    <div className="text-sm opacity-90">Join competition</div>
                  </div>
                </button>

                {/* Spectate */}
                <button className="bg-purple-600 hover:bg-purple-700 p-6 rounded-lg transition-colors flex items-center justify-center space-x-3">
                  <Users className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-bold text-lg">Spectate</div>
                    <div className="text-sm opacity-90">Watch live battles</div>
                  </div>
                </button>

                {/* Profile */}
                <button
                  onClick={onProfile}
                  className="bg-orange-600 hover:bg-orange-700 p-6 rounded-lg transition-colors flex items-center justify-center space-x-3"
                >
                  <BarChart3 className="w-8 h-8" />
                  <div className="text-left">
                    <div className="font-bold text-lg">Profile</div>
                    <div className="text-sm opacity-90">View statistics</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Recent Activity</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-300">Won against AlgoNinja</span>
                  </div>
                  <span className="text-sm text-gray-400">2 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-gray-300">Lost to CodeWizard</span>
                  </div>
                  <span className="text-sm text-gray-400">1 day ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE — Stats + Leaderboard */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h3 className="text-xl font-bold">Your Stats</h3>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-300">Rating</span>
                  <span className="font-bold">{user.rating}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Games Played</span>
                  <span className="font-bold">{user.gamesPlayed}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Win Rate</span>
                  <span className="font-bold">
                    {user.gamesPlayed > 0
                      ? Math.round((user.wins / user.gamesPlayed) * 100)
                      : 0}
                    %
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-300">Avg. Solve Time</span>
                  <span className="font-bold">{user.averageSolveTime}s</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-xl font-bold mb-4">Leaderboard</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold">1.</span>
                  <span className="text-gray-300">GrandMaster</span>
                  <span className="font-bold">2150</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400 font-bold">2.</span>
                  <span className="text-gray-300">CodeMaster</span>
                  <span className="font-bold">1850</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-orange-400 font-bold">3.</span>
                  <span className="text-gray-300">AlgoNinja</span>
                  <span className="font-bold">1650</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* POPUPS */}
        {showQuickMatch && (
          <QuickMatchPopup
            onClose={() => setShowQuickMatch(false)}
            onCreate={() => {
              setShowQuickMatch(false);
              setShowCreate(true);
            }}
            onJoin={() => {
              setShowQuickMatch(false);
              setShowJoin(true);
            }}
          />
        )}

        {showCreate && (
          <CreateMatchModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateMatch}
          />
        )}

        {showJoin && (
          <JoinMatchModal
            onClose={() => setShowJoin(false)}
            onJoin={handleJoinMatch}
          />
        )}
      </div>
    </div>
  );
};

export default MainMenu;
