import { useState, useRef, useEffect, useContext } from "react";
import { 
  Close, 
  Send, 
  ContentCopy, 
  Check, 
  AutoAwesome,
  Person
} from "@mui/icons-material";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import "./aiAgent.css";

const AI_PIC = "/assets/AI.jpg";

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "bot",
    text: "Hi! I'm Zakora's Agent. Ask me anything about Zakora, its features, posts, captions or how to connect with friends.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const SUGGESTIONS = [
  "✨ Write a catchy caption for my post",
  "💡 Give me 4 creative post ideas",
  "🏷️ Recommend trending hashtags",
  "🌐 What can I do on ZakoraSocial?"
];

const AiAgent = () => {
  const { user } = useContext(AuthContext);
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
  const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";
  const userAvatarUrl = user?.profilePicture ? resolvePath(user.profilePicture) : null;

  const [isOpen, setIsOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, loading]);

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowBubble(false);
  };

  const handleDismissBubble = (e) => {
    e.stopPropagation();
    setShowBubble(false);
  };

  const handleSend = async (messageText) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({
        role: m.sender === "user" ? "user" : "assistant",
        text: m.text
      }));

      const res = await axios.post("/ai/chat", {
        message: textToSend,
        history: historyPayload
      });

      const botReply = res.data?.reply || "I'm here to help with your questions!";

      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "Oops, I encountered a temporary connection issue. Please try asking again!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text, id) => {
    const cleanText = text.replace(/\*\*/g, "");
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="aiAgentWrapper">
      {/* Floating Action Trigger & Speech Bubble */}
      {!isOpen && (
        <div className="aiFloatingContainer">
          {showBubble && (
            <div className="aiSpeechBubble" onClick={handleOpenChat}>
              <button
                type="button"
                className="aiBubbleCloseBtn"
                onClick={handleDismissBubble}
                title="Dismiss"
                aria-label="Dismiss speech bubble"
              >
                <Close style={{ fontSize: "15px" }} />
              </button>
              
              <div className="aiBubbleAvatarWrap">
                <img 
                  src={AI_PIC} 
                  alt="Zakora's Agent" 
                  className="aiBubbleAvatarImg"
                  onError={(e) => { e.target.src = "/assets/logo.png"; }}
                />
              </div>
              
              <div className="aiBubbleContent">
                <div className="aiBubbleTitle">ZAKORA'S AGENT</div>
                <p className="aiBubbleText">
                  Click here to ask anything about Zakora, features, posts or ideas.
                </p>
              </div>

              {/* Speech bubble pointer tail pointing down */}
              <div className="aiBubbleTail" />
            </div>
          )}

          <button
            type="button"
            className="aiCircleTriggerBtn"
            onClick={handleOpenChat}
            title="Chat with Zakora's Agent"
            aria-label="Open AI Assistant"
          >
            <img 
              src={AI_PIC} 
              alt="Zakora's Agent" 
              className="aiCircleTriggerImg"
              onError={(e) => { e.target.src = "/assets/logo.png"; }}
            />
            <span className="aiOnlineBadge" />
          </button>
        </div>
      )}

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="aiChatWindow">
          {/* Header */}
          <div className="aiHeader">
            <div className="aiHeaderInfo">
              <h3 className="aiTitle">ZAKORA'S AGENT</h3>
              <p className="aiSubtitle">Ask about Zakora, features, posts or ideas</p>
            </div>
            <button
              className="aiHeaderCloseBtn"
              onClick={() => setIsOpen(false)}
              title="Close"
              aria-label="Close"
            >
              <Close style={{ fontSize: "20px" }} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="aiMessagesBody">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`aiMessageRow ${m.sender === "user" ? "userRow" : "botRow"}`}
              >
                {m.sender === "bot" && (
                  <div className="aiMsgAvatar">
                    <img 
                      src={AI_PIC} 
                      alt="AI" 
                      className="aiMsgAvatarImg"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className={`aiBubble ${m.sender === "user" ? "userBubble" : "botBubble"}`}>
                  <div className="aiBubbleText">{m.text}</div>
                  <div className="aiBubbleFooter">
                    <span className="aiBubbleTime">{m.time}</span>
                    {m.sender === "bot" && (
                      <button
                        className="aiCopyBtn"
                        onClick={() => handleCopy(m.text, m.id)}
                        title="Copy to clipboard"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check style={{ fontSize: "12px", color: "#10b981" }} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <ContentCopy style={{ fontSize: "12px" }} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {m.sender === "user" && (
                  <div className="aiUserAvatar">
                    {userAvatarUrl ? (
                      <img 
                        src={userAvatarUrl} 
                        alt="You" 
                        className="aiUserAvatarImg"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Person style={{ fontSize: "22px", color: "#ffffff" }} />
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="aiMessageRow botRow">
                <div className="aiMsgAvatar">
                  <img 
                    src={AI_PIC} 
                    alt="AI" 
                    className="aiMsgAvatarImg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="aiBubble botBubble typingBubble">
                  <span className="typingDot"></span>
                  <span className="typingDot"></span>
                  <span className="typingDot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 2 && (
            <div className="aiSuggestions">
              <div className="aiSuggestionsTitle">
                <AutoAwesome style={{ fontSize: "13px" }} /> Try asking:
              </div>
              <div className="aiChipsContainer">
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    className="aiChip"
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            className="aiInputContainer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="aiInput"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              type="submit"
              className="aiSendBtn"
              disabled={!input.trim() || loading}
              title="Send"
            >
              <Send style={{ fontSize: "19px" }} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AiAgent;
