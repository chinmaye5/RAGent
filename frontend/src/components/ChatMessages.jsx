// ChatMessages.jsx — message list, "document style" like Claude: user messages get a
// subtle bubble, assistant replies render as real Markdown (headings, bold, lists, tables,
// code, links) instead of raw text. Source chunks render as small numbered citation chips.
// Colors are hardcoded so this renders correctly regardless of your Tailwind config.

import { useEffect, useRef, useState } from "react";
import { Loader2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import LatticeLoader from "./LatticeLoader";

function ChatMessages({ messages, sending, uploading, loadingChat, userName }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, uploading, loadingChat]);

  if (loadingChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <LatticeLoader
          status="working"
          label="Loading conversation"
          pattern="orbit"
          grid={3}
          color="#D97757"
          showTimer={false}
        />
      </div>
    );
  }

  const isEmpty = messages.length === 0 && !sending && !uploading;

  if (isEmpty) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-10 h-10 rounded-full bg-[#D97757] flex items-center justify-center text-white text-[16px] font-bold mb-4">
          R
        </div>
        <h1 className="text-[22px] font-semibold text-[#EDEBE6] mb-2">RAGent</h1>
        <p className="text-[14px] text-[#8A867E] text-center max-w-[380px] leading-relaxed">
          Upload a PDF and start asking questions — your answers will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-6 py-8 flex flex-col gap-7">
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <UserBubble key={i} content={msg.content} />
          ) : (
            <AssistantMessage key={i} content={msg.content} sources={msg.sources} />
          )
        )}

        {uploading && <UploadingIndicator />}
        {sending && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function UserBubble({ content }) {
  // User's own typed question — plain text, no markdown parsing needed here.
  return (
    <div className="flex justify-end">
      <div className="bg-[#2A2826] rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
        <p className="text-[15px] text-[#EDEBE6] whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

// Every element type Markdown can produce gets its own styled component below.
// This is what turns "**Contact information**" into an actual bold, colored phrase,
// "- item" into a real bulleted list with a colored marker, "# Heading" into a real
// heading, etc. — instead of showing the raw asterisks and dashes.
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-[19px] font-semibold text-[#E2876A] mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[17px] font-semibold text-[#E2876A] mt-4 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[15px] font-semibold text-[#E2876A] mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[15px] text-[#EDEBE6] leading-relaxed mb-3 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#F2A688]">{children}</strong>
  ),
  em: ({ children }) => <em className="text-[#B8B5AE] italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-3 space-y-1.5 marker:text-[#D97757]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-3 space-y-1.5 marker:text-[#D97757]">{children}</ol>
  ),
  li: ({ children }) => <li className="text-[15px] text-[#EDEBE6] leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#D97757] underline underline-offset-2 hover:text-[#E2876A]"
    >
      {children}
    </a>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code className="bg-[#2A2826] text-[#F2A688] rounded px-1.5 py-0.5 text-[13px]">{children}</code>
    ) : (
      <code className="block bg-[#141311] text-[#EDEBE6] rounded-lg p-3 text-[13px] overflow-x-auto my-2">
        {children}
      </code>
    ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-[#D97757]/50 pl-3 text-[#B8B5AE] italic my-2">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="border-[#2E2C29] my-4" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-[14px] border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-[#2E2C29]">{children}</thead>,
  th: ({ children }) => (
    <th className="text-left text-[#B8B5AE] font-medium py-2 pr-4">{children}</th>
  ),
  td: ({ children }) => (
    <td className="py-2 pr-4 text-[#EDEBE6] border-t border-[#2E2C29]/50">{children}</td>
  ),
};

function AssistantMessage({ content, sources }) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>

      {sources?.length > 0 && (
        <div className="mt-4 border border-[#2E2C29] rounded-xl overflow-hidden bg-[#1E1C1A]">
          <button
            onClick={() => setShowSources((prev) => !prev)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-[12px] font-medium text-[#B8B5AE] hover:text-[#EDEBE6] hover:bg-[#262422] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D97757]" />
              <span>Retrieved Context & Citations ({sources.length} {sources.length === 1 ? 'source' : 'sources'})</span>
            </div>
            <span className="text-[11px] text-[#8A867E]">
              {showSources ? "Hide details ▲" : "Show details ▼"}
            </span>
          </button>

          {showSources && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-[#2E2C29]">
              {sources.map((s, idx) => {
                const chunkIdx = typeof s === "object" ? s.chunk_index : s;
                const text = typeof s === "object" ? s.text : "";
                const context = typeof s === "object" ? s.context : "";

                return (
                  <div key={idx} className="bg-[#141311] border border-[#2A2826] rounded-lg p-3 text-[13px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-[#E2876A] text-[12px] bg-[#2A2826] px-2 py-0.5 rounded">
                        Chunk #{chunkIdx ?? idx + 1}
                      </span>
                    </div>

                    {context && (
                      <p className="text-[#B8B5AE] italic text-[12px] mb-2 leading-relaxed bg-[#191817] p-2 rounded border border-[#262422]">
                        <strong className="text-[#D97757] not-italic font-medium">Context: </strong>
                        {context}
                      </p>
                    )}

                    {text && (
                      <p className="text-[#EDEBE6] font-mono text-[12px] leading-relaxed whitespace-pre-wrap bg-[#191817] p-2.5 rounded border border-[#262422]">
                        {text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleCopy}
        aria-label="Copy response"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity
                   flex items-center gap-1 text-[11px] text-[#8A867E] hover:text-[#EDEBE6] mt-2 cursor-pointer
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

// Shown while the PDF uploads and runs through ingestion (chunk -> enrich -> critic -> persist).
function UploadingIndicator() {
  return (
    <div className="py-2">
      <LatticeLoader
        status="working"
        label="Uploading & indexing document"
        pattern="sweep"
        grid={3}
        color="#D97757"
        showTimer={true}
      />
    </div>
  );
}

// Shown while waiting on the AI's answer
function TypingIndicator() {
  return (
    <div className="py-2">
      <LatticeLoader
        status="working"
        label="Reasoning & retrieving context"
        pattern="orbit"
        grid={3}
        color="#D97757"
        showTimer={true}
      />
    </div>
  );
}

export default ChatMessages;