import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadUser() {
            try {
                const res = await api.get("/auth/me");
                setUser(res.data);
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
        </div>
    );
}

export default Dashboard;