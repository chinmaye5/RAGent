import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LetterGlitch from "../components/LetterGlitch";
import Navbar from "../components/Navbar";
import api from "../api";

const ingestionSteps = [
    { title: "Classify", description: "Reads the PDF and tags what kind of document it is." },
    { title: "Chunk", description: "Splits the text into overlapping pieces sized for retrieval." },
    { title: "Enrich", description: "Writes a short context note for each piece before embedding it." },
    { title: "Verify", description: "Spot-checks its own notes and redoes anything that doesn't hold up." },
    { title: "Store", description: "Saves everything as searchable vectors, ready for questions." },
];

const retrievalSteps = [
    { title: "Retrieve", description: "Finds the passages closest in meaning to your question." },
    { title: "Answer", description: "Responds using only what it found — nothing invented." },
    { title: "Verify", description: "Fact-checks its own answer against the retrieved passages." },
    { title: "Widen & retry", description: "If anything's unsupported, it searches further and tries again." },
];

const differentiators = [
    {
        title: "It fact-checks its own answers",
        description:
            "Every reply is verified against the source material before it reaches you, and widened and retried if it isn't fully backed up.",
    },
    {
        title: "It catches bad summaries before they're indexed",
        description:
            "A separate step spot-checks the notes RAGent writes about your document, and redoes anything that doesn't pass.",
    },
    {
        title: "Every answer points back to its source",
        description: "Responses are tagged with exactly which parts of your document they came from.",
    },
];

const stack = ["FastAPI", "LangGraph", "Groq", "PostgreSQL", "pgvector", "React"];

function PipelineFlow({ steps }) {
    // Tailwind's compiler needs literal class strings, not a runtime-built one like
    // `md:grid-cols-${steps.length}` — so the two options are spelled out explicitly.
    const gridColsClass = steps.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4";

    return (
        <div className="relative mt-8">
            <div
                className="hidden md:block absolute top-5 h-px bg-[#2E2C29]"
                style={{ left: `${100 / steps.length / 2}%`, right: `${100 / steps.length / 2}%` }}
            />
            <div className={`relative z-10 grid grid-cols-1 ${gridColsClass} gap-8 md:gap-4`}>
                {steps.map((step, i) => (
                    <div key={i} className="flex md:flex-col items-start md:items-center gap-3 md:gap-2.5 md:text-center">
                        <div className="w-10 h-10 rounded-full bg-[#191817] border-2 border-[#D97757] flex items-center justify-center text-[#E2876A] text-[14px] font-semibold flex-shrink-0">
                            {i + 1}
                        </div>
                        <div>
                            <h4 className="text-[15px] font-semibold text-[#EDEBE6] mb-1">{step.title}</h4>
                            <p className="text-[13px] text-[#8A867E] leading-relaxed md:max-w-[150px] mx-auto">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HeroCTA() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            api.get("/auth/me")
                .then((res) => setUser(res.data))
                .catch(() => setUser(null));
        }
    }, []);

    if (user) {
        return (
            <div className="flex items-center justify-center gap-4">
                <Link
                    to="/chat"
                    className="bg-[#D97757] text-white px-7 py-3 rounded-xl text-[15px] font-semibold
                             hover:bg-[#C4653F] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#D97757]/30"
                >
                    Open Chat
                </Link>
                <Link
                    to="/dashboard"
                    className="border-2 border-[#3D3A36] bg-[#191817]/80 text-[#FFFFFF] px-7 py-3 rounded-xl text-[15px]
                             font-semibold hover:bg-[#242220] hover:border-[#E2876A]/40 transition-all transform hover:-translate-y-0.5 shadow-md"
                >
                    View Profile ({user.name})
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-4">
            <Link
                to="/register"
                className="bg-[#D97757] text-white px-7 py-3 rounded-xl text-[15px] font-semibold
                         hover:bg-[#C4653F] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#D97757]/30"
            >
                Get started
            </Link>
            <Link
                to="/login"
                className="border-2 border-[#3D3A36] bg-[#191817]/80 text-[#FFFFFF] px-7 py-3 rounded-xl text-[15px]
                         font-semibold hover:bg-[#242220] hover:border-[#E2876A]/40 transition-all transform hover:-translate-y-0.5 shadow-md"
            >
                Sign in
            </Link>
        </div>
    );
}

function Home() {
    return (
        <div className="bg-[#191817] min-h-screen">
            <style>{`
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Nav */}
            <Navbar />

            {/* Hero */}
            <section className="relative px-6 pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden min-h-[520px] flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <LetterGlitch
                        glitchColors={['#D97757', '#E2876A', '#3A3430', '#252321']}
                        glitchSpeed={60}
                        centerVignette={true}
                        outerVignette={true}
                        smooth={true}
                        backgroundColor="#191817"
                    />
                </div>

                <div
                    className="relative z-10 max-w-[700px] mx-auto text-center [animation:heroIn_0.6s_ease-out] motion-reduce:[animation:none]"
                >
                    <h1 className="text-[36px] md:text-[48px] font-bold text-[#FFFFFF] leading-[1.15] mb-5 tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
                        Ask your documents anything. <br className="hidden sm:inline" />
                        <span className="text-[#E2876A]">Get answers that check themselves.</span>
                    </h1>
                    <p className="text-[16px] md:text-[17px] font-semibold text-[#FFFFFF] leading-relaxed mb-9 max-w-[580px] mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        Upload a PDF and RAGent reads it, retrieves the passages that matter, and verifies its own
                        answer against them before replying — so it tells you when it doesn't know, instead of
                        guessing.
                    </p>
                    <HeroCTA />
                </div>
            </section>

            {/* How it works */}
            <section className="px-6 py-20 md:py-24 border-t border-[#2E2C29]">
                <div className="max-w-[1000px] mx-auto">
                    <h2 className="text-[26px] font-semibold text-[#EDEBE6] text-center mb-2">
                        How RAGent actually works
                    </h2>
                    <p className="text-[15px] text-[#8A867E] text-center mb-16 max-w-[480px] mx-auto leading-relaxed">
                        Two agentic pipelines run behind every document — one when you upload, one every time you ask
                        a question.
                    </p>

                    <div className="mb-16">
                        <p className="text-[13px] font-medium text-[#E2876A] mb-1">When you upload a PDF</p>
                        <PipelineFlow steps={ingestionSteps} />
                    </div>

                    <div>
                        <p className="text-[13px] font-medium text-[#E2876A] mb-1">When you ask a question</p>
                        <PipelineFlow steps={retrievalSteps} />
                    </div>
                </div>
            </section>

            {/* Differentiators */}
            <section className="px-6 py-20 md:py-24 border-t border-[#2E2C29]">
                <div className="max-w-[720px] mx-auto">
                    <h2 className="text-[26px] font-semibold text-[#EDEBE6] text-center mb-14">
                        What makes this different from a plain Q&amp;A bot
                    </h2>
                    <div className="flex flex-col gap-8">
                        {differentiators.map((item, i) => (
                            <div key={i} className="border-l-2 border-[#D97757] pl-5">
                                <h3 className="text-[16px] font-semibold text-[#EDEBE6] mb-1.5">{item.title}</h3>
                                <p className="text-[14px] text-[#8A867E] leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech stack */}
            <section className="px-6 py-16 border-t border-[#2E2C29]">
                <div className="max-w-[720px] mx-auto text-center">
                    <p className="text-[13px] text-[#8A867E] mb-4">Built with</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {stack.map((tech) => (
                            <span
                                key={tech}
                                className="text-[13px] text-[#B8B5AE] bg-[#242220] border border-[#2E2C29] rounded-full px-3.5 py-1.5"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-6 py-20 bg-[#141311] border-t border-[#2E2C29]">
                <div className="max-w-[480px] mx-auto text-center">
                    <h2 className="text-[24px] font-semibold text-[#EDEBE6] mb-3">Try it with your own PDF</h2>
                    <p className="text-[14px] text-[#8A867E] mb-7 leading-relaxed">
                        No credit card, no setup — just a document and a question.
                    </p>
                    <Link
                        to="/register"
                        className="inline-block bg-[#D97757] text-white px-7 py-3 rounded-xl text-[14px] font-medium
                       hover:bg-[#C4653F] transition-colors"
                    >
                        Get started
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-[#2E2C29]">
                <div className="max-w-[1100px] mx-auto flex items-center justify-between">
                    <span className="text-[13px] text-[#8A867E]">Built by Chinmaye H.G</span>
                    <a
                        href="https://github.com/chinmaye5/RAGent"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View RAGent on GitHub"
                        className="text-[#8A867E] hover:text-[#EDEBE6] transition-colors"
                    >
                        <svg className="w-[17px] h-[17px]" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                    </a>
                </div>
            </footer>
        </div>
    );
}

export default Home;