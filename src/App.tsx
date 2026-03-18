import Renderer from "./assets/Renderer"
import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import Navbar from "./assets/Navbar"
import HorizontalScroll from "./assets/HorizontalScroll"
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'

gsap.registerPlugin(ScrollTrigger)

class ErrorBoundary extends Component<{children: ReactNode}, {error: string | null}> {
  state = { error: null }
  componentDidCatch(e: Error) { this.setState({ error: e.message }) }
  render() {
    if (this.state.error) return <pre style={{color:'red', padding:'2rem'}}>{this.state.error}</pre>
    return this.props.children
  }
}

function App() {
  useEffect(() => {
    // ── Single Lenis instance for the whole app ──
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => 1 - Math.pow(1 - t, 4), 
    })

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(time => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div>
      <Navbar />
      <div style={{ height: '200vh' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <Renderer />
        </div>
      </div>
      <HorizontalScroll />
    </div>
  )
}

export default App