// Computer opponent: negamax search with alpha-beta pruning, move ordering and a short capture search.
import { legalMoves, applyMove, inCheck } from './engine.js'

const VALUE = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 }

// Score from the point of view of the side to move: material + small positional bonuses.
function evaluate(state) {
  let score = 0
  for (let i = 0; i < 64; i++) {
    const p = state.board[i]
    if (!p) continue
    const r = i >> 3, c = i & 7
    const centre = 7 - (Math.abs(3.5 - r) + Math.abs(3.5 - c)) // 1..7, higher near the centre
    let v = VALUE[p[1]]
    if (p[1] === 'P') v += (p[0] === 'w' ? 6 - r : r - 1) * 6 + centre
    else if (p[1] === 'N' || p[1] === 'B') v += centre * 4
    else if (p[1] === 'Q') v += centre
    score += p[0] === 'w' ? v : -v
  }
  score += Math.random() * 3 // tiny noise so the computer does not always play the same game
  return state.turn === 'w' ? score : -score
}

const orderScore = (m) => (m.captured ? 10 * VALUE[m.captured[1]] - VALUE[m.piece[1]] : 0) + (m.promo ? 800 : 0)
const ordered = (moves) => moves.sort((a, b) => orderScore(b) - orderScore(a))

function quiesce(state, alpha, beta, depth) {
  const stand = evaluate(state)
  if (stand >= beta) return beta
  if (stand > alpha) alpha = stand
  if (depth === 0) return alpha
  for (const m of ordered(legalMoves(state).filter((x) => x.captured))) {
    const score = -quiesce(applyMove(state, m), -beta, -alpha, depth - 1)
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

function search(state, depth, alpha, beta) {
  const moves = legalMoves(state)
  if (!moves.length) return inCheck(state) ? -100000 - depth : 0 // checkmate or stalemate
  if (depth === 0) return quiesce(state, alpha, beta, 3)
  for (const m of ordered(moves)) {
    const score = -search(applyMove(state, m), depth - 1, -beta, -alpha)
    if (score >= beta) return beta
    if (score > alpha) alpha = score
  }
  return alpha
}

export const LEVELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const DEPTH = { easy: 1, medium: 2, hard: 3 }

export function chooseMove(state, level) {
  const moves = legalMoves(state)
  if (!moves.length) return null
  if (level === 'easy' && Math.random() < 0.35) return moves[Math.floor(Math.random() * moves.length)]
  let best = null
  let alpha = -Infinity
  for (const m of ordered(moves)) {
    const score = -search(applyMove(state, m), DEPTH[level] - 1, -Infinity, -alpha)
    if (score > alpha || !best) { alpha = score; best = m }
  }
  return best
}
