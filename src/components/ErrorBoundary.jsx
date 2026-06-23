import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="page-container container section flex-center" style={{ minHeight: '70vh' }}>
        <div className="glass-card" style={{ maxWidth: 460, width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😢</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Có gì đó trục trặc rồi</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Trang này gặp lỗi bất ngờ. Thử tải lại hoặc về trang chủ nhé — dữ liệu của bạn vẫn an toàn.
          </p>
          <div className="flex-center" style={{ gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Tải lại trang</button>
            <button className="btn btn-outline" onClick={() => window.location.assign('/')}>Về trang chủ</button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
