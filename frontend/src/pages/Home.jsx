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

/* Shared button styles so every CTA on the page looks identical */
const btnPrimary =
    "inline-flex items-center justify-center rounded-lg bg-[#D97757] px-5 py-2.5 text-[15px] font-medium text-[#191817] " +
    "transition-colors hover:bg-[#E2876A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2876A]";

const btnSecondary =
    "inline-flex items-center justify-center rounded-lg border border-[#4A4640] bg-[#191817]/70 px-5 py-2.5 text-[15px] font-medium text-[#EDEBE6] " +
    "transition-colors hover:border-[#6B665E] hover:bg-[#242220] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2876A]";

function StepList({ title, subtitle, steps }) {
    return (
        <div>
            <h3 className="text-[18px] font-semibold tracking-tight text-[#EDEBE6]">{title}</h3>
            <p className="mt-1 text-[14px] text-[#8A867E]">{subtitle}</p>
            <ol className="mt-6 border-t border-[#2E2C29]">
                {steps.map((step, i) => (
                    <li
                        key={step.title}
                        className="grid grid-cols-[2rem_1fr] gap-x-3 border-b border-[#2E2C29] py-4"
                    >
                        <span className="pt-px text-[14px] tabular-nums text-[#8A867E]">{i + 1}</span>
                        <div>
                            <p className="text-[15px] font-medium text-[#EDEBE6]">{step.title}</p>
                            <p className="mt-1 text-[14px] leading-relaxed text-[#8A867E]">{step.description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function Cite({ n }) {
    return (
        <sup className="mx-0.5 rounded border border-[#4A4640] px-1 py-px text-[11px] font-medium text-[#E2876A]">
            {n}
        </sup>
    );
}

function AnswerExample() {
    return (
        <figure
            className="rounded-xl border border-[#2E2C29] bg-[#201E1C] p-6 md:p-7"
            aria-label="Example of a RAGent answer"
        >
            <p className="text-[13px] text-[#8A867E]">Example question</p>
            <p className="mt-1.5 text-[16px] font-medium text-[#EDEBE6]">
                How much notice is needed to end the agreement?
            </p>

            <div className="my-5 border-t border-[#2E2C29]" />

            <p className="text-[15px] leading-[1.7] text-[#D6D3CC]">
                Either party must give 60 days' written notice
                <Cite n="1" />
                and the supplier must keep fulfilling existing orders during that period
                <Cite n="2" />.
            </p>

            <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-[#191817] px-3.5 py-3">
                <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#7FB38A]"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M4 10.5l4 4 8-9" />
                </svg>
                <p className="text-[13px] leading-relaxed text-[#B8B5AE]">
                    Checked against the retrieved passages. Every statement is supported.
                </p>
            </div>

            <figcaption className="mt-5 space-y-1.5 text-[13px] text-[#8A867E]">
                <p>
                    <span className="mr-2 tabular-nums text-[#B8B5AE]">1</span>Services agreement, page 8
                </p>
                <p>
                    <span className="mr-2 tabular-nums text-[#B8B5AE]">2</span>Services agreement, page 9
                </p>
            </figcaption>
        </figure>
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
            <div className="flex items-center justify-center gap-3">
                <Link to="/chat" className={btnPrimary}>
                    Open Chat
                </Link>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-3">
            <Link to="/register" className={btnPrimary}>
                Get started
            </Link>
            <Link to="/login" className={btnSecondary}>
                Sign in
            </Link>
        </div>
    );
}

function Home() {
    return (
        <div className="ragent-home min-h-screen bg-[#191817] text-[#EDEBE6] antialiased">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap');
        .ragent-home { font-family: 'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Nav */}
            <Navbar />

            <main>
                {/* Hero */}
                <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden px-6 pt-24 pb-20 md:pt-32 md:pb-28">
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

                    <div className="relative z-10 mx-auto max-w-[720px] text-center [animation:heroIn_0.6s_ease-out] motion-reduce:[animation:none]">
                        <h1 className="mb-6 text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] text-white md:text-[58px] [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
                            Ask your documents anything.
                            <br className="hidden sm:inline" /> Get answers that check themselves.
                        </h1>
                        <p className="mx-auto mb-9 max-w-[560px] text-[16px] leading-relaxed text-[#EDEBE6] md:text-[18px] [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
                            Upload a PDF and RAGent reads it, retrieves the passages that matter, and verifies its own
                            answer against them before replying — so it tells you when it doesn't know, instead of
                            guessing.
                        </p>
                        <HeroCTA />
                    </div>
                </section>

                {/* Example answer */}
                <section className="border-t border-[#2E2C29] px-6 py-20 md:py-28">
                    <div className="mx-auto grid max-w-[1100px] items-center gap-12 md:grid-cols-2 md:gap-20">
                        <div>
                            <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[34px]">
                                Answers you can check
                            </h2>
                            <p className="mt-4 max-w-[440px] text-[16px] leading-relaxed text-[#8A867E]">
                                Each reply cites the passages it came from. When your document doesn't contain the
                                answer, RAGent says so instead of filling the gap.
                            </p>
                        </div>
                        <AnswerExample />
                    </div>
                </section>

                {/* How it works */}
                <section className="border-t border-[#2E2C29] px-6 py-20 md:py-28">
                    <div className="mx-auto max-w-[1100px]">
                        <h2 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[34px]">
                            How RAGent works
                        </h2>
                        <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-[#8A867E]">
                            Two agentic pipelines run behind every document: one when you upload, and one every time
                            you ask a question.
                        </p>

                        <div className="mt-14 grid gap-14 md:grid-cols-2 md:gap-20">
                            <StepList
                                title="When you upload a PDF"
                                subtitle="Prepares the document for search."
                                steps={ingestionSteps}
                            />
                            <StepList
                                title="When you ask a question"
                                subtitle="Finds, answers, and double-checks."
                                steps={retrievalSteps}
                            />
                        </div>
                    </div>
                </section>

                {/* Differentiators */}
                <section className="border-t border-[#2E2C29] px-6 py-20 md:py-28">
                    <div className="mx-auto max-w-[1100px]">
                        <h2 className="max-w-[560px] text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[34px]">
                            What makes this different from a plain Q&amp;A bot
                        </h2>
                        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-12">
                            {differentiators.map((item) => (
                                <div key={item.title} className="border-t border-[#3D3A36] pt-5">
                                    <h3 className="text-[16px] font-semibold text-[#EDEBE6]">{item.title}</h3>
                                    <p className="mt-2 text-[14px] leading-relaxed text-[#8A867E]">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="border-t border-[#2E2C29] bg-[#141311] px-6 py-20 md:py-24">
                    <div className="mx-auto flex max-w-[1100px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-[26px] font-semibold tracking-[-0.02em] md:text-[30px]">
                                Try it with your own PDF
                            </h2>
                            <p className="mt-2 text-[15px] text-[#8A867E]">
                                No credit card, no setup. Just a document and a question.
                            </p>
                        </div>
                        <Link to="/register" className={`${btnPrimary} self-start md:self-auto`}>
                            Get started
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-[#2E2C29] px-6 py-8">
                <div className="mx-auto flex max-w-[1100px] flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <span className="text-[13px] text-[#8A867E]">Built by Chinmaye H.G</span>

                    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-[#8A867E]" aria-label="Built with">
                        {stack.map((tech) => (
                            <li key={tech}>{tech}</li>
                        ))}
                    </ul>

                    <a
                        href="https://github.com/chinmaye5/RAGent"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View RAGent on GitHub"
                        className="text-[#8A867E] transition-colors hover:text-[#EDEBE6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E2876A]"
                    >
                        <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                        </svg>
                    </a>
                </div>
            </footer>
        </div>
    );
}

export default Home;