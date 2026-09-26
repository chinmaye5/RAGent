// ChatPage.jsx — Main chat page that assembles Sidebar + ChatMessages + ChatInput
//
// This is the only "smart" component — it holds all state and passes data
// down to the child components via props. The children are pure display components.

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Sidebar";
import ChatMessages from "../components/ChatMessages";
import ChatInput from "../components/ChatInput";

function ChatPage() {
  // ─── State ───
  const [user, setUser] = useState(null);            // logged-in user info { name, email }
  const [chats, setChats] = useState([]);             // list of all user's chats (sidebar)
  const [activeChatId, setActiveChatId] = useState(null);   // currently selected chat
  const [activeDocId, setActiveDocId] = useState(null);     // doc linked to active chat
  const [messages, setMessages] = useState([]);       // messages in the active chat
  const [question, setQuestion] = useState("");       // text input value
  const [sending, setSending] = useState(false);      // true while waiting for AI reply
  const [file, setFile] = useState(null);             // selected PDF (not yet uploaded)
  const [uploading, setUploading] = useState(false);  // true while uploading PDF

  const navigate = useNavigate();
  const { chatId: urlChatId } = useParams();          // chat id from the URL (optional)

  // ─── Load user info + chat list on first render ───
  useEffect(() => {
    async function init() {
      try {
        const userRes = await api.get("/auth/me");
        setUser(userRes.data);

        const chatsRes = await api.get("/chats");
        setChats(chatsRes.data);
      } catch {
        // Token is invalid or missing — send to login
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
    init();
  }, [navigate]);

  // ─── When URL changes to a specific chat, load its messages ───
  useEffect(() => {
    if (urlChatId && chats.length > 0) {
      loadChat(urlChatId);
    }
  }, [urlChatId, chats]);

  // ─── Load messages for a specific chat ───
  async function loadChat(chatId) {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);

      // Backend returns [{ sender, text }] — map to { role, content }
      setMessages(
        res.data.map((m) => ({
          role: m.sender,
          content: m.text,
        }))
      );

      // Find the doc_id from the chat list so we can continue chatting
      const chat = chats.find((c) => c.chat_id === chatId);
      setActiveDocId(chat?.doc_id || null);
      setActiveChatId(chatId);
    } catch (err) {
      console.error("Failed to load chat:", err);
    }
  }

  // ─── Sidebar: click a chat ───
  function handleSelectChat(chatId) {
    navigate(`/chat/${chatId}`);
  }

  // ─── Sidebar: start a new chat ───
  function handleNewChat() {
    setActiveChatId(null);
    setActiveDocId(null);
    setMessages([]);
    setQuestion("");
    setFile(null);
    navigate("/chat");
  }

  // ─── Sidebar: logout ───
  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  // ─── Send a message ───
  async function handleSend(e) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    // If user picked a file but hasn't uploaded it yet, upload first
    let docId = activeDocId;
    if (file && !docId) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await api.post("/document/upload", formData);
        docId = uploadRes.data.doc_id;
        setActiveDocId(docId);
        setFile(null);
      } catch (err) {
        console.error("Upload failed:", err);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (!docId) {
      alert("Please upload a PDF document first!");
      return;
    }

    // Show user message immediately (optimistic UI)
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuestion("");
    setSending(true);

    try {
      const res = await api.post("/chat", {
        doc_id: docId,
        question: trimmed,
        chat_id: activeChatId || undefined,
      });

      const { answer, chat_id: returnedChatId, sources } = res.data;

      // Add assistant reply
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: answer, sources: sources || [] },
      ]);

      // If this was a brand-new chat, update state and refresh sidebar
      if (!activeChatId && returnedChatId) {
        setActiveChatId(returnedChatId);
        navigate(`/chat/${returnedChatId}`, { replace: true });

        const chatsRes = await api.get("/chats");
        setChats(chatsRes.data);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ─── Render ───
  return (
    <div className="flex h-screen bg-cream">

      {/* Left: Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        userName={user?.name}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
      />

      {/* Right: Main chat area */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Header — shows chat title */}
        <div className="px-6 py-3 border-b border-border">
          <h3 className="text-[15px] font-medium text-ink">
            {activeChatId
              ? chats.find((c) => c.chat_id === activeChatId)?.title || "Chat"
              : "New conversation"}
          </h3>
        </div>

        {/* Messages area */}
        <ChatMessages
          messages={messages}
          sending={sending}
          userName={user?.name}
        />

        {/* Input bar */}
        <ChatInput
          question={question}
          setQuestion={setQuestion}
          file={file}
          setFile={setFile}
          onSend={handleSend}
          disabled={sending || uploading}
        />
      </main>
    </div>
  );
}

export default ChatPage;
