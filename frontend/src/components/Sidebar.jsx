// Sidebar.jsx — Chat history list, new chat button, user info + logout

function Sidebar({ chats, activeChatId, userName, onSelectChat, onNewChat, onLogout }) {

  // Format dates into readable labels
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  return (
    <aside className="w-[260px] min-w-[260px] bg-sidebar border-r border-border flex flex-col h-screen">

      {/* Top — app name + new chat button */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <span className="text-[15px] font-semibold text-ink">RAGent</span>
        <button
          onClick={onNewChat}
          className="bg-terracotta text-white text-[13px] font-medium px-3 py-1.5 rounded-lg
                     hover:bg-terracotta-hover transition-colors cursor-pointer"
        >
          + New chat
        </button>
      </div>

      {/* Chat list — scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            onClick={() => onSelectChat(chat.chat_id)}
            className={`px-3 py-2.5 rounded-lg cursor-pointer mb-0.5 transition-colors
              ${chat.chat_id === activeChatId ? "bg-hover" : "hover:bg-hover"}`}
          >
            <p className="text-[13px] text-ink truncate leading-snug">
              {chat.title}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {formatDate(chat.created_at)}
            </p>
          </div>
        ))}

        {chats.length === 0 && (
          <p className="text-[13px] text-ink-muted text-center mt-10">
            No chats yet.<br />Upload a PDF to start!
          </p>
        )}
      </div>

      {/* Bottom — user info + logout */}
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <span className="text-[13px] text-ink-light truncate">{userName || "User"}</span>
        <button
          onClick={onLogout}
          className="text-[12px] text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          Log out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
