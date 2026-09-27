import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, MessageSquare } from "lucide-react";
import api from "../api";

import logoImg from "../assets/logo.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  }

  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#2E2C29] bg-[#191817]/90 backdrop-blur-md">
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logoImg} alt="RAGent" className="w-7 h-7 object-contain rounded-md" />
          <span className="text-[16px] font-semibold text-[#EDEBE6] tracking-tight group-hover:text-white transition-colors">RAGent</span>
        </Link>

        {/* Right side nav items */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-20 h-8 rounded-lg bg-[#242220] animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Go to chat app */}
              <Link
                to="/chat"
                className="flex items-center gap-1.5 bg-[#D97757] text-white px-3.5 py-1.5 rounded-lg text-[13px] font-medium
                           hover:bg-[#C4653F] transition-all shadow-md hover:shadow-[#D97757]/20"
              >
                <MessageSquare size={14} />
                <span>Open Chat</span>
              </Link>

              {/* Profile link */}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 bg-[#242220] hover:bg-[#2E2C29] border border-[#2E2C29] px-3 py-1.5 rounded-lg
                           text-[13px] font-medium text-[#EDEBE6] transition-colors"
                title="View Profile & Dashboard"
              >
                <div className="w-5 h-5 rounded-full bg-[#D97757]/20 text-[#E2876A] flex items-center justify-center text-[10px] font-bold">
                  {getInitials(user.name)}
                </div>
                <span className="max-w-[120px] truncate">{user.name}</span>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className="text-[#8A867E] hover:text-[#EDEBE6] p-1.5 rounded-lg hover:bg-[#242220] transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-[14px] text-[#B8B5AE] hover:text-[#EDEBE6] transition-colors font-medium px-2 py-1"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="bg-[#D97757] text-white px-4 py-2 rounded-lg text-[14px] font-medium
                           hover:bg-[#C4653F] transition-colors shadow-md"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
