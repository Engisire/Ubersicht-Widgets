import { run } from 'uebersicht';

export const refreshFrequency = 2000;

export const handleThemeToggle = () => {
  run(`
    THEME=$(cat /tmp/vinyl_theme.txt 2>/dev/null || echo "realistic")
    if [ "$THEME" = "realistic" ]; then
      echo "realistic-clean" > /tmp/vinyl_theme.txt
    elif [ "$THEME" = "realistic-clean" ]; then
      echo "acrylic" > /tmp/vinyl_theme.txt
    elif [ "$THEME" = "acrylic" ]; then
      echo "persona" > /tmp/vinyl_theme.txt
    elif [ "$THEME" = "persona" ]; then
      echo "turntable" > /tmp/vinyl_theme.txt
    else
      echo "realistic" > /tmp/vinyl_theme.txt
    fi
  `);
};

export const handleAction = (action) => {
  let cmd = '';
  if (action === 'shuffle') cmd = 'set shuffling to not shuffling';
  else if (action === 'repeat') cmd = 'set repeating to not repeating';
  else if (action === 'playpause') cmd = 'playpause';
  else if (action === 'next') cmd = 'next track';
  else if (action === 'previous') cmd = 'previous track';
  else if (action === 'like') cmd = 'set starred of current track to not (starred of current track)';
  
  const script = `
    if application "Spotify" is running then
      tell application "Spotify" to ${cmd}
    end if
  `;
  run(`osascript -e '${script}'`);
};

export const command = `
THEME=$(cat /tmp/vinyl_theme.txt 2>/dev/null || echo "realistic")
DATA=$(osascript -e '
  if application "Spotify" is running then
    tell application "Spotify"
      set pState to player state as string
      set tName to name of current track
      set tArtist to artist of current track
      set isShuf to shuffling as string
      set isRep to repeating as string
      set isFav to "false"
      
      try
        set isFav to starred of current track as string
      end try
      
      if pState is "playing" then
        try
          set aUrl to artwork url of current track
          return "playing|" & aUrl & "|" & tName & "|" & tArtist & "|" & isShuf & "|" & isRep & "|" & isFav
        on error
          return "playing|none|" & tName & "|" & tArtist & "|" & isShuf & "|" & isRep & "|" & isFav
        end try
      else
        try
          set aUrl to artwork url of current track
          return "paused|" & aUrl & "|" & tName & "|" & tArtist & "|" & isShuf & "|" & isRep & "|" & isFav
        on error
          return "paused|none|" & tName & "|" & tArtist & "|" & isShuf & "|" & isRep & "|" & isFav
        end try
      end if
    end tell
  else
    return "stopped|none|No Track|Unknown|false|false|false"
  end if
')
echo "$THEME|$DATA"
`;

export const updateState = (event, previousState) => {
  if (event.error) return { theme: 'realistic', playState: 'stopped', artUrl: null, title: 'No Music Playing', artist: 'Offline', shuffle: false, repeat: false, liked: false };
  
  const parts = event.output.trim().split('|');
  const theme = parts[0] || 'realistic';
  const playState = parts[1] || 'stopped';
  const rawArt = parts[2];
  const title = parts[3] || 'No Track';
  const artist = parts[4] || 'Unknown';
  const shuffle = parts[5] === 'true';
  const repeat = parts[6] === 'true';
  const liked = parts[7] === 'true';
  
  const artUrl = (rawArt && rawArt !== 'none' && rawArt !== 'missing value') ? rawArt : null;
  
  return { theme, playState, artUrl, title, artist, shuffle, repeat, liked };
};

const formatTitle = (text) => {
  const parts = text.split(/\s+(?=\(?(?:feat\.?|ft\.?|featuring)\b)/i);
  return parts.map((part, index) => (
    <span key={index} className="song-title-line">{part.trim()}</span>
  ));
};

export const render = (state) => {
  const theme = state ? state.theme : 'realistic';
  const playState = state ? state.playState : 'stopped';
  const artUrl = state ? state.artUrl : null;
  const title = state ? state.title : 'No Track';
  const artist = state ? state.artist : 'Unknown';
  const isShuffle = state ? state.shuffle : false;
  const isRepeat = state ? state.repeat : false;
  const isLiked = state ? state.liked : false;
  
  const isPlaying = playState === 'playing';

  return (
    <div className={`widget-wrapper ${theme}`}>
      {/* Turntable Design Structure (Only used in 'turntable' mode) */}
      <div className="turntable-deck">
        <div className={`turntable-vinyl ${isPlaying && theme === 'turntable' ? 'is-spinning' : 'is-paused'}`}>
          <div className="vinyl-sheen"></div>
          <div 
            className="vinyl-sticker"
            style={{ backgroundImage: artUrl ? `url("${artUrl}")` : 'none' }}
          >
            <div className="spindle-hole"></div>
          </div>
        </div>
        <div className="tonearm-base"></div>
        <div className={`tonearm ${isPlaying && theme === 'turntable' ? 'playing' : 'rest'}`}></div>
      </div>

      {/* Standard Sleeve Structure (Used for all other modes) */}
      <div className="sleeve-container">
        <div className={`real-vinyl ${isPlaying ? 'is-spinning' : 'is-paused'}`}>
          <div className="vinyl-sheen"></div>
          <div 
            className="vinyl-sticker"
            style={{ backgroundImage: artUrl ? `url("${artUrl}")` : 'none' }}
          >
            <div className="spindle-hole"></div>
          </div>
        </div>
        <div 
          className="album-cover-sleeve"
          style={{ backgroundImage: artUrl ? `url("${artUrl}")` : 'none' }}
        >
          <div className="sleeve-spine"></div>
          <div className="cardboard-overlay"></div>
        </div>
      </div>

      <div className="side-panel">
        <div className="track-info">
          <div className="song-title">{formatTitle(title)}</div>
          <div className="song-artist">{artist}</div>
        </div>

        <div className="vertical-controls">
          <button className="control-btn theme-btn" onClick={handleThemeToggle} title="Change Theme">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2V4a8 8 0 100 16z"/>
            </svg>
          </button>

          <button className={`control-btn action-btn ${isLiked ? 'active' : ''}`} onClick={() => handleAction('like')} title="Like Song">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button className={`control-btn action-btn ${isShuffle ? 'active' : ''}`} onClick={() => handleAction('shuffle')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button className="control-btn action-btn" onClick={() => handleAction('previous')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button className="control-btn play-btn" onClick={() => handleAction('playpause')}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          <button className="control-btn action-btn" onClick={() => handleAction('next')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button className={`control-btn action-btn ${isRepeat ? 'active' : ''}`} onClick={() => handleAction('repeat')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export const className = `
  @font-face {
    font-family: 'P5Font';
    src: local('Persona5MenuFontPrototype-Regular'), 
         url('Persona5MenuFontPrototype-Regular.ttf') format('truetype');
  }

  bottom: 50px;
  right: 20px;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  
  .widget-wrapper {
    display: flex;
    align-items: center;
    gap: 30px; 
  }

  /* Default Hidden Turntable Container */
  .turntable-deck {
    display: none;
  }

  .sleeve-container {
    position: relative;
    width: 295px;
    height: 200px;
    display: flex;
    align-items: center;
  }

  .album-cover-sleeve {
    position: absolute;
    left: 0;
    width: 200px;
    height: 200px;
    border-radius: 4px;
    background-color: #1a1a1a;
    background-size: cover;
    background-position: center;
    z-index: 2;
    box-shadow: 10px 15px 30px rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: all 0.4s ease-in-out;
  }

  .sleeve-spine {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(to right, rgba(255,255,255,0.25), transparent);
  }

  .cardboard-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.3) 100%);
    pointer-events: none;
  }

  .real-vinyl {
    position: absolute;
    left: 105px;
    width: 190px;
    height: 190px;
    border-radius: 50%;
    background: radial-gradient(circle, 
      #0a0a0a 0%, #141414 25%, #050505 30%, 
      #1a1a1a 45%, #080808 55%, #181818 70%, #000000 100%
    );
    z-index: 1;
    box-shadow: 5px 8px 25px rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    animation: vinyl-spin 3s linear infinite;
    transition: animation-play-state 1.2s cubic-bezier(0.25, 1, 0.5, 1), background 0.4s ease;
  }

  .real-vinyl.is-spinning { animation-play-state: running; }
  .real-vinyl.is-paused { animation-play-state: paused; }

  .vinyl-sheen {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg, transparent 0deg, rgba(255, 255, 255, 0.12) 45deg,
      transparent 90deg, rgba(255, 255, 255, 0.12) 225deg, transparent 270deg
    );
    pointer-events: none;
  }

  .vinyl-sticker {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-size: cover;
    background-position: center;
    background-color: #222;
    border: 2px solid #080808;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 0 6px rgba(0,0,0,0.9);
  }

  .spindle-hole {
    width: 12px;
    height: 12px;
    background: #000;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .side-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
  }

  .track-info {
    display: flex;
    flex-direction: column;
    text-align: right; 
    max-width: 220px;
  }

  .song-title {
    color: #ffffff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .song-title-line {
    white-space: normal;
    word-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.1;
  }

  .song-title-line:nth-child(n+2) {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    margin-top: 2px;
  }

  .song-artist {
    color: rgba(255, 255, 255, 0.65);
    font-size: 14px;
    font-weight: 500;
    margin-top: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  .vertical-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .control-btn {
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 0;
  }

  .control-btn:hover {
    color: #ffffff;
    transform: scale(1.1);
  }

  .control-btn.active {
    color: #1DB954; 
  }

  .theme-btn {
    margin-bottom: 8px;
    opacity: 0.8;
    color: #fff;
  }
  
  .theme-btn:hover {
    opacity: 1;
  }

  .play-btn {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(5px);
  }

  /* --- REALISTIC THEME --- */
  .realistic .real-vinyl {
    animation-play-state: paused;
  }
  .realistic .real-vinyl.is-spinning {
    animation-play-state: running;
  }

  /* --- REALISTIC-CLEAN THEME --- */
  .realistic-clean .album-cover-sleeve {
    background-color: #e5e5ea;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 10px 15px 30px rgba(0, 0, 0, 0.15);
  }
  .realistic-clean .cardboard-overlay {
    background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(0,0,0,0.05) 100%);
  }
  .realistic-clean .real-vinyl {
    background: radial-gradient(circle, #2c2c2e 0%, #3a3a3c 25%, #1c1c1e 50%, #000000 100%);
    border: 1px solid rgba(0, 0, 0, 0.2);
  }
  .realistic-clean .song-title { color: #1c1c1e; text-shadow: none; }
  .realistic-clean .song-title-line:nth-child(n+2) { color: #3a3a3c; }
  .realistic-clean .song-artist { color: #636366; text-shadow: none; }
  .realistic-clean .control-btn { color: #8e8e93; }
  .realistic-clean .control-btn:hover { color: #1c1c1e; }
  .realistic-clean .play-btn { color: #1c1c1e; background: rgba(0, 0, 0, 0.05); border: 1px solid rgba(0, 0, 0, 0.15); }
  .realistic-clean .theme-btn { color: #1c1c1e; }

  /* --- ACRYLIC THEME (Restored Original Glass) --- */
  .acrylic .album-cover-sleeve {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 10px 40px rgba(255,255,255,0.15);
  }
  .acrylic .sleeve-spine, .acrylic .cardboard-overlay { display: none; }
  .acrylic .real-vinyl {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 30px rgba(255,255,255,0.1);
  }
  .acrylic .vinyl-sheen {
    background: conic-gradient(from 0deg, transparent 0deg, rgba(255, 255, 255, 0.3) 45deg, transparent 90deg, rgba(255, 255, 255, 0.3) 225deg, transparent 270deg);
  }
  .acrylic .vinyl-sticker { border: 2px solid #fff; box-shadow: 0 0 10px rgba(255,255,255,0.4); }
  .acrylic .spindle-hole { background: #fff; border: none; }
  .acrylic .song-title { color: #fff; text-shadow: 0 0 15px rgba(255,255,255,0.5); }
  .acrylic .song-artist { color: rgba(255, 255, 255, 0.8); }
  .acrylic .control-btn { color: rgba(255, 255, 255, 0.7); }
  .acrylic .control-btn:hover, .acrylic .control-btn.active { color: #fff; text-shadow: 0 0 8px #fff; }
  .acrylic .play-btn { background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 0 15px rgba(255,255,255,0.2); }

  /* --- PERSONA 5 THEME --- */
  .persona .album-cover-sleeve {
    border: 4px solid #000; border-radius: 0; box-shadow: 6px 6px 0px #E60012; transform: rotate(-2deg);
  }
  .persona .sleeve-spine, .persona .cardboard-overlay { display: none; }
  .persona .real-vinyl { border: 3px solid #000; box-shadow: none; }
  .persona .vinyl-sticker { border: 4px solid #E60012; }
  .persona .song-title, .persona .song-title-line, .persona .song-artist { font-family: 'P5Font', sans-serif !important; }
  .persona .song-title { color: #E60012; font-size: 24px; text-shadow: 2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000; letter-spacing: 2px; transform: skew(-6deg); }
  .persona .song-title-line:nth-child(n+2) { color: #f5f5f7; font-size: 16px; }
  .persona .song-artist { color: #f5f5f7; background-color: #121212; padding: 6px 12px; font-size: 16px; transform: skew(-10deg); border: 3px solid #000; box-shadow: 3px 3px 0px #E60012; text-shadow: none; }
  .persona .action-btn { background-color: #121212; color: #f5f5f7; border: 3px solid #000; width: 34px; height: 34px; transform: skew(-5deg); box-shadow: 2px 2px 0px #E60012; opacity: 1; }
  .persona .action-btn:hover { background-color: #E60012; color: #000; }
  .persona .action-btn.active { background-color: #E60012; color: #fff; }
  .persona .play-btn { background: #E60012; color: #fff; border: 4px solid #000; border-radius: 0; width: 48px; height: 48px; transform: skew(-8deg); box-shadow: 4px 4px 0px #000; backdrop-filter: none; }
  .persona .theme-btn { color: #f5f5f7; background: #121212; border: 2px solid #000; border-radius: 50%; width: 28px; height: 28px; box-shadow: 2px 2px 0px #000; opacity: 1; }

  /* --- TURNTABLE THEME (4th Design) --- */
  .turntable .sleeve-container { display: none; }
  .turntable .turntable-deck {
    display: block;
    position: relative;
    width: 200px;
    height: 200px;
    background: #111113;
    border-radius: 12px;
    border: 3px solid #2c2c2e;
    box-shadow: 10px 15px 35px rgba(0,0,0,0.8), inset 0 0 15px rgba(255,255,255,0.05);
  }
  .turntable .turntable-vinyl {
    position: absolute;
    top: 5px;
    left: 5px;
    width: 186px;
    height: 186px;
    border-radius: 50%;
    background: radial-gradient(circle, #0a0a0a 0%, #1c1c1e 30%, #050505 50%, #111 100%);
    box-shadow: inset 0 0 15px rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: vinyl-spin 3s linear infinite;
  }
  .turntable .turntable-vinyl.is-paused { animation-play-state: paused; }
  .turntable .tonearm-base {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 22px;
    height: 22px;
    background: #48484a;
    border-radius: 50%;
    border: 2px solid #636366;
    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  }
  .turntable .tonearm {
    position: absolute;
    top: 25px;
    right: 25px;
    width: 4px;
    height: 110px;
    background: linear-gradient(to right, #8e8e93, #d1d1d6);
    border-radius: 2px;
    transform-origin: top center;
    transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 2px 4px 6px rgba(0,0,0,0.4);
  }
  .turntable .tonearm.rest { transform: rotate(25deg); }
  .turntable .tonearm.playing { transform: rotate(-12deg); }

  @keyframes vinyl-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
