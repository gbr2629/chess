import { useState } from 'react'
import Home from './components/Home.jsx'
import Setup from './components/Setup.jsx'
import Game from './components/Game.jsx'

// Simple screen switching (no router needed): 'home' -> 'setup' -> 'game'
export default function App() {
  const [screen, setScreen] = useState('home')
  const [preset, setPreset] = useState('computer')
  const [config, setConfig] = useState(null)

  const goSetup = (mode) => { if (mode) setPreset(mode); setScreen('setup') }

  return (
    <>
      <header className="nav">
        <button className="brand" onClick={() => setScreen('home')}>♞ Chess Arena</button>
        <nav>
          <button className={screen === 'home' ? 'on' : ''} onClick={() => setScreen('home')}>Home</button>
          <button className={screen !== 'home' ? 'on' : ''} onClick={() => goSetup()}>Play</button>
        </nav>
      </header>

      {screen === 'home' && <Home onPlay={goSetup} />}
      {screen === 'setup' && (
        <Setup initialMode={preset} onStart={(c) => { setConfig(c); setScreen('game') }} />
      )}
      {screen === 'game' && <Game config={config} onMenu={() => setScreen('setup')} />}
    </>
  )
}
