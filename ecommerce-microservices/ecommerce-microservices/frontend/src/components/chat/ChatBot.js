import React, { useState, useRef, useEffect } from 'react';
import { chatbotAPI } from '../../services/api';

const BOT_AVATAR = '🤖';
const USER_AVATAR = '👤';

const SUGGESTED_QUESTIONS = [
  'Quels produits sont disponibles ?',
  'Combien de produits sont en stock ?',
  'Recommande-moi un produit électronique',
  'Produits à moins de 500 DT',
];

export default function ChatBot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis ShopBot, votre assistant IA. Je peux vous aider à trouver des produits, vérifier les disponibilités et répondre à vos questions sur notre catalogue. Comment puis-je vous aider ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;

    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await chatbotAPI.ask(q, sessionId);
      if (!sessionId) setSessionId(data.session_id);

      const botMsg = {
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(data.timestamp),
        sources: data.sources,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Désolé, je rencontre un problème. Veuillez réessayer.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={styles.toggleBtn}
        title="ShopBot Assistant IA"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div style={styles.chatContainer}>
          {/* Header */}
          <div style={styles.header}>
            <span style={styles.headerIcon}>🤖</span>
            <div>
              <div style={styles.headerTitle}>ShopBot IA</div>
              <div style={styles.headerSubtitle}>
                {loading ? '⏳ En train de réfléchir...' : '🟢 En ligne'}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={styles.messagesContainer}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.messageRow,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <span style={styles.avatar}>{BOT_AVATAR}</span>
                )}
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user' ? styles.userBubble : styles.botBubble),
                    ...(msg.isError ? styles.errorBubble : {}),
                  }}
                >
                  <p style={styles.messageText}>{msg.content}</p>
                  {msg.sources?.length > 0 && (
                    <p style={styles.sources}>📊 Données: {msg.sources.join(', ')}</p>
                  )}
                  <p style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <span style={styles.avatar}>{USER_AVATAR}</span>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                <span style={styles.avatar}>{BOT_AVATAR}</span>
                <div style={{ ...styles.bubble, ...styles.botBubble }}>
                  <span style={styles.typingDots}>●●●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div style={styles.suggestions}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} style={styles.suggestionBtn} onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div style={styles.inputArea}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question en langage naturel..."
              style={styles.textarea}
              rows={2}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  toggleBtn: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
    width: 56, height: 56, borderRadius: '50%',
    background: '#2563eb', color: 'white', border: 'none',
    fontSize: 22, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
    transition: 'transform 0.2s',
  },
  chatContainer: {
    position: 'fixed', bottom: 90, right: 24, zIndex: 1000,
    width: 380, height: 560, background: 'white',
    borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    color: 'white', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
  },
  headerIcon: { fontSize: 28 },
  headerTitle: { fontWeight: 700, fontSize: 16 },
  headerSubtitle: { fontSize: 12, opacity: 0.85 },
  messagesContainer: {
    flex: 1, overflowY: 'auto', padding: '12px 12px 0',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 8 },
  avatar: { fontSize: 20, flexShrink: 0 },
  bubble: {
    maxWidth: '78%', borderRadius: 14, padding: '10px 14px',
    fontSize: 13, lineHeight: 1.5,
  },
  userBubble: { background: '#2563eb', color: 'white', borderBottomRightRadius: 4 },
  botBubble: { background: '#f1f5f9', color: '#1e293b', borderBottomLeftRadius: 4 },
  errorBubble: { background: '#fee2e2', color: '#dc2626' },
  messageText: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  sources: { margin: '6px 0 0', fontSize: 11, opacity: 0.6 },
  timestamp: { margin: '4px 0 0', fontSize: 10, opacity: 0.5, textAlign: 'right' },
  typingDots: { fontSize: 20, letterSpacing: 2, animation: 'pulse 1s infinite' },
  suggestions: {
    padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6,
    borderTop: '1px solid #f1f5f9',
  },
  suggestionBtn: {
    background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
    borderRadius: 20, padding: '4px 10px', fontSize: 11, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  inputArea: {
    borderTop: '1px solid #e2e8f0', padding: '10px 12px',
    display: 'flex', gap: 8, alignItems: 'flex-end',
  },
  textarea: {
    flex: 1, border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '8px 12px', fontSize: 13, resize: 'none',
    fontFamily: 'inherit', outline: 'none',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: '50%', background: '#2563eb',
    color: 'white', border: 'none', cursor: 'pointer', fontSize: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
};
