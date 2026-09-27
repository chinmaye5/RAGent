// ChatInput.jsx — pinned bottom bar: PDF attach, text input, send button.
// Colors are hardcoded so this renders correctly regardless of your Tailwind config.

import { useRef } from "react";
import { Paperclip, X, ArrowUp } from "lucide-react";

function ChatInput({ question, setQuestion, file, setFile, onSend, disabled }) {
  const fileInputRef = useRef(null);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend(e);
    }
  }

  return (
    <div className="border-t border-[#2E2C29] bg-[#191817] px-6 py-4">
      <div className="max-w-[720px] mx-auto">
        {file && (
          <div className="inline-flex items-center gap-2 bg-[#2A2826] rounded-lg px-3 py-1.5 text-[12px] text-[#B8B5AE] mb-2">
            <Paperclip size={12} />
            <span>{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove attached file"
              className="text-[#8A867E] hover:text-[#EDEBE6] cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded"
            >
              <X size={13} />
            </button>
          </div>
        )}

        <form
          onSubmit={onSend}
          className="flex items-center gap-2 border border-[#2E2C29] rounded-[16px] px-4 py-3
                     bg-[#1F1E1C] shadow-[0_4px_20px_rgba(0,0,0,0.25)]
                     focus-within:border-[#4A4744] transition-colors"
        >
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files[0]) setFile(e.target.files[0]);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach a PDF"
            title="Attach a PDF"
            className="text-[#8A867E] hover:text-[#EDEBE6] transition-colors cursor-pointer flex-shrink-0
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50 rounded"
          >
            <Paperclip size={18} />
          </button>

          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message RAGent..."
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-[15px] text-[#EDEBE6]
                       placeholder:text-[#8A867E] disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={disabled || (!question.trim() && !file)}
            aria-label="Send message"
            title="Send"
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                       transition-colors cursor-pointer bg-[#D97757] text-white
                       disabled:bg-[#2E2C29] disabled:text-[#8A867E] disabled:cursor-not-allowed
                       hover:bg-[#C4653F]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97757]/50"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatInput;