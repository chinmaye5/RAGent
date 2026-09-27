import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import api from "../api";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.post("/auth/login", { email, password });
            const token = res.data.token;
            if (token) localStorage.setItem("token", token);
            navigate("/chat");
        } catch {
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#191817] flex flex-col items-center justify-center px-4">
            <Link to="/" className="flex items-center gap-2 mb-8">
                <div className="w-7 h-7 rounded-md bg-[#D97757] flex items-center justify-center text-white text-[13px] font-bold">
                    R
                </div>
                <span className="text-[16px] font-semibold text-[#EDEBE6]">RAGent</span>
            </Link>

            <form
                onSubmit={handleSubmit}
                className="w-full max-w-[380px] flex flex-col gap-3.5"
            >
                <h2 className="text-[22px] font-semibold text-[#EDEBE6] text-center mb-1">
                    Sign in to RAGent
                </h2>
                <p className="text-[14px] text-[#8A867E] text-center mb-3">
                    Pick up where you left off with your documents.
                </p>

                {error && (
                    <p className="text-[13px] text-[#E5484D] text-center bg-[#E5484D]/10 rounded-lg py-2 px-3">
                        {error}
                    </p>
                )}

                <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="Email"
                    required
                    className="border border-[#2E2C29] rounded-xl px-4 py-3 text-[15px] text-[#EDEBE6]
                               bg-[#1F1E1C] outline-none focus:border-[#4A4744] transition-colors
                               placeholder:text-[#8A867E]"
                />

                <div className="relative">
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="Password"
                        required
                        className="w-full border border-[#2E2C29] rounded-xl pl-4 pr-11 py-3 text-[15px] text-[#EDEBE6]
                                   bg-[#1F1E1C] outline-none focus:border-[#4A4744] transition-colors
                                   placeholder:text-[#8A867E]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A867E] hover:text-[#EDEBE6]
                                   transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-[#D97757]/50 rounded"
                    >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-[#D97757] text-white rounded-xl px-4 py-3
                               text-[15px] font-medium hover:bg-[#C4653F] transition-colors cursor-pointer mt-1
                               disabled:opacity-60 disabled:cursor-not-allowed
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50"
                >
                    {loading && <Loader2 size={16} className="animate-spin" />}
                    {loading ? "Signing in..." : "Sign in"}
                </button>

                <p className="text-[13px] text-[#8A867E] text-center mt-1">
                    No account?{" "}
                    <Link to="/register" className="text-[#D97757] hover:text-[#E2876A] hover:underline">
                        Create one
                    </Link>
                </p>
            </form>
        </div>
    );
}

export default Login;