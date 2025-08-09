
import React from "react";
import { LogOut, Database } from "lucide-react";

export default function IGHeader({ userEmail, onLogout }: { userEmail?: string; onLogout?: () => void }) {
  return (
    <div className="sticky top-0 z-30 mb-6">
      <div className="mx-auto max-w-6xl">
        <div className="card flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-ig1 via-ig3 to-ig5" />
            <div className="font-semibold">Unbilled Follow‑Up</div>
            <div className="ml-2 flex items-center gap-1 text-xs text-gray-500">
              <Database size={14} /> Supabase
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-3">
            {userEmail && <span className="hidden sm:block">{userEmail}</span>}
            <button className="btn" onClick={onLogout}><LogOut size={16}/> Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}
