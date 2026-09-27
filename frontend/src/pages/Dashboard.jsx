import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, ArrowLeft, MessageSquare, ChevronRight, Loader2 } from "lucide-react";
import api from "../api";
import Navbar from "../components/Navbar";

function Dashboard() {
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadData() {
            try {
                const userRes = await api.get("/auth/me");
                const chatsRes = await api.get("/chats");
                setUser(userRes.data);
                setChats(chatsRes.data);
            } catch {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
        loadData();
    }, [navigate]);

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/login");
    }

    function getInitials(name) {
        if (!name) return "?";
        const parts = name.trim().split(/\s+/);
        return parts.length > 1
            ? (parts[0][0] + parts[1][0]).toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
    }

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

    if (!user || !chats) {
        return (
            <div className="min-h-screen bg-[#191817] flex items-center justify-center">
                <Loader2 size={20} className="text-[#8A867E] animate-spin motion-reduce:animate-none" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#191817]">
            <Navbar />

            <div className="max-w-[640px] mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate("/chat")}
                        className="flex items-center gap-1.5 text-[14px] text-[#B8B5AE] hover:text-[#EDEBE6]
                                   transition-colors cursor-pointer
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded"
                    >
                        <ArrowLeft size={15} />
                        Back to chats
                    </button>
                </div>
                {/* Profile */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-16 h-16 rounded-full bg-[#2A2826] flex items-center justify-center text-[20px] font-semibold text-[#EDEBE6] flex-shrink-0">
                        {getInitials(user.name)}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-[20px] font-semibold text-[#EDEBE6] truncate">{user.name}</h1>
                        <p className="text-[14px] text-[#8A867E] truncate">{user.email}</p>
                    </div>
                </div>

                {/* Chat history */}
                <div>
                    <h2 className="text-[15px] font-medium text-[#EDEBE6] mb-3">Your chats</h2>

                    {chats.length === 0 ? (
                        <p className="text-[14px] text-[#8A867E]">
                            No chats yet —{" "}
                            <Link to="/chat" className="text-[#D97757] hover:underline">
                                start one
                            </Link>
                            .
                        </p>
                    ) : (
                        <div className="divide-y divide-[#2E2C29] border-t border-b border-[#2E2C29]">
                            {chats.map((chat) => (
                                <button
                                    key={chat.chat_id}
                                    onClick={() => navigate(`/chat/${chat.chat_id}`)}
                                    className="w-full flex items-center justify-between gap-3 py-3.5 px-2 -mx-2 rounded-lg
                                               hover:bg-[#242220] transition-colors cursor-pointer text-left
                                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MessageSquare size={15} className="text-[#8A867E] flex-shrink-0" />
                                        <span className="text-[14px] text-[#EDEBE6] truncate">{chat.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[12px] text-[#8A867E]">{formatDate(chat.created_at)}</span>
                                        <ChevronRight size={15} className="text-[#8A867E]" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;