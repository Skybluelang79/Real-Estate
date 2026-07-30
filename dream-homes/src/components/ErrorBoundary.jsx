import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="section properties-page" style={{ textAlign: 'center', paddingTop: '120px' }}>
          <div className="container">
            <div style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--danger)', lineHeight: 1 }}>!</div>
            <h2 style={{ marginTop: '16px' }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>An unexpected error occurred. Please try refreshing the page.</p>
            <Link to="/" className="btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>Back to Home</Link>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
