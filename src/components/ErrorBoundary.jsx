import { Component } from 'react';
import Icon from './Icon';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="loading-screen" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
          <Icon name="warning" size={40} />
          <h2 style={{ margin: 0 }}>Something went wrong</h2>
          <p className="text-sm text-muted-c" style={{ maxWidth: 420, textAlign: 'center' }}>
            {this.state.error.message || 'The page crashed. Try refreshing or sign in again.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              sessionStorage.removeItem('ska_user');
              window.location.href = '/login';
            }}
          >
            Back to login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
