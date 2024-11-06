// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import LandingPage from "./LandingPage";
import AuthPage from "./AuthPage";
import MindMap from "./MindMap";
import { useUserInfo } from './context/UserContext';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={
          <RequireAuthForAuth>
            <AuthPage />
          </RequireAuthForAuth>
        }/>
        {/* Protected Routes */}
        <Route
          path="/mindmap/:mindmap_id"
          element={
            <RequireAuthForMindMap>
              <MindMap />
            </RequireAuthForMindMap>
          }
        />
        <Route
          path="/mindmap"
          element={
            <RequireAuthForMindMap>
              <MindMap />
            </RequireAuthForMindMap>
          }
        />
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Helper component to protect routes
function RequireAuthForMindMap({ children }: { children: JSX.Element }) {
  const { userEmail } = useUserInfo();

  if (!userEmail) {
    // Redirect to the authentication page if not authenticated
    return <Navigate to="/auth/sign-in" replace />;
  }
  return children;
}

function RequireAuthForAuth({ children }: { children: JSX.Element }) {
  const { userEmail } = useUserInfo();

  if (userEmail) {
    // Redirect to the authentication page if not authenticated
    return <Navigate to="/" replace />;
  }
  return children;
}
