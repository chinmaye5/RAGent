import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, User, MessageSquare, CircleChevronRight, Menu, X } from "lucide-react";
import api from "../api";

import logoImg from "../assets/logo.png";

/* Shared styles so every control in the bar looks consistent */
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2876A]";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-[1px] bg-[#D97757] font-semibold uppercase tracking-[0.06em] text-[#191817] " +
  `transition-colors hover:bg-[#E2876A] ${focusRing}`;

const iconBtn =
  "rounded-[1px] border border-[#EDEBE6]/10 p-1.5 text-[#8A867E] transition-colors " +
  `hover:border-[#EDEBE6]/25 hover:text-[#EDEBE6] ${focusRing}`;

function Navbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  /* Transparent at the top, solid once the page scrolls */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setUser(null);
    setMobileMenuOpen(false);
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
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-200 ${scrolled || mobileMenuOpen
          ? "border-[#2E2C29] bg-[#191817]/95 backdrop-blur-sm"
          : "border-transparent bg-transparent"
        }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Brand logo */}
        <Link to="/" className={`group flex items-center gap-2 ${focusRing}`}>
          <img src={logoImg} alt="RAGent logo" className="h-6 w-6 rounded-[2px] object-contain" />
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#EDEBE6]">RAGent</span>
        </Link>

        {/* Desktop right side */}
        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded-[1px] bg-[#EDEBE6]/5" />
          ) : user ? (
            <>
              {/* Go to chat app */}
              <Link to="/chat" className={`${btnBase} px-4 py-1.5 text-xs`}>
                <MessageSquare size={14} />
                <span>Open Chat</span>
              </Link>

              {/* Profile link */}
              <Link
                to="/dashboard"
                title="View Profile & Dashboard"
                className={`flex items-center gap-2 rounded-[1px] border border-[#EDEBE6]/10 px-3 py-1.5 text-xs font-medium text-[#EDEBE6]/80 transition-colors hover:border-[#EDEBE6]/25 hover:text-[#EDEBE6] ${focusRing}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-[1px] bg-[#D97757]/20 font-mono text-[10px] font-bold text-[#E2876A]">
                  {getInitials(user.name)}
                </span>
                <span className="max-w-[120px] truncate">{user.name}</span>
              </Link>

              {/* Logout button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                aria-label="Log out"
                className={`${iconBtn} cursor-pointer`}
              >
                <CircleChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`rounded-[1px] px-3.5 py-1.5 text-xs font-medium text-[#B8B5AE] transition-colors hover:text-[#EDEBE6] ${focusRing}`}
              >
                Sign in
              </Link>
              <Link to="/register" className={`${btnBase} px-4 py-1.5 text-xs`}>
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {!loading && user && (
            <Link to="/chat" className={`${btnBase} px-3 py-1.5 text-[11px]`}>
              <MessageSquare size={13} />
              <span>Chat</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`rounded-[1px] p-1.5 text-[#EDEBE6]/70 transition-colors hover:text-[#EDEBE6] ${focusRing}`}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="space-y-3 border-t border-[#2E2C29] bg-[#141311] px-6 py-4 md:hidden">
          {loading ? (
            <div className="h-10 w-full animate-pulse rounded-[1px] bg-[#EDEBE6]/5" />
          ) : user ? (
            <div className="flex flex-col space-y-3">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-[1px] border border-[#2E2C29] px-3.5 py-2.5 text-sm font-medium text-[#EDEBE6] ${focusRing}`}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-[1px] bg-[#D97757]/20 font-mono text-[11px] font-bold text-[#E2876A]">
                  {getInitials(user.name)}
                </span>
                <span className="truncate">{user.name} (Dashboard)</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className={`flex w-full items-center justify-center gap-2 rounded-[1px] border border-[#EDEBE6]/15 py-2.5 text-sm font-medium text-[#EDEBE6]/80 transition-colors hover:border-[#EDEBE6]/30 hover:text-[#EDEBE6] ${focusRing}`}
              >
                <CircleChevronRight size={16} />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm text-[#B8B5AE] transition-colors hover:text-[#EDEBE6] ${focusRing}`}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className={`${btnBase} w-full py-2.5 text-sm`}
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;