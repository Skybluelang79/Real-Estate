import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API_URL from '../config';

export default function ChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const s = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('connect', () => {
      setConnected(true);
      if (user) s.emit('join', { userId: user.id, name: user.name || user.email });
    });

    s.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    s.on('disconnect', () => setConnected(false));

    return () => s.disconnect();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('message', {
      userId: user?.id || 'guest',
      userName: user?.name || user?.email || 'Guest',
      message: input.trim(),
    });
    setInput('');
  };

  const name = user?.name || user?.email || 'Guest';

  return (
    <>
      <button className="chat-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '✕' : '💬'}
      </button>
      {open && (
        <div className="chat-widget">
          <div className="chat-header">
            <strong>Live Chat</strong>
            <span className={`chat-status ${connected ? 'online' : 'offline'}`}>
              {connected ? 'Online' : 'Connecting...'}
            </span>
          </div>
          <div className="chat-messages">
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
              disabled={!connected}
            />
            <button type="submit" disabled={!connected || !input.trim()}>Send</button>
          </form>
        </div>
      )}
    </>
  );
}