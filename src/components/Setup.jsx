import { useState } from 'react'
import { LEVELS } from '../chess/ai.js'

function Choice({ value, current, onPick, children }) {
  return (
    <button className={`choice ${current === value ? 'picked' : ''}`} onClick={() => onPick(value)}>
      {children}
    </button>
  )
}

export default function Setup({ initialMode, onStart }) {
  const [mode, setMode] = useState(initialMode)
  const [level, setLevel] = useState('medium')
  const [color, setColor] = useState('w')
  const [minutes, setMinutes] = useState(10)

  return (
    <main className="setup">
      <h2>Game Setup</h2>

      <h3>Game mode</h3>
      <div className="choices">
        <Choice value="computer" current={mode} onPick={setMode}>🤖 vs Computer</Choice>
        <Choice value="two" current={mode} onPick={setMode}>👥 Two Players</Choice>
      </div>

      {mode === 'computer' && (
        <>
          <h3>Difficulty</h3>
          <div className="choices">
            {Object.entries(LEVELS).map(([key, label]) => (
              <Choice key={key} value={key} current={level} onPick={setLevel}>{label}</Choice>
            ))}
          </div>

          <h3>You play as</h3>
          <div className="choices">
            <Choice value="w" current={color} onPick={setColor}>White</Choice>
            <Choice value="b" current={color} onPick={setColor}>Black</Choice>
          </div>
        </>
      )}

      <h3>Time per player</h3>
      <div className="choices">
        {[3, 5, 10, 15].map((m) => (
          <Choice key={m} value={m} current={minutes} onPick={setMinutes}>{m} min</Choice>
        ))}
      </div>

      <button className="primary start" onClick={() => onStart({ mode, level, color: mode === 'computer' ? color : 'w', minutes })}>
        Start Game
      </button>
    </main>
  )
}
