import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const SUGGESTED_QUERIES = [
  'Who is likely to win today?',
  'Show me the most competitive matches',
  'Which match is most predictable?',
  'Find me the biggest underdogs',
  'Give me a summary of all matches',
  'What is the best match to watch?',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ ...msgStyles.wrap, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      {!isUser && <div style={msgStyles.avatar}>◈</div>}
      <div style={{
        ...msgStyles.bubble,
        ...(isUser ? msgStyles.userBubble : msgStyles.agentBubble),
      }}>
        {!isUser && (
          <div style={msgStyles.agentHeader}>
            <span style={msgStyles.agentLabel}>AI AGENT</span>
            {msg.intent && (
              <span style={msgStyles.intentTag}>{msg.intent}</span>
            )}
          </div>
        )}
        <div style={msgStyles.text}>
          {msg.text.split('**').map((part, i) =>
            i % 2 === 1
              ? <strong key={i} style={{ color: 'var(--accent-primary)' }}>{part}</strong>
              : part
          )}
        </div>
        {msg.matchCount != null && (
          <div style={msgStyles.metaLine}>
            ◎ Analyzed {msg.matchCount} matches · {msg.tools?.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

const msgStyles = {
  wrap: {
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'flex-start',
    animation: 'fadeUp 0.3s ease both',
  },
  avatar: {
    width: '32px',
    height: '32px',
    background: 'var(--accent-dim)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    color: 'var(--accent-primary)',
    flexShrink: 0,
    marginTop: '2px',
    border: '1px solid var(--border-accent)',
  },
  bubble: {
    maxWidth: '75%',
    padding: '0.85rem 1rem',
    borderRadius: 'var(--radius-md)',
    lineHeight: 1.7,
    fontSize: '0.88rem',
  },
  userBubble: {
    background: 'var(--accent-dim)',
    border: '1px solid var(--border-accent)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--radius-md) var(--radius-md) 4px var(--radius-md)',
  },
  agentBubble: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    borderRadius: 'var(--radius-md) var(--radius-md) var(--radius-md) 4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  agentHeader: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  agentLabel: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
  },
  intentTag: {
    fontSize: '0.6rem',
    padding: '1px 6px',
    background: 'var(--bg-elevated)',
    borderRadius: '4px',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  text: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  metaLine: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    paddingTop: '0.3rem',
    borderTop: '1px solid var(--border-subtle)',
  },
};

export default function AgentPage() {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      text: "Hello! I'm your AI sports analyst. I can analyze today's matches and odds to help you make sense of the data.\n\nTry asking me about match predictions, close odds, or which matches are most predictable.",
      intent: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (query) => {
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/agent/query', { query });
      const data = res.data;
      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          text: data.answer,
          intent: data.intent_detected,
          matchCount: data.matches_analyzed,
          tools: data.tools_used,
        },
      ]);
    } catch (err) {
      const errMsg = err.response?.data?.fallback_answer
        || err.response?.data?.error
        || 'Sorry, the AI agent is temporarily unavailable. Please try again.';
      setMessages(prev => [
        ...prev,
        { role: 'agent', text: errMsg, intent: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.headerTopRow}>
            <h1 style={styles.title}>AI AGENT</h1>
            <div style={styles.liveDot}>
              <span style={styles.livePulse}></span>
              LIVE
            </div>
          </div>
          <p style={styles.subtitle}>
            Natural language queries · Powered by your live odds data · Tool-calling reasoning engine
          </p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sideCard}>
            <div style={styles.sideTitle}>SUGGESTED QUERIES</div>
            <div style={styles.suggestionList}>
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => sendQuery(q)}
                  disabled={loading}
                  style={styles.suggestionBtn}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                >
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.8rem' }}>◈</span>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.sideCard}>
            <div style={styles.sideTitle}>HOW IT WORKS</div>
            <div style={styles.howItWorks}>
              {[
                ['1', 'Parse your query', 'Detects intent using keyword matching'],
                ['2', 'Fetch live data', 'Retrieves match + AI-generated odds'],
                ['3', 'Run reasoning tool', 'Applies the right analysis function'],
                ['4', 'Return insights', 'Generates a natural language answer'],
              ].map(([step, title, desc]) => (
                <div key={step} style={styles.howStep}>
                  <div style={styles.stepNum}>{step}</div>
                  <div>
                    <div style={styles.stepTitle}>{title}</div>
                    <div style={styles.stepDesc}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div style={styles.chatPanel}>
          {/* Messages */}
          <div style={styles.messagesArea}>
            {messages.map((msg, i) => (
              <Message key={i} msg={msg} />
            ))}
            {loading && (
              <div style={msgStyles.wrap}>
                <div style={msgStyles.avatar}>◈</div>
                <div style={{ ...msgStyles.agentBubble, padding: '0.85rem 1.1rem' }}>
                  <div style={styles.thinkingDots}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputArea}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about match odds, predictions, favorites..."
              style={styles.textarea}
              rows={2}
              disabled={loading}
            />
            <button
              onClick={() => sendQuery(input)}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.4 : 1,
              }}
            >
              {loading ? '...' : '→'}
            </button>
          </div>
          <p style={styles.inputHint}>Press Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      <style>{`
        @keyframes thinking {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.3; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        .thinking-dot { animation: thinking 1.2s infinite; }
        .thinking-dot:nth-child(2) { animation-delay: 0.2s; }
        .thinking-dot:nth-child(3) { animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTopRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(2.5rem, 5vw, 4rem)',
    letterSpacing: '0.06em',
    color: 'var(--accent-blue)',
    lineHeight: 1,
  },
  liveDot: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    background: 'rgba(0,229,160,0.08)',
    border: '1px solid rgba(0,229,160,0.2)',
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
    marginBottom: '2px',
  },
  livePulse: {
    width: '6px', height: '6px',
    background: 'var(--accent-primary)',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'pulse-glow 1.5s infinite',
  },
  subtitle: {
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
    marginTop: '0.3rem',
    fontFamily: 'var(--font-mono)',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '1rem',
    height: 'calc(100vh - 260px)',
    minHeight: '500px',
  },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' },
  sideCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  sideTitle: {
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  suggestionList: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  suggestionBtn: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.5rem 0.7rem',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    gap: '0.4rem',
    alignItems: 'flex-start',
    lineHeight: 1.4,
    transition: 'border-color 0.15s, color 0.15s',
  },
  howItWorks: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  howStep: { display: 'flex', gap: '0.6rem', alignItems: 'flex-start' },
  stepNum: {
    width: '20px',
    height: '20px',
    background: 'var(--accent-dim)',
    border: '1px solid var(--border-accent)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.65rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  stepTitle: { fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 },
  stepDesc: { fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px', lineHeight: 1.4 },
  chatPanel: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messagesArea: {
    flex: 1,
    overflow: 'auto',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  thinkingDots: {
    display: 'flex',
    gap: '5px',
    alignItems: 'center',
    height: '20px',
  },
  inputArea: {
    display: 'flex',
    gap: '0.6rem',
    padding: '1rem',
    borderTop: '1px solid var(--border-subtle)',
    background: 'var(--bg-surface)',
  },
  textarea: {
    flex: 1,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.6rem 0.8rem',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.6,
    fontFamily: 'var(--font-body)',
  },
  sendBtn: {
    padding: '0.5rem 1.1rem',
    background: 'var(--accent-primary)',
    color: '#080b0f',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: '1.2rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all var(--transition)',
    alignSelf: 'flex-end',
  },
  inputHint: {
    fontSize: '0.68rem',
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '0.3rem',
    fontFamily: 'var(--font-mono)',
    background: 'var(--bg-surface)',
  },
};
