import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config';

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
        <div className="chat-widget" role="dialog" aria-label="Live chat">
          <div className="chat-header">
            <strong>Live Chat</strong>
            <span className={`chat-status ${isOnline ? 'online' : 'offline'}`}>
              {isOnline ? 'Online' : authError ? 'Sign in to chat' : connected ? 'Connecting...' : 'Offline — retrying'}
            </span>
          </div>
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
      )}
    </>
  );
}
