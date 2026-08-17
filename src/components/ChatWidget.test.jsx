import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ChatWidget from './ChatWidget';

vi.mock('../config', () => ({ default: 'http://localhost:3006' }));

const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('ChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders the chat toggle button', () => {
    render(<ChatWidget />);
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
  });

  it('shows chat emoji by default', () => {
    render(<ChatWidget />);
    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('opens chat dialog on toggle click', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByRole('dialog', { name: /live chat/i })).toBeInTheDocument();
  });

  it('shows close button label when open', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByRole('button', { name: /close chat/i })).toBeInTheDocument();
  });

  it('shows X icon when open', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('closes chat on second click', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByRole('dialog', { name: /live chat/i })).toBeInTheDocument();

    act(() => {
      screen.getByRole('button', { name: /close chat/i }).click();
    });
    expect(screen.queryByRole('dialog', { name: /live chat/i })).not.toBeInTheDocument();
  });

  it('shows Live Chat header', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByText('Live Chat')).toBeInTheDocument();
  });

  it('shows empty state message', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('has a message input field', () => {
    render(<ChatWidget />);
    act(() => {
      screen.getByRole('button', { name: /open chat/i }).click();
    });
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('has aria-expanded attribute on toggle', () => {
    render(<ChatWidget />);
    const btn = screen.getByRole('button', { name: /open chat/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');

    act(() => {
      btn.click();
    });
    expect(screen.getByRole('button', { name: /close chat/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('establishes socket connection and registers handlers on mount', () => {
    render(<ChatWidget />);
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('new-message', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
  });

  it('disconnects socket on unmount', () => {
    render(<ChatWidget />).unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('renders with a user prop', () => {
    render(<ChatWidget user={{ name: 'Alice', email: 'alice@test.com' }} />);
    expect(screen.getByRole('button', { name: /open chat/i })).toBeInTheDocument();
  });
});
