import { useState, useEffect, useMemo } from 'react'
import { initialState, legalMoves, applyMove, getStatus, toSAN, FILES } from '../chess/engine.js'
import { chooseMove, LEVELS } from '../chess/ai.js'

const GLYPH = { K: '\u265A', Q: '\u265B', R: '\u265C', B: '\u265D', N: '\u265E', P: '\u265F' }
const glyph = (p) => GLYPH[p[1]] + '\uFE0E' // \uFE0E forces text (not emoji) rendering
const NAME = { w: 'White', b: 'Black' }
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function Game({ config, onMenu }) {
  const { mode, level, color: myColor, minutes } = config
  const START_TIME = minutes * 60
  const vsComputer = mode === 'computer'
  const flipped = vsComputer && myColor === 'b'
  const [positions, setPositions] = useState([initialState()])
  const [moves, setMoves] = useState([]) // { move, san, by }
  const [selected, setSelected] = useState(null)
  const [pending, setPending] = useState(null) // promotion choices
  const [message, setMessage] = useState('')
  const [times, setTimes] = useState({ w: START_TIME, b: START_TIME })

  const state = positions[positions.length - 1]
  const legal = useMemo(() => legalMoves(state), [state])
  const status = useMemo(() => getStatus(state), [state])
  const timeout = times.w === 0 ? 'w' : times.b === 0 ? 'b' : null
  const over = status === 'checkmate' || status === 'stalemate' || status === 'draw' || !!timeout

  // Countdown: only the player whose turn it is loses time.
  useEffect(() => {
    if (over) return
    const id = setInterval(
      () => setTimes((t) => ({ ...t, [state.turn]: Math.max(0, t[state.turn] - 1) })),
      1000
    )
    return () => clearInterval(id)
  }, [state.turn, over])

  const computerTurn = vsComputer && !over && state.turn !== myColor

  // Computer move: runs shortly after the player's move so the board can repaint first.
  useEffect(() => {
    if (!computerTurn) return
    const id = setTimeout(() => {
      const m = chooseMove(state, level)
      if (m) play(m)
    }, 400)
    return () => clearTimeout(id)
  }, [state, computerTurn]) // eslint-disable-line react-hooks/exhaustive-deps

  const play = (move) => {
    const m = legal.find((x) => x.from === move.from && x.to === move.to && x.promo === move.promo)
    const san = toSAN(state, m, legal)
    setPositions((p) => [...p, applyMove(state, m)])
    setMoves((ms) => [...ms, { move: m, san, by: state.turn }])
    setSelected(null); setPending(null); setMessage('')
  }

  const clickSquare = (i) => {
    if (over || pending || computerTurn) return
    const piece = state.board[i]
    const options = selected !== null ? legal.filter((m) => m.from === selected && m.to === i) : []
    if (options.length) {
      if (options[0].promo) setPending(options)
      else play(options[0])
    } else if (piece && piece[0] === state.turn) {
      setSelected(i)
      setMessage(legal.some((m) => m.from === i) ? '' : 'That piece has no legal moves.')
    } else if (selected !== null) {
      setSelected(null)
      setMessage(state.board[selected] && 'Illegal move!')
    }
  }

  const canUndo = moves.length >= (vsComputer ? 2 : 1) && !timeout && !computerTurn

  const undo = () => {
    if (!canUndo) return
    const n = vsComputer ? 2 : 1 // against the computer, undo both the computer's reply and your move
    setPositions((p) => p.slice(0, -n)); setMoves((m) => m.slice(0, -n))
    setSelected(null); setPending(null); setMessage('')
  }

  const reset = () => {
    setPositions([initialState()]); setMoves([]); setSelected(null); setPending(null)
    setMessage(''); setTimes({ w: START_TIME, b: START_TIME })
  }

  const targets = new Map(legal.filter((m) => m.from === selected).map((m) => [m.to, !!m.captured]))
  const last = moves.length ? moves[moves.length - 1].move : null
  const kingInCheck = status === 'check' || status === 'checkmate' ? state.board.indexOf(state.turn + 'K') : -1
  const opp = state.turn === 'w' ? 'b' : 'w'

  let banner = `${NAME[state.turn]} to move`
  if (timeout) banner = `Time out! ${NAME[timeout === 'w' ? 'b' : 'w']} wins`
  else if (status === 'checkmate') banner = `Checkmate! ${NAME[opp]} wins`
  else if (status === 'stalemate') banner = 'Stalemate: draw'
  else if (status === 'draw') banner = 'Draw: insufficient material'
  else if (status === 'check') banner = `Check! ${NAME[state.turn]} to move`
  if (computerTurn && !over) banner += ' (computer thinking...)'

  const PlayerBar = ({ color }) => (
    <div className={`bar ${state.turn === color && !over ? 'active' : ''}`}>
      <div>
        <strong>{vsComputer ? (color === myColor ? `You (${NAME[color]})` : `Computer · ${LEVELS[level]}`) : NAME[color]}</strong>
        <span className="captured">
          {moves.filter((x) => x.by === color && x.move.captured).map((x, i) => (
            <span key={i} className={x.move.captured[0] === 'w' ? 'wp' : 'bp'}>{glyph(x.move.captured)}</span>
          ))}
        </span>
      </div>
      <div className={`clock ${times[color] < 30 ? 'low' : ''}`}>{fmt(times[color])}</div>
    </div>
  )

  const rows = []
  for (let i = 0; i < moves.length; i += 2) rows.push([moves[i], moves[i + 1]])

  return (
    <div className="app">
      <div className="left">
        <PlayerBar color={flipped ? 'w' : 'b'} />
        <div className="board">
          {state.board.map((_, k) => {
            const i = flipped ? 63 - k : k // square shown at screen position k
            const p = state.board[i]
            const r = i >> 3, c = i & 7
            const cls = ['sq', (r + c) % 2 ? 'dark' : 'light']
            if (i === selected) cls.push('sel')
            if (last && (i === last.from || i === last.to)) cls.push('last')
            if (i === kingInCheck) cls.push('check')
            return (
              <div key={k} className={cls.join(' ')} onClick={() => clickSquare(i)}>
                {(k & 7) === 0 && <span className="rank">{8 - r}</span>}
                {k >> 3 === 7 && <span className="file">{FILES[c]}</span>}
                {p && <span className={p[0] === 'w' ? 'wp piece' : 'bp piece'}>{glyph(p)}</span>}
                {targets.has(i) && <span className={targets.get(i) ? 'ring' : 'dot'} />}
              </div>
            )
          })}
        </div>
        <PlayerBar color={flipped ? 'b' : 'w'} />
      </div>

      <div className="right">
        <div className={`banner ${over || status === 'check' ? 'alert' : ''}`}>{banner}</div>
        {message && <div className="msg">{message}</div>}
        {pending && (
          <div className="promo">
            Promote to:
            {pending.map((m) => (
              <button key={m.promo} onClick={() => play(m)}>{glyph(state.turn + m.promo)}</button>
            ))}
          </div>
        )}
        <div className="buttons">
          <button onClick={undo} disabled={!canUndo}>Undo</button>
          <button onClick={reset}>Restart</button>
          <button className="ghost" onClick={onMenu}>Menu</button>
        </div>
        <h3>Moves</h3>
        <ol className="movelist">
          {rows.map(([a, b], i) => (
            <li key={i}><span className="n">{i + 1}.</span><span>{a.san}</span><span>{b ? b.san : ''}</span></li>
          ))}
        </ol>
      </div>
    </div>
  )
}
