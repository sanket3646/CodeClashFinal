// src/App.tsx
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // ❌ removed BrowserRouter import
import LoginScreen from "./components/LoginScreen";
import MainMenu from "./components/MainMenu";
import Profile from "./components/Profile"; // make sure file name matches
import { User } from "./types/index";
import { supabase } from "./lib/supabaseClient";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
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
    });

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
          <Route
            path="/"
            element={
              <MainMenu
                user={user}
                onQuickMatch={() => alert("Quick match coming soon!")}
                onProfile={() => (window.location.href = "/profile")}
              />
            }
          />
          <Route
            path="/profile"
            element={<Profile user={user} onLogout={handleLogout} />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </>
      )}
    </Routes>
  );
}

export default App;
