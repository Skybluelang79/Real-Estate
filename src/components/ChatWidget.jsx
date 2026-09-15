import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '+18005554663';
const PHONE_NUMBER = import.meta.env.VITE_PHONE_NUMBER || '+18005554663';
const WHATSAPP_MESSAGE = encodeURIComponent("Hi! I'd like to chat about Dream Homes properties.");

export default function ChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [authError, setAuthError] = useState(false);
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
  }, [messages, open]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current || !connected) return;
    socketRef.current.emit('message', { message: input.trim() });
    setInput('');
  };

  const name = user?.name || user?.email || 'Guest';
  const isOnline = connected && !authError;

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close chat' : 'Open chat'} aria-expanded={open}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chat-widget" role="dialog" aria-modal="true" aria-label="Live chat" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}>
          <div className="chat-header">
            <strong>Live Chat</strong>
            <span className={`chat-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : authError ? 'Sign in to chat' : connected ? 'Connecting...' : 'Offline — retrying'}
            </span>
          </div>
          <div className="chat-body">
            <div className="chat-side">
              <span className="chat-side-label">Reach us</span>
              <a
                className="chat-side-btn chat-side-whatsapp"
                href={`https://wa.me/${WHATSAPP_NUMBER.replace(/[^\d]/g, '')}?text=${WHATSAPP_MESSAGE}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat with us on WhatsApp"
                aria-label="Chat with us on WhatsApp"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>WhatsApp</span>
              </a>
              <a
                className="chat-side-btn chat-side-call"
                href={`tel:${PHONE_NUMBER.replace(/[^\d+]/g, '')}`}
                title={`Call us at ${PHONE_NUMBER}`}
                aria-label={`Call us at ${PHONE_NUMBER}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
                <span>Call</span>
              </a>
            </div>
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
          </div>
        </div>
      )}
    </>
  );
}
