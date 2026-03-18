import Renderer from "./assets/Renderer"
import { Component } from 'react'
import type { ReactNode } from 'react'
import Navbar from "./assets/Navbar"
import FluidSim from "./assets/FluidSim"
import HorizontalScroll from "./assets/HorizontalScroll"
import { Box } from '@mui/material';
import './App.css'

class ErrorBoundary extends Component<{children: ReactNode}, {error: string | null}> {
  state = { error: null }
  componentDidCatch(e: Error) { this.setState({ error: e.message }) }
  render() {
    if (this.state.error) return <pre style={{color:'red', padding:'2rem'}}>{this.state.error}</pre>
    return this.props.children
  }
}

function App() {

  return (
    
    <div style={{ height: '200vh' }}>
    <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
      <Renderer />
    </div>
  </div>
  )
}

export default App
