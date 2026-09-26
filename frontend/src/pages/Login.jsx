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
            const token = res.data.token;
            if (token) localStorage.setItem("token", token);
            navigate("/chat");
        } catch {
            setError("Invalid email or password");
        }
    }

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-[380px] flex flex-col gap-4"
            >
                <h2 className="text-[24px] font-semibold text-ink text-center mb-2">
                    Sign in to RAGent
                </h2>

                {error && (
                    <p className="text-[13px] text-terracotta text-center">{error}</p>
                )}

                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email"
                    required
                    className="border border-border rounded-xl px-4 py-3 text-[15px] text-ink
                               bg-cream outline-none focus:border-ink-muted transition-colors
                               placeholder:text-ink-muted"
                />
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Password"
                    required
                    className="border border-border rounded-xl px-4 py-3 text-[15px] text-ink
                               bg-cream outline-none focus:border-ink-muted transition-colors
                               placeholder:text-ink-muted"
                />

                <button
                    type="submit"
                    className="bg-terracotta text-white rounded-xl px-4 py-3 text-[15px]
                               font-medium hover:bg-terracotta-hover transition-colors cursor-pointer mt-1"
                >
                    Sign in
                </button>

                <p className="text-[13px] text-ink-muted text-center">
                    No account?{" "}
                    <Link to="/register" className="text-terracotta hover:underline">
                        Create one
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Login;