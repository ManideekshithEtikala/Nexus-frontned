"use client";

import { useAuth } from "../hooks/useAuth";
import Auth from "./Auth";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0c0c0e] text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <>{children}</>;
}