import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Link } from 'react-router';
import API_URL from '../config';

const fmtPrice = (n) => {
  const v = Number(n || 0);
  return `$${v.toLocaleString()}`;
};

const AI_SUGGESTIONS = [
  'show me waterfront homes',
  'what is available under $2M?',
  'homes in Miami',
  '3 bedroom condos',
];

export default function ChatWidget({ user }) {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem('dreamhomes_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/messages`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch {
      // history is optional
    }
  }, []);

  useEffect(() => {
    const s = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      setAuthError(false);
      loadHistory();
      const token = localStorage.getItem('dreamhomes_token');
      if (user && token) s.emit('join', { token });
    });

    s.on('new-message', (msg) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    s.on('auth-error', () => setAuthError(true));
    s.on('connect_error', () => setConnected(false));
    s.on('disconnect', () => setConnected(false));

    return () => s.disconnect();
  }, [user, loadHistory]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, aiMessages, aiBusy, open]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current || !connected) return;
    socketRef.current.emit('message', { message: input.trim() });
    setInput('');
  };

  const sendAI = async (e, quick = null) => {
    e?.preventDefault();
    const text = (quick ?? aiInput).trim();
    if (!text || aiBusy) return;
    const token = localStorage.getItem('dreamhomes_token');
    const next = [...aiMessages, { role: 'user', content: text }];
    setAiMessages(next);
    setAiInput('');
    setAiBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history: aiMessages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) {
        throw new Error(data.error || `AI request failed (${res.status || 'unknown'})`);
      }
      setAiMessages([...next, { role: 'assistant', content: data.reply, properties: data.properties || [] }]);
    } catch {
      setAiMessages([...next, { role: 'assistant', content: `Sorry, I couldn't answer right now. Please try again in a moment.` }]);
    } finally {
      setAiBusy(false);
    }
  };

  const name = user?.name || user?.email || 'Guest';
  const isOnline = connected && !authError;

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close chat' : 'Open chat'} aria-expanded={open}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chat-widget" role="dialog" aria-modal="true" aria-label={aiMode ? 'Dream Homes AI assistant' : 'Live chat'} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
          <div className="chat-header">
            <div className="chat-header-titles">
              <strong>{aiMode ? 'Dream Homes AI' : 'Live Chat'}</strong>
              <span className={`chat-status ${isOnline ? 'online' : 'offline'}`}>
                {aiMode
                  ? 'Ask about listings anywhere on the site'
                  : isOnline ? 'Online' : authError ? 'Sign in to chat' : connected ? 'Connecting...' : 'Offline — retrying'}
              </span>
            </div>
            {!aiMode && (
              <button type="button" className="chat-ai-toggle" onClick={() => setAiMode(true)}>Ask AI</button>
            )}
            {aiMode && (
              <button type="button" className="chat-ai-toggle active" onClick={() => setAiMode(false)}>Live Chat</button>
            )}
          </div>
          <div className="chat-body">
            {!aiMode ? (
              <div className="chat-main">
                <div className="chat-messages">
                  {messages.length === 0 && (
                    <p className="chat-empty">No messages yet. Say hello!</p>
                  )}
                  {messages.map((m, i) => (
                    <div key={m.id || i} className={`chat-msg ${m.userName === name ? 'own' : ''}`}>
                      <small>{m.userName}</small>
                      <p>{m.message}</p>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <form className="chat-input" onSubmit={send}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type a message..."
                    aria-label="Type a message"
                    disabled={!isOnline}
                  />
                  <button type="submit" disabled={!isOnline || !input.trim()}>Send</button>
                </form>
              </div>
            ) : (
              <div className="chat-main ai">
                <div className="chat-messages">
                  {aiMessages.length === 0 && (
                    <div className="chat-empty ai-empty">
                      <p>Hi! I can help you find homes, check prices, and explore listings. Try one of these:</p>
                      <div className="ai-suggestions">
                        {AI_SUGGESTIONS.map(s => (
                          <button key={s} type="button" onClick={() => sendAI(null, s)} disabled={aiBusy}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiMessages.map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role === 'user' ? 'own' : 'ai'}`}>
                      {m.role === 'assistant' && <small>Dream Home AI</small>}
                      <p>{m.content}</p>
                      {m.properties && m.properties.length > 0 && (
                        <div className="ai-properties">
                          {m.properties.map(p => (
                            <Link key={p.id} to={`/property/${p.id}`} className="ai-property">
                              {p.image && <img src={p.image} alt="" loading="lazy" />}
                              <span>
                                <strong>{p.title}</strong>
                                <small>{p.city}, {p.state}</small>
                                <em>{fmtPrice(p.price)} · {p.beds} bd / {p.baths} ba / {p.sqft} sqft</em>
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {aiBusy && (
                    <div className="chat-msg ai">
                      <small>Dream Home AI</small>
                      <p className="ai-typing">Thinking<span>.</span><span>.</span><span>.</span></p>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
                <form className="chat-input" onSubmit={sendAI}>
                  <input
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    placeholder="Ask about listings, prices, cities..."
                    aria-label="Ask the Dream Homes AI assistant"
                    disabled={aiBusy}
                  />
                  <button type="submit" disabled={aiBusy || !aiInput.trim()}>Ask</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}