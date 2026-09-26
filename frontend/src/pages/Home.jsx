import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-5 px-4">
            <h1 className="text-[36px] font-semibold text-ink">RAGent</h1>
            <p className="text-[16px] text-ink-light text-center max-w-[420px] leading-relaxed">
                Your AI-powered document assistant. Upload PDFs, ask questions,
                and get intelligent answers — all in one place.
            </p>
            <div className="flex gap-3 mt-2">
                <Link
                    to="/register"
                    className="bg-terracotta text-white px-6 py-2.5 rounded-xl text-[14px]
                               font-medium hover:bg-terracotta-hover transition-colors"
                >
                    Get started
                </Link>
                <Link
                    to="/login"
                    className="border border-border text-ink-light px-6 py-2.5 rounded-xl
                               text-[14px] font-medium hover:bg-hover transition-colors"
                >
                    Sign in
                </Link>
            </div>
        </div>
    );
}

export default Home;
