// Chess rules engine written from scratch (no libraries).
// Board: array of 64 squares, index = row * 8 + col, row 0 = rank 8 (top), col 0 = file a.
// Pieces are strings like 'wP', 'bK' (colour + type).

export const FILES = 'abcdefgh'
export const sqName = (i) => FILES[i & 7] + (8 - (i >> 3))
const inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8

const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]
const KING = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
const ROOK = [[1, 0], [-1, 0], [0, 1], [0, -1]]
const BISHOP = [[1, 1], [1, -1], [-1, 1], [-1, -1]]

export function initialState() {
  const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  const board = Array(64).fill(null)
  back.forEach((t, c) => { board[c] = 'b' + t; board[56 + c] = 'w' + t })
  for (let c = 0; c < 8; c++) { board[8 + c] = 'bP'; board[48 + c] = 'wP' }
  return { board, turn: 'w', castling: { wK: true, wQ: true, bK: true, bQ: true }, ep: null }
}

function ray(board, r, c, dr, dc, by, types) {
  r += dr; c += dc
  while (inb(r, c)) {
    const p = board[r * 8 + c]
    if (p) return p[0] === by && types.includes(p[1])
    r += dr; c += dc
  }
  return false
}

// Is square `sq` attacked by any piece of colour `by`?
export function isAttacked(board, sq, by) {
  const r = sq >> 3, c = sq & 7
  const pr = r + (by === 'w' ? 1 : -1)
  for (const dc of [-1, 1]) if (inb(pr, c + dc) && board[pr * 8 + c + dc] === by + 'P') return true
  for (const [dr, dc] of KNIGHT) if (inb(r + dr, c + dc) && board[(r + dr) * 8 + c + dc] === by + 'N') return true
  for (const [dr, dc] of KING) if (inb(r + dr, c + dc) && board[(r + dr) * 8 + c + dc] === by + 'K') return true
  for (const [dr, dc] of ROOK) if (ray(board, r, c, dr, dc, by, 'RQ')) return true
  for (const [dr, dc] of BISHOP) if (ray(board, r, c, dr, dc, by, 'BQ')) return true
  return false
}

// All moves that follow piece movement rules (may still leave own king in check).
function pseudoMoves(state) {
  const { board, turn, castling, ep } = state
  const opp = turn === 'w' ? 'b' : 'w'
  const moves = []
  const add = (from, to, extra = {}) =>
    moves.push({ from, to, piece: board[from], captured: board[to] || null, ...extra })

  for (let from = 0; from < 64; from++) {
    const p = board[from]
    if (!p || p[0] !== turn) continue
    const r = from >> 3, c = from & 7, t = p[1]

    if (t === 'P') {
      const dir = turn === 'w' ? -1 : 1
      const startRow = turn === 'w' ? 6 : 1
      const lastRow = turn === 'w' ? 0 : 7
      const push = (to, extra) => {
        if (to >> 3 === lastRow) for (const promo of ['Q', 'R', 'B', 'N']) add(from, to, { ...extra, promo })
        else add(from, to, extra)
      }
      const one = (r + dir) * 8 + c
      if (inb(r + dir, c) && !board[one]) {
        push(one)
        if (r === startRow && !board[one + dir * 8]) add(from, one + dir * 8, { double: true })
      }
      for (const dc of [-1, 1]) {
        if (!inb(r + dir, c + dc)) continue
        const to = (r + dir) * 8 + c + dc
        if (board[to] && board[to][0] === opp) push(to)
        else if (to === ep) add(from, to, { enPassant: true, captured: board[r * 8 + c + dc] })
      }
    } else if (t === 'N' || t === 'K') {
      for (const [dr, dc] of t === 'N' ? KNIGHT : KING) {
        if (!inb(r + dr, c + dc)) continue
        const to = (r + dr) * 8 + c + dc
        if (!board[to] || board[to][0] === opp) add(from, to)
      }
      const home = turn === 'w' ? 56 : 0
      if (t === 'K' && from === home + 4 && !isAttacked(board, from, opp)) {
        if (castling[turn + 'K'] && !board[home + 5] && !board[home + 6] && board[home + 7] === turn + 'R' &&
            !isAttacked(board, home + 5, opp) && !isAttacked(board, home + 6, opp)) add(from, home + 6, { castle: 'K' })
        if (castling[turn + 'Q'] && !board[home + 1] && !board[home + 2] && !board[home + 3] && board[home] === turn + 'R' &&
            !isAttacked(board, home + 3, opp) && !isAttacked(board, home + 2, opp)) add(from, home + 2, { castle: 'Q' })
      }
    } else {
      const dirs = t === 'R' ? ROOK : t === 'B' ? BISHOP : [...ROOK, ...BISHOP]
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc
        while (inb(rr, cc)) {
          const to = rr * 8 + cc
          if (!board[to]) add(from, to)
          else { if (board[to][0] === opp) add(from, to); break }
          rr += dr; cc += dc
        }
      }
    }
  }
  return moves
}

export function applyMove(state, m) {
  const board = state.board.slice()
  const turn = state.turn
  board[m.to] = m.promo ? turn + m.promo : m.piece
  board[m.from] = null
  if (m.enPassant) board[m.to + (turn === 'w' ? 8 : -8)] = null
  if (m.castle === 'K') { board[m.to - 1] = board[m.to + 1]; board[m.to + 1] = null }
  if (m.castle === 'Q') { board[m.to + 1] = board[m.to - 2]; board[m.to - 2] = null }

  const castling = { ...state.castling }
  const strip = (sq) => {
    if (sq === 60) castling.wK = castling.wQ = false
    if (sq === 4) castling.bK = castling.bQ = false
    if (sq === 63) castling.wK = false
    if (sq === 56) castling.wQ = false
    if (sq === 7) castling.bK = false
    if (sq === 0) castling.bQ = false
  }
  strip(m.from); strip(m.to)
  return { board, turn: turn === 'w' ? 'b' : 'w', castling, ep: m.double ? (m.from + m.to) / 2 : null }
}

const kingSq = (board, color) => board.indexOf(color + 'K')

export function inCheck(state, color = state.turn) {
  return isAttacked(state.board, kingSq(state.board, color), color === 'w' ? 'b' : 'w')
}

// Fully legal moves: pseudo moves that do not leave the mover's own king in check.
export function legalMoves(state) {
  return pseudoMoves(state).filter((m) => {
    const n = applyMove(state, m)
    return !isAttacked(n.board, kingSq(n.board, state.turn), n.turn)
  })
}

function insufficientMaterial(board) {
  const rest = board.filter((p) => p && p[1] !== 'K')
  return rest.length === 0 || (rest.length === 1 && (rest[0][1] === 'N' || rest[0][1] === 'B'))
}

// 'checkmate' | 'stalemate' | 'draw' | 'check' | 'playing'
export function getStatus(state) {
  const check = inCheck(state)
  if (legalMoves(state).length === 0) return check ? 'checkmate' : 'stalemate'
  if (insufficientMaterial(state.board)) return 'draw'
  return check ? 'check' : 'playing'
}

// Standard algebraic notation, e.g. e4, Nf3, exd5, O-O, e8=Q+, Qh5#
export function toSAN(state, m, legal) {
  let s
  if (m.castle) s = m.castle === 'K' ? 'O-O' : 'O-O-O'
  else if (m.piece[1] === 'P') {
    s = (m.captured ? FILES[m.from & 7] + 'x' : '') + sqName(m.to)
    if (m.promo) s += '=' + m.promo
  } else {
    s = m.piece[1]
    const others = legal.filter((o) => o !== m && o.piece === m.piece && o.to === m.to)
    if (others.length) {
      if (!others.some((o) => (o.from & 7) === (m.from & 7))) s += FILES[m.from & 7]
      else if (!others.some((o) => o.from >> 3 === m.from >> 3)) s += 8 - (m.from >> 3)
      else s += sqName(m.from)
    }
    if (m.captured) s += 'x'
    s += sqName(m.to)
  }
  const st = getStatus(applyMove(state, m))
  return st === 'checkmate' ? s + '#' : st === 'check' ? s + '+' : s
}
