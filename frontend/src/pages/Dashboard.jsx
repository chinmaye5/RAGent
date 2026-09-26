import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import api from "../api";

function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const [chats, setChats] = useState(null)

    useEffect(() => {
        async function loadUser() {
            try {
                const res = await api.get("/auth/me");
                const chats = await api.get("/chats")
                setUser(res.data);
                setChats(chats.data)
            } catch (err) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
        loadUser();
    }, []);

    function handleLogout() {
        localStorage.removeItem("token");
        navigate("/login");
    }

    if (!user) return <p>Loading...</p>;

    return (
        <div>
            <h2>Dashboard</h2>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
            <button onClick={handleLogout}>Logout</button>
            <h1>Previous Chats</h1>
            {chats.map((chat) => (
                <div key={chat.chat_id}>
                    <p>Topic: {chat.title}</p>
                    <p>created at: {chat.created_at}</p>
                    <button onClick={() => navigate(`/chat/${chat.chat_id}`)}>Chat</button>
                </div>
            ))}
        </div>
    );
}

export default Dashboard;