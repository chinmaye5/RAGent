import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        try {
            const res = await api.post("/auth/login", { email, password });
            // Backend returns token under 'token' key
            const token = typeof res.data === "string" ? res.data : res.data.token;
            if (token) {
                localStorage.setItem("token", token);
            }
            navigate("/dashboard");
        } catch (err) {
            setError("Invalid email or password");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
            <button type="submit">Login</button>
            <p>No account? <Link to="/register">Register</Link></p>
        </form>
    );
}

export default Login;