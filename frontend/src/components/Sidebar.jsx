// Sidebar.jsx — logomark, prominent "New chat" CTA, chats grouped by date, user footer.
// Colors are hardcoded (not custom Tailwind tokens) so this renders correctly regardless
// of your project's Tailwind config.

import { Link } from "react-router-dom";
import { Plus, CircleChevronRight, Trash2 } from "lucide-react";
import logoImg from "../assets/logo.png";
import LatticeLoader from "./LatticeLoader";

function Sidebar({ chats, activeChatId, userName, onSelectChat, onNewChat, onDeleteChat, onLogout, onNavigateToDashboard, isOpen, onClose }) {
  function getInitials(name) {

    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length > 1
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }

  function groupChatsByDate(list) {
    const now = new Date();
    const groups = { Today: [], Yesterday: [], "Previous 7 days": [], Older: [] };

    list.forEach((chat) => {
      if (!chat.created_at) {
        groups.Older.push(chat);
        return;
      }
      const diffDays = Math.floor((now - new Date(chat.created_at)) / 86400000);
      if (diffDays === 0) groups.Today.push(chat);
      else if (diffDays === 1) groups.Yesterday.push(chat);
      else if (diffDays < 7) groups["Previous 7 days"].push(chat);
      else groups.Older.push(chat);
    });

    return Object.entries(groups).filter(([, items]) => items.length > 0);
  }

  const grouped = groupChatsByDate(chats);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] min-w-[260px] bg-[#141311] border-r border-[#2E2C29] flex flex-col h-screen transform transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
      >

        {/* Logo */}
        <div className="px-4 pt-5 pb-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoImg} alt="RAGent" className="w-7 h-7 object-contain rounded-md" />
            <span className="text-[15px] font-semibold text-[#EDEBE6] group-hover:text-white transition-colors">RAGent</span>
          </Link>
        </div>

        {/* New chat — full-width prominent CTA */}
        <div className="px-3 pb-3">
          <button
            onClick={onNewChat}
            aria-label="Start a new chat"
            className="w-full flex items-center justify-center gap-1.5 bg-[#D97757] text-white
                     text-[13px] font-medium px-3 py-2 rounded-lg hover:bg-[#C4653F]
                     transition-colors cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50"
          >
            <Plus size={14} />
            New chat
          </button>
        </div>

        {/* Chat list, grouped by date */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {grouped.map(([label, items]) => (
            <div key={label} className="mb-4">
              <p className="text-[11px] text-[#8A867E] px-3 mb-1">{label}</p>
              {items.map((chat) => {
                const active = chat.chat_id === activeChatId;
                return (
                  <div
                    key={chat.chat_id}
                    onClick={() => onSelectChat(chat.chat_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onSelectChat(chat.chat_id)}
                    className={`group relative px-3 py-2 rounded-lg cursor-pointer mb-0.5 transition-colors flex items-center justify-between gap-2
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50
                             ${active ? "bg-[#242220]" : "hover:bg-[#242220]"}`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-[#D97757]" />
                    )}
                    <p className="text-[13px] text-[#EDEBE6] truncate leading-snug flex-1">{chat.title}</p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.chat_id);
                      }}
                      title="Delete chat"
                      aria-label="Delete chat"
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#8A867E] hover:text-[#E5484D] transition-all rounded hover:bg-[#2E2C29]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

          {chats.length === 0 && (
            <p className="text-[13px] text-[#8A867E] text-center mt-10 leading-relaxed">
              <LatticeLoader
                status="working"
                label="Loading conversation"
                pattern="orbit"
                grid={3}
                color="#D97757"
                showTimer={false}
              />
            </p>
          )}
        </div>

        {/* User footer */}
        <div className="px-4 py-3 border-t border-[#2E2C29] flex items-center gap-2.5">
          <button
            onClick={onNavigateToDashboard}
            title="View profile & dashboard"
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity cursor-pointer text-left
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded"
          >
            <div className="w-7 h-7 rounded-full bg-[#2A2826] flex items-center justify-center text-[11px] font-medium text-[#EDEBE6] flex-shrink-0">
              {getInitials(userName)}
            </div>
            <span className="text-[13px] text-[#B8B5AE] truncate flex-1">{userName || "User"}</span>
          </button>
          <button
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="text-[#8A867E] hover:text-[#EDEBE6] transition-colors cursor-pointer
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded"
          >
            <CircleChevronRight size={15} />
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;