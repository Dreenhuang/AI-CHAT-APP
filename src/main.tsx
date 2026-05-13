import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './global.css'

// 简易错误边界 - 防止白屏
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: any}> {
  state = {error: null}
  static getDerivedStateFromError(error: any) { return {error} }
  componentDidCatch(error: any, info: any) {
    console.error('[App Crash]', error, info.componentStack)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:40, fontFamily:'system-ui', color:'#333'}}>
          <h2 style={{color:'#DC2626'}}>应用加载出错</h2>
          <p>{String(this.state.error)}</p>
          <button onClick={() => this.setState({error:null})} 
            style={{marginTop:16, padding:'8px 20px', background:'#6C63FF', color:'#fff', border:'none', borderRadius:6, cursor:'pointer'}}>
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
