import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LetterGlitch from "../components/LetterGlitch";
import Navbar from "../components/Navbar";
import api from "../api";

/* ── Icons (inline SVG, so no extra dependency is needed) ── */
function Icon({ className = "h-4 w-4", children }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

const ArrowRightIcon = (props) => (
    <Icon {...props}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </Icon>
);

const ShieldCheckIcon = (props) => (
    <Icon {...props}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
    </Icon>
);

const ListChecksIcon = (props) => (
    <Icon {...props}>
        <path d="m3 17 2 2 4-4" />
        <path d="m3 7 2 2 4-4" />
        <path d="M13 6h8" />
        <path d="M13 12h8" />
        <path d="M13 18h8" />
    </Icon>
);

const LinkIcon = (props) => (
    <Icon {...props}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </Icon>
);

/* ── Content ── */
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
        icon: ShieldCheckIcon,
        title: "It fact-checks its own answers",
        description:
            "Every reply is verified against the source material before it reaches you, and widened and retried if it isn't fully backed up.",
    },
    {
        icon: ListChecksIcon,
        title: "It catches bad summaries before they're indexed",
        description:
            "A separate step spot-checks the notes RAGent writes about your document, and redoes anything that doesn't pass.",
    },
    {
        icon: LinkIcon,
        title: "Every answer points back to its source",
        description: "Responses are tagged with exactly which parts of your document they came from.",
    },
];

/* Derived from the pipelines above, so they stay accurate if the steps change */
const stats = [
    { value: "2", label: "Agentic pipelines" },
    { value: "2", label: "Self-verification passes" },
    { value: String(ingestionSteps.length), label: "Steps to prepare a PDF" },
    { value: String(retrievalSteps.length), label: "Steps to answer a question" },
];

const stack = ["FastAPI", "LangGraph", "Groq", "PostgreSQL", "pgvector", "React"];

/* Shared button styles so every CTA on the page looks identical */
const btnPrimary =
    "inline-flex items-center justify-center gap-2 rounded-[1px] bg-[#D97757] px-6 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-[#191817] " +
    "transition-colors hover:bg-[#E2876A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2876A]";

const btnSecondary =
    "inline-flex items-center justify-center gap-2 rounded-[1px] border border-[#EDEBE6]/20 bg-[#191817]/70 px-6 py-3 text-sm font-medium text-[#EDEBE6]/80 " +
    "transition-colors hover:border-[#EDEBE6]/40 hover:text-[#EDEBE6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E2876A]";

const sectionHeading = "text-3xl font-bold tracking-tight text-[#EDEBE6] md:text-4xl";

/* ── Components ── */
function Eyebrow({ children }) {
    return (
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-[#D97757]">{children}</p>
    );
}

function StepList({ label, title, subtitle, steps }) {
    return (
        <div className="rounded-[2px] border border-[#2E2C29] p-7 md:p-8">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[#D97757]">{label}</p>
            <h3 className="text-lg font-semibold tracking-tight text-[#EDEBE6]">{title}</h3>
            <p className="mt-1 text-[13px] text-[#8A867E]">{subtitle}</p>
            <ol className="mt-8 space-y-6">
                {steps.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                        <span
                            className="w-12 shrink-0 font-mono text-4xl font-bold leading-none tabular-nums text-[#EDEBE6]/[0.08]"
                            aria-hidden="true"
                        >
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="pt-0.5">
                            <p className="text-sm font-semibold text-[#EDEBE6]">{step.title}</p>
                            <p className="mt-1.5 text-[13px] leading-relaxed text-[#8A867E]">{step.description}</p>
                        </div>
                    </li>
                ))}
            </ol>
        </div>
    );
}

function Cite({ n }) {
    return (
        <sup className="mx-0.5 rounded-[1px] border border-[#4A4640] px-1 py-px font-mono text-[10px] font-medium text-[#E2876A]">
            {n}
        </sup>
    );
}

function AnswerExample() {
    return (
        <div className="relative">
            <figure
                className="relative overflow-hidden rounded-[2px] border border-[#2E2C29] bg-[#201E1C] shadow-2xl"
                aria-label="Example of a RAGent answer"
            >
                {/* Window toolbar */}
                <div
                    className="flex items-center gap-1.5 border-b border-[#2E2C29] bg-[#1B1A18] px-4 py-2.5"
                    aria-hidden="true"
                >
                    <span className="h-2.5 w-2.5 rounded-full bg-[#D97757]/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#EDEBE6]/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#EDEBE6]/10" />
                    <span className="ml-4 hidden font-mono text-[10px] text-[#8A867E] sm:block">ragent — chat</span>
                </div>

                <div className="p-5 md:p-6">
                    <p className="text-[10px] uppercase tracking-wider text-[#8A867E]">Example question</p>
                    <p className="mt-1.5 text-sm font-semibold text-[#EDEBE6]">
                        How much notice is needed to end the agreement?
                    </p>

                    <div className="my-5 border-t border-[#2E2C29]" />

                    <p className="text-sm leading-[1.7] text-[#D6D3CC]">
                        Either party must give 60 days' written notice
                        <Cite n="1" />
                        and the supplier must keep fulfilling existing orders during that period
                        <Cite n="2" />.
                    </p>

                    <div className="mt-5 flex items-start gap-2.5 rounded-[1px] border border-[#2E2C29] bg-[#EDEBE6]/[0.02] px-3.5 py-3">
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
                        <p className="text-xs leading-relaxed text-[#B8B5AE]">
                            Checked against the retrieved passages. Every statement is supported.
                        </p>
                    </div>
                </div>

                <figcaption className="space-y-1.5 border-t border-[#2E2C29] bg-[#EDEBE6]/[0.03] px-5 py-4 text-xs text-[#8A867E] md:px-6">
                    <p>
                        <span className="mr-2 font-mono tabular-nums text-[#B8B5AE]">1</span>Services agreement, page 8
                    </p>
                    <p>
                        <span className="mr-2 font-mono tabular-nums text-[#B8B5AE]">2</span>Services agreement, page 9
                    </p>
                </figcaption>
            </figure>

            {/* Glow under the window */}
            <div
                className="pointer-events-none absolute -bottom-8 left-1/2 h-20 w-3/4 -translate-x-1/2 rounded-full bg-[#D97757]/5 blur-2xl"
                aria-hidden="true"
            />
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
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/chat" className={`${btnPrimary} w-full sm:w-auto`}>
                    Open Chat
                    <ArrowRightIcon />
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register" className={`${btnPrimary} w-full sm:w-auto`}>
                    Get started
                </Link>
                <Link to="/login" className={`${btnSecondary} w-full sm:w-auto`}>
                    Sign in
                    <ArrowRightIcon />
                </Link>
            </div>
            <p className="mt-4 font-mono text-[11px] text-[#B8B5AE] [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
                No credit card · No setup
            </p>
        </>
    );
}

function Home() {
    return (
        <div className="ragent-home min-h-screen bg-[#191817] text-[#EDEBE6] antialiased">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap');
        .ragent-home { font-family: 'Geist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
        .ragent-home .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
        @keyframes heroIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            {/* Nav */}
            <Navbar />

            <main>
                {/* ── Hero (background unchanged) ── */}
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

                    <div className="relative z-10 mx-auto max-w-4xl text-center [animation:heroIn_0.6s_ease-out] motion-reduce:[animation:none]">
                        <div className="mb-8 inline-flex items-center gap-2 rounded-[1px] border border-[#EDEBE6]/15 bg-[#191817]/70 px-3 py-1 font-mono text-[11px] text-[#B8B5AE]">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#7FB38A] motion-reduce:animate-none" />
                            Answers checked against your own document
                        </div>

                        <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl [text-shadow:0_2px_24px_rgba(0,0,0,0.85)]">
                            Ask your documents anything.
                            <br className="hidden sm:inline" /> Get answers that check themselves.
                        </h1>
                        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[#EDEBE6] md:text-lg [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]">
                            Upload a PDF and RAGent reads it, retrieves the passages that matter, and verifies its own
                            answer against them before replying — so it tells you when it doesn't know, instead of
                            guessing.
                        </p>
                        <HeroCTA />
                    </div>
                </section>

                {/* ── Stats bar ── */}
                <section className="border-y border-[#2E2C29] bg-[#EDEBE6]/[0.02]">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4">
                            {stats.map((s, i) => (
                                <div
                                    key={s.label}
                                    className={[
                                        "border-[#2E2C29] px-6 py-8 text-center",
                                        i % 2 === 1 ? "border-l" : "",
                                        i >= 2 ? "border-t md:border-t-0" : "",
                                        i > 0 ? "md:border-l" : "md:border-l-0",
                                    ].join(" ")}
                                >
                                    <p className="mb-1 text-3xl font-bold text-[#EDEBE6]">{s.value}</p>
                                    <p className="text-[11px] uppercase tracking-wider text-[#8A867E]">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Example answer ── */}
                <section className="px-6 py-24">
                    <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2 md:gap-16">
                        <div>
                            <Eyebrow>Cited answers</Eyebrow>
                            <h2 className={sectionHeading}>Answers you can check</h2>
                            <p className="mt-4 max-w-[420px] text-sm leading-relaxed text-[#8A867E]">
                                Each reply cites the passages it came from. When your document doesn't contain the
                                answer, RAGent says so instead of filling the gap.
                            </p>
                        </div>
                        <AnswerExample />
                    </div>
                </section>

                {/* ── How it works ── */}
                <section className="border-t border-[#2E2C29] bg-[#EDEBE6]/[0.02] px-6 py-24">
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-14">
                            <Eyebrow>Two pipelines</Eyebrow>
                            <h2 className={sectionHeading}>How RAGent works</h2>
                            <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-[#8A867E]">
                                Two agentic pipelines run behind every document: one when you upload, and one every
                                time you ask a question.
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <StepList
                                label="Pipeline 1"
                                title="When you upload a PDF"
                                subtitle="Prepares the document for search."
                                steps={ingestionSteps}
                            />
                            <StepList
                                label="Pipeline 2"
                                title="When you ask a question"
                                subtitle="Finds, answers, and double-checks."
                                steps={retrievalSteps}
                            />
                        </div>
                    </div>
                </section>

                {/* ── Differentiators ── */}
                <section className="border-t border-[#2E2C29] px-6 py-24">
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-14">
                            <Eyebrow>Why RAGent</Eyebrow>
                            <h2 className={`${sectionHeading} max-w-[560px]`}>
                                What makes this different from a plain Q&amp;A bot
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-px bg-[#2E2C29] md:grid-cols-3">
                            {differentiators.map((item) => {
                                const Glyph = item.icon;
                                return (
                                    <div
                                        key={item.title}
                                        className="group bg-[#191817] p-8 transition-colors hover:bg-[#201E1C]"
                                    >
                                        <div className="mb-5 flex h-8 w-8 items-center justify-center rounded-[1px] border border-[#3D3A36] transition-colors group-hover:border-[#D97757]/40">
                                            <Glyph className="h-4 w-4 text-[#8A867E] transition-colors group-hover:text-[#D97757]" />
                                        </div>
                                        <h3 className="mb-2 text-sm font-semibold text-[#EDEBE6]">{item.title}</h3>
                                        <p className="text-[13px] leading-relaxed text-[#8A867E]">
                                            {item.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ── Final CTA ── */}
                <section className="border-t border-[#2E2C29] bg-[#EDEBE6]/[0.02] px-6 py-24">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className={`${sectionHeading} mb-4`}>Try it with your own PDF</h2>
                        <p className="mb-8 text-sm leading-relaxed text-[#8A867E]">
                            No credit card, no setup. Just a document and a question.
                        </p>
                        <Link to="/register" className={btnPrimary}>
                            Get started
                        </Link>
                    </div>
                </section>
            </main>

            {/* ── Footer ── */}
            <footer className="border-t border-[#2E2C29] px-6 py-8">
                <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 lg:flex-row">
                    <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-[0.5px] bg-[#D97757]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A867E]">
                            RAGent
                        </span>
                    </div>

                    <span className="font-mono text-[11px] text-[#8A867E]">Built by Chinmaye H.G</span>

                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
                        <ul
                            className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-mono text-[11px] text-[#8A867E]"
                            aria-label="Built with"
                        >
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
                </div>
            </footer>
        </div>
    );
}

export default Home;