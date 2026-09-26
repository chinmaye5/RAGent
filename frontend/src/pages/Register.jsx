import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        try {
            const res = await api.post("/auth/register", { name, email, password });
            const token = typeof res.data === "string" ? res.data : res.data.access_token;
            localStorage.setItem("token", token);
            navigate("/dashboard");
        } catch (err) {
            setError("Registration failed — email may already be in use");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required />
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
            <button type="submit">Register</button>
            <p>Already have an account? <Link to="/login">Login</Link></p>
        </form>
    );
}

export default Register;