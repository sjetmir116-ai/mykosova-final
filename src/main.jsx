import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './AppContext.jsx'

// VERSIONI I KODIT — shihet edhe te ekrani i gabimit (për të parë nëse browser-i ka kodin e ri)
export const VERSIONI = '1.0.11'

// ERROR BOUNDARY — nëse çdo ekran i gabon, tregon gabimin në vend të faqes bosh
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { gabimi: null }
  }
  static getDerivedStateFromError(error) {
    return { gabimi: error }
  }
  componentDidCatch(error, info) {
    console.error('ERROR BOUNDARY — gabim në app:', error, info?.componentStack)
  }
  render() {
    if (this.state.gabimi) {
      return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#ef4444' }}>⚠️ Ndodhi një gabim në aplikacion</h2>
          <pre style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#991b1b' }}>
            {String(this.state.gabimi?.message || this.state.gabimi)}
          </pre>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Mbyll dhe hap sërish faqen (ose Ctrl+Shift+R). Nëse gabimi përsëritet, kopjo tekstin e sipërm dhe dërgonaje.
          </p>
          <p style={{ fontSize: '12px', fontWeight: '800', color: '#6b7280', marginTop: '8px' }}>
            Vershioni i kodit që po ekzekutohet: <span style={{ color: VERSIONI === '1.0.11' ? '#16a34a' : '#ef4444' }}>{VERSIONI}</span>
            {VERSIONI !== '1.0.11' && ' — ⚠️ KËTË KËSHILLËN TË VJETËR! Bëj hard refresh (Ctrl+Shift+R) ose hap në tab të ri.'}
          </p>
          <button
            onClick={() => { this.setState({ gabimi: null }); window.location.reload() }}
            style={{ marginTop: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            Rifresko faqen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
