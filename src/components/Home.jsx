const FEATURES = [
  ['🤖', 'Play the computer', 'Three difficulty levels: Easy, Medium and Hard.'],
  ['👥', 'Two players', 'Share one screen and take turns, completely offline.'],
  ['♟️', 'Full chess rules', 'Castling, en passant, promotion, check, checkmate and stalemate.'],
  ['⏱️', 'Chess clocks', 'Countdown timer for each player, paused on the opponent’s turn.'],
  ['📜', 'Move list', 'Every move recorded in standard notation like e4, Nf3, O-O.'],
  ['↩️', 'Undo and hints', 'Undo a move, see legal moves highlighted and captured pieces.'],
]

export default function Home({ onPlay }) {
  return (
    <main className="home">
      <section className="hero">
        <h1>Play chess. <span>Your way.</span></h1>
        <p>An offline chess game built with React. Challenge a friend on the same screen or take on the computer.</p>
        <div className="hero-buttons">
          <button className="primary" onClick={() => onPlay('computer')}>Play vs Computer</button>
          <button className="secondary" onClick={() => onPlay('two')}>Two Players</button>
        </div>
        <div className="hero-pieces" aria-hidden="true">♜ ♞ ♝ ♛ ♚ ♝ ♞ ♜</div>
      </section>

      <section className="section">
        <h2>Features</h2>
        <div className="features">
          {FEATURES.map(([icon, title, text]) => (
            <div className="feature" key={title}>
              <div className="icon">{icon}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <ol className="steps">
          <li><strong>Choose a mode.</strong> Pick two players or the computer, then set difficulty, colour and time.</li>
          <li><strong>Click to move.</strong> Click a piece to see its legal moves, then click a highlighted square.</li>
          <li><strong>Win the game.</strong> Checkmate your opponent or win on time.</li>
        </ol>
        <button className="primary" onClick={() => onPlay()}>Start playing</button>
      </section>

      <footer className="footer">Chess Arena · React Mini Project</footer>
    </main>
  )
}
