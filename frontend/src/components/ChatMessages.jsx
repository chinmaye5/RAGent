// ChatMessages.jsx — Displays all messages in Claude's document-style layout
//
// User messages:   right-aligned, rounded beige bubble
// Assistant messages: NO bubble — plain text on the page, left-aligned, full column width

import { useEffect, useRef } from "react";

function ChatMessages({ messages, sending, userName }) {
  // Auto-scroll to bottom when new messages arrive
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Empty state — shown when no messages yet
  if (messages.length === 0 && !sending) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-[28px] font-semibold text-ink mb-2">RAGent</h1>
        <p className="text-[15px] text-ink-muted text-center max-w-[380px] leading-relaxed">
          Upload a PDF and ask questions about it.
          Your answers will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[700px] mx-auto px-6 py-8 flex flex-col gap-6">

        {messages.map((msg, i) => {
          // ─── User message: right-aligned bubble ───
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="bg-user-bubble rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]">
                  <p className="text-[15px] text-ink whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          }

          // ─── Assistant message: plain text, no bubble ───
          return (
            <div key={i} className="group">
              <div className="text-[15px] text-ink leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>

              {/* Source chunks — small muted text */}
              {msg.sources && msg.sources.length > 0 && (
                <p className="text-[12px] text-ink-muted mt-2">
                  Sources: chunks {msg.sources.join(", ")}
                </p>
              )}

              {/* Copy button — appears on hover */}
              <button
                onClick={() => navigator.clipboard.writeText(msg.content)}
                className="opacity-0 group-hover:opacity-100 transition-opacity
                           text-[11px] text-ink-muted hover:text-ink mt-1 cursor-pointer"
              >
                Copy
              </button>
            </div>
          );
        })}

        {/* Thinking indicator while waiting for response */}
        {sending && (
          <div className="flex items-center gap-1.5 py-2">
            <span className="w-2 h-2 bg-ink-muted rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-ink-muted rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-2 h-2 bg-ink-muted rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default ChatMessages;
