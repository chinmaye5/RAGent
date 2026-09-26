// ChatInput.jsx — Bottom input bar with file upload (paperclip) + text input + send button
//
// Matches Claude's pinned bottom bar: rounded corners, soft border, terracotta send button

import { useRef } from "react";

function ChatInput({ question, setQuestion, file, setFile, onSend, disabled }) {
  const fileInputRef = useRef(null);

  // Handle Enter key to send (Shift+Enter for newline)
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  }

  return (
    <div className="border-t border-border bg-cream px-6 py-4">
      <div className="max-w-[700px] mx-auto">

        {/* File chip — shows selected file name with remove button */}
        {file && (
          <div className="inline-flex items-center gap-2 bg-user-bubble rounded-lg px-3 py-1.5 text-[12px] text-ink-light mb-2">
            <span>📎 {file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="text-ink-muted hover:text-ink text-[14px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input row */}
        <form
          onSubmit={onSend}
          className="flex items-center gap-2 border border-border rounded-[14px] px-4 py-3
                     focus-within:border-ink-muted transition-colors bg-cream"
        >
          {/* Hidden file input */}
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) setFile(e.target.files[0]);
            }}
          />

          {/* Paperclip upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-ink-muted hover:text-ink text-[18px] transition-colors cursor-pointer
                       flex-shrink-0"
            title="Upload PDF"
          >
            📎
          </button>

          {/* Text input */}
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message RAGent..."
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-[15px] text-ink
                       placeholder:text-ink-muted disabled:opacity-50"
          />

          {/* Send button — circular, terracotta accent */}
          <button
            type="submit"
            disabled={disabled || (!question.trim() && !file)}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                       transition-colors cursor-pointer
                       bg-terracotta text-white
                       disabled:bg-border disabled:text-ink-muted disabled:cursor-not-allowed
                       hover:bg-terracotta-hover"
            title="Send"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInput;
