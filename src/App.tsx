// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginScreen from "./components/LoginScreen";
import MainMenu from "./components/MainMenu";
import Profile from "./components/Profile";

import VSLoadingScreen from "./components/VSLoadingScreen";
import BattleRoom from "./pages/BattleRoom";
import LearningMode from "./pages/LearningMode"; // ✅ added correct import
import { User } from "./types";
import { supabase } from "./lib/supabaseClient";
import ResultPage from "./pages/ResultPage";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session?.user) {
        const u = data.session.user;
        setUser({
          id: u.id,
          username: u.email?.split("@")[0] || "User",
          email: u.email || "",
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
      }

      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            username: u.email?.split("@")[0] || "User",
            email: u.email || "",
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
          setUser(null);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (loggedInUser: User) => setUser(loggedInUser);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <Routes>
      {!user ? (
        <Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
      ) : (
        <>
          {/* Home / Main Menu */}
          <Route
  path="/"
  element={
    <MainMenu
      user={user}
      onProfile={() => navigate("/profile")}
    />
  }
/>


          {/* Profile */}
          <Route
            path="/profile"
            element={<Profile user={user} onLogout={handleLogout} />}
          />

          {/* VS Screen */}
          <Route path="/vs/:id" element={<VSLoadingScreen />} />

          {/* Battle Room */}
          <Route path="/battle/:id" element={<BattleRoom />} />

          <Route path="/learning" element={<LearningMode />} /> {/* ✅ added missing route */}
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
           <Route path="/result/:id" element={<ResultPage/>} />
        </>
      )}
    </Routes>
  );
}

export default App;
