import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import gsap from 'gsap'
import Navbar from './assets/reuse/Navbar'
import Hero from './components/sections/Hero'
import Features from './components/sections/Features'
import Pricing from './components/sections/Pricing'
import Footer from './components/sections/Footer'
import LogoMarquee from './assets/reuse/LogoMarquee'
import type { LogoEntry } from './assets/reuse/LogoMarquee'

import './App.css'

const EXAMPLE_LOGOS: LogoEntry[] = [
  { name: 'SAP Cloud ERP',    logo: <img src="https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg/sap-logo-svg.svg" alt="SAP" /> },
  { name: 'Workday',    logo: <img src="https://workday.wd5.myworkdayjobs.com/Workday/assets/logo" alt="Workday" /> },
  { name: 'SAP ByDesign',  logo: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/SAP_Business_ByDesign.jpg/960px-SAP_Business_ByDesign.jpg" alt="SAP ByD" /> },
  { name: 'Teams',    logo: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Microsoft_Office_Teams_%282025%E2%80%93present%29.svg/250px-Microsoft_Office_Teams_%282025%E2%80%93present%29.svg.png" alt="MS Teams" /> },
  { name: 'WhatsApp',     logo: <img src="https://static.whatsapp.net/rsrc.php/yY/r/_mMwO8HKa4V.svg" alt="WhasApp" /> },
  { name: 'Microsoft Entra',    logo: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Microsoft_Entra_ID_color_icon.svg/330px-Microsoft_Entra_ID_color_icon.svg.png" alt="MS Entra" /> },
  { name: 'Dynamics',     logo: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Microsoft_Dynamics_365_Logo_%282021%E2%80%93present%29.svg/500px-Microsoft_Dynamics_365_Logo_%282021%E2%80%93present%29.svg.png" alt="MS Dynamics" /> },
]

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
    <ErrorBoundary>
      <Navbar />
      <main>
        <Hero />
        <LogoMarquee logos={EXAMPLE_LOGOS} label={"Seamless integration with"}/>
        <Features />
        <Pricing />
        <Footer />
      </main>
    </ErrorBoundary>
  )
}

export default App

/*<Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
        <Footer />
      </main>*/