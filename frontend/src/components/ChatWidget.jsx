import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    sendChatMessage,
    loadChatHistory
} from "../redux/actions/serviceActions";

// FR 7.1 / FR 7.2: the assistant is a floating widget that only a signed in
// collector can open. The conversation and the detected preferences are kept
// on the server.
function ChatWidget() {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { messages, preferences, loading, error } = useSelector((state) => state.chat);

    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const bodyRef = useRef(null);

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            dispatch(loadChatHistory());
        }
    }, [isOpen, isAuthenticated, dispatch]);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    if (!isAuthenticated) {
        return null;
    }

    const handleSend = (event) => {
        event.preventDefault();

        const trimmed = input.trim();

        if (!trimmed || loading) {
            return;
        }

        setInput("");
        dispatch(sendChatMessage(trimmed));
    };

    const preferenceChips = Object.entries(preferences || {}).filter(
        ([, value]) => value !== null && value !== undefined && value !== ""
    );

    return (
        <div className={`chat-widget ${isOpen ? "open" : ""}`}>
            {isOpen && (
                <section className="chat-panel" aria-label="Aureo assistant">
                    <header className="chat-head">
                        <div>
                            <strong>Aureo Assistant</strong>
                            <span>Rule based watch matching</span>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">
                            ×
                        </button>
                    </header>

                    <div className="chat-body" ref={bodyRef}>
                        {messages.length === 0 && (
                            <div className="chat-empty">
                                <p>
                                    Tell me your budget and what you are looking for, for example
                                    {" "}<em>"a dive watch under 150000 with an automatic movement"</em>.
                                </p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}`}
                                className={`chat-bubble ${message.role}`}
                            >
                                {message.content}
                            </div>
                        ))}

                        {loading && <div className="chat-bubble assistant typing">...</div>}
                    </div>

                    {preferenceChips.length > 0 && (
                        <div className="chat-preferences">
                            {preferenceChips.map(([key, value]) => (
                                <span key={key}>
                                    {key}: {String(value)}
                                </span>
                            ))}
                        </div>
                    )}

                    {error && <div className="chat-error">{error}</div>}

                    <form className="chat-input" onSubmit={handleSend}>
                        <input
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Ask about a watch..."
                            aria-label="Message the assistant"
                        />
                        <button type="submit" className="gold-button" disabled={loading}>
                            Send
                        </button>
                    </form>
                </section>
            )}

            <button
                type="button"
                className="chat-fab"
                onClick={() => setIsOpen((current) => !current)}
                aria-label="Open the Aureo assistant"
            >
                {isOpen ? "×" : "Chat"}
            </button>
        </div>
    );
}

export default ChatWidget;
