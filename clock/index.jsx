import { run, React } from 'uebersicht';

export const refreshFrequency = 1000;

export const command = `
THEME=$(cat /tmp/vinyl_theme.txt 2>/dev/null || cat /tmp/desktop_theme.txt 2>/dev/null || echo "realistic")
TIME=$(date +"%H|%M|%S|%A, %B %d|%I|%p|%m|%d|%u|%a|%b")
echo "$THEME^^$TIME"
`;

export const handleClockThemeToggle = () => {
  run(`
    THEME=$(cat /tmp/vinyl_theme.txt 2>/dev/null || echo "realistic")
    if [ "$THEME" = "realistic" ]; then
      NEXT="realistic-clean"; D_NEXT="basic"
    elif [ "$THEME" = "realistic-clean" ]; then
      NEXT="acrylic"; D_NEXT="acrylic"
    elif [ "$THEME" = "acrylic" ]; then
      NEXT="persona"; D_NEXT="persona"
    elif [ "$THEME" = "persona" ]; then
      NEXT="turntable"; D_NEXT="realistic"
    else
      NEXT="realistic"; D_NEXT="realistic"
    fi
    echo "$NEXT" > /tmp/vinyl_theme.txt
    echo "$D_NEXT" > /tmp/desktop_theme.txt
  `);
};

// This function safely manages both the time updates, external theme sync, and clicks
export const updateState = (event, previousState) => {
  // Handle optimistic local click event
  if (event.type === 'CYCLE_THEME') {
    const cycle = ['realistic', 'realistic-clean', 'acrylic', 'persona', 'turntable'];
    const current = previousState?.theme || 'realistic';
    const nextIndex = (cycle.indexOf(current) + 1) % cycle.length;
    return {
      ...(previousState || {}),
      theme: cycle[nextIndex]
    };
  }

  // Handle errors defensibly
  if (event.error) {
    return { ...(previousState || {}), error: true };
  }

  // Handle recurring command output
  if (event.output) {
    const [rawTheme, rawTime] = event.output.trim().split('^^');
    const theme = rawTheme ? rawTheme.trim() : (previousState?.theme || 'realistic');
    const parts = rawTime ? rawTime.split('|') : [];
    
    return {
      ...(previousState || {}),
      theme,
      hours: parts[0] || '00',
      minutes: parts[1] || '00',
      seconds: parts[2] || '00',
      date: parts[3] || 'UNKNOWN DATE',
      hours12: parts[4] || '12',
      ampm: parts[5] || 'AM',
      month: parts[6] || '01',
      day: parts[7] || '01',
      dayOfWeek: parseInt(parts[8]) || 1,
      dayShort: (parts[9] || 'MON').toUpperCase(),
      monthShort: (parts[10] || 'JAN').toUpperCase(),
      error: false
    };
  }

  return previousState || { theme: 'realistic' };
};

export const render = (state, dispatch) => {
  if (!state || state.error) {
    return <div style={{ color: 'white', fontFamily: 'sans-serif' }}>Widget Error</div>;
  }

  const {
    theme = 'realistic',
    hours = '00',
    minutes = '00',
    seconds = '00',
    date = 'UNKNOWN DATE',
    hours12 = '12',
    ampm = 'AM',
    month = '01',
    day = '01',
    dayOfWeek = 1,
    dayShort = 'MON'
  } = state;

  // Map shared suite theme to clock display mode
  let activeTheme = 'analogue';
  if (theme === 'basic' || theme === 'realistic-clean') {
    activeTheme = 'basic';
  } else if (theme === 'acrylic') {
    activeTheme = 'acrylic';
  } else if (theme === 'persona' || theme === 'p5') {
    activeTheme = 'p5';
  } else {
    // 'realistic' or 'turntable'
    activeTheme = 'analogue';
  }

  // Cycle theme synchronously and sync with other widgets
  const handleCycleTheme = () => {
    dispatch({ type: 'CYCLE_THEME' });
    handleClockThemeToggle();
  };

  // Math for analogue clock hands
  const hDeg = (parseInt(hours) % 12) * 30 + parseInt(minutes) * 0.5;
  const mDeg = parseInt(minutes) * 6 + parseInt(seconds) * 0.1;
  const sDeg = parseInt(seconds) * 6;

  // Analogue marks array
  const clockMarks = Array.apply(null, Array(12));

  // Persona 5 HUD calculations
  const h24 = parseInt(hours) || 0;
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 7;
  let timePhase = 'LATE NIGHT';
  if (h24 >= 5 && h24 < 9) timePhase = 'EARLY MORNING';
  else if (h24 >= 9 && h24 < 12) timePhase = 'MORNING';
  else if (h24 >= 12 && h24 < 14) timePhase = isWeekend ? 'DAYTIME' : 'AFTERNOON';
  else if (h24 >= 14 && h24 < 18) timePhase = isWeekend ? 'DAYTIME' : 'AFTER SCHOOL';
  else if (h24 >= 18 && h24 < 22) timePhase = 'EVENING';

  const isDay = h24 >= 6 && h24 < 18;
  const isSat = dayOfWeek === 6;
  const isSun = dayOfWeek === 7;
  const isEvenSec = (parseInt(seconds) || 0) % 2 === 0;

  return (
    <div className="widget-root" onClick={handleCycleTheme} title="Click to cycle theme across all widgets">
      {/* 1. THE BASIC THEME (Minimalist Stacked Typography) */}
      {activeTheme === 'basic' && (
        <div className="theme-basic clock-container">
          <div className="time-stack">
            <span className="time-text hours">{hours}</span>
            <span className="time-text minutes">{minutes}</span>
          </div>
          <div className="date-string">{date}</div>
        </div>
      )}

      {/* 2. THE REALISTIC ANALOGUE THEME */}
      {activeTheme === 'analogue' && (
        <div className="theme-analogue">
          <div className="clock-face">
            {clockMarks.map((_, i) => (
              <div key={i} className="clock-mark" style={{ transform: `rotate(${i * 30}deg)` }} />
            ))}
            <div className="hand hour-hand" style={{ transform: `rotate(${hDeg}deg)` }} />
            <div className="hand minute-hand" style={{ transform: `rotate(${mDeg}deg)` }} />
            <div className="hand second-hand" style={{ transform: `rotate(${sDeg}deg)` }} />
            <div className="center-dot" />
          </div>
          <div className="analogue-date">{date}</div>
        </div>
      )}

      {/* 3. THE ACRYLIC THEME */}
      {activeTheme === 'acrylic' && (
        <div className="theme-acrylic">
          <div className="acrylic-glass">
            <div className="acrylic-time">{hours}:{minutes}</div>
            <div className="acrylic-date">{date}</div>
          </div>
        </div>
      )}

      {/* 4. THE PERSONA 5 IN-GAME HUD THEME */}
      {activeTheme === 'p5' && (
        <div className="theme-p5 p5-hud">
          {/* Top Row: Date, Day Badge, Weather Icon, and Schedule Phase */}
          <div className="p5-hud-header">
            <div className="p5-date-badge">
              <span className="p5-date-num">{parseInt(month)}</span>
              <span className="p5-date-slash">/</span>
              <span className="p5-date-num">{parseInt(day)}</span>
            </div>

            <div className={`p5-day-badge ${isSat ? 'is-sat' : isSun ? 'is-sun' : 'is-weekday'}`}>
              <span>{dayShort}</span>
            </div>

            <div className="p5-weather-badge">
              {isDay ? (
                <svg viewBox="0 0 24 24" width="20" height="20" className="p5-weather-icon">
                  <circle cx="12" cy="12" r="5" fill="#FFE500" stroke="#000" strokeWidth="1.5" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M4.9 19.1l2.2-2.2M16.9 7.1l2.2-2.2" stroke="#FFE500" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M4.9 19.1l2.2-2.2M16.9 7.1l2.2-2.2" stroke="#000" strokeWidth="1" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" className="p5-weather-icon">
                  <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-5.4-5.4c0-1.81.89-3.41 2.26-4.4A9.03 9.03 0 0 0 12 3z" fill="#FFF" stroke="#000" strokeWidth="1.5" />
                  <polygon points="18,3 19,5 21,5.5 19.5,7 20,9 18,8 16,9 16.5,7 15,5.5 17,5" fill="#FFE500" stroke="#000" strokeWidth="0.8" />
                </svg>
              )}
            </div>

            <div className="p5-phase-ribbon">
              <span className="p5-phase-marker">▶</span>
              <span className="p5-phase-text">{timePhase}</span>
            </div>
          </div>

          {/* Main Layer: Jagged Persona 5 Cutout Card */}
          <div className="p5-card-wrapper">
            <div className="p5-time-card">
              <div className="p5-digits-group">
                <span className="p5-digit-hours">{hours12}</span>
                <span className={`p5-digit-colon ${isEvenSec ? '' : 'is-dim'}`}>:</span>
                <span className="p5-digit-minutes">{minutes}</span>
              </div>

              <div className="p5-side-column">
                <div className="p5-ampm-badge">{ampm}</div>
                <div className="p5-sec-badge">:{seconds}</div>
              </div>
            </div>

            {/* In-Game Tagline Badge */}
            <div className="p5-sub-ribbon">
              <span className="p5-sub-star">★</span>
              <span className="p5-sub-text">TAKE YOUR TIME</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const className = `
  @font-face {
    font-family: 'P5Menu';
    src: url('vinyl-player.widget/Persona5MenuFontPrototype-Regular.ttf') format('truetype');
  }
  @font-face {
    font-family: 'P5Expose';
    src: url('vinyl-player.widget/Expose-Regular.otf') format('opentype');
  }
  @font-face {
    font-family: 'P5Heavy';
    src: url('vinyl-player.widget/HEAVYHEA.TTF') format('truetype');
  }
  @font-face {
    font-family: 'P5Hatty';
    src: url('vinyl-player.widget/p5hatty.ttf') format('truetype');
  }

  bottom: 50px;
  left: 50px;
  user-select: none;
  cursor: pointer;

  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif;

  .widget-root {
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
  }

  /* ========================================================
     1. BASIC THEME
     ======================================================== */
  .theme-basic.clock-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-shadow: 0 10px 30px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.6);
  }
  .theme-basic .time-stack {
    display: flex;
    flex-direction: column;
    line-height: 0.78; 
    letter-spacing: -8px; 
  }
  .theme-basic .time-text {
    font-size: 180px; 
    font-weight: 900; 
    margin: 0; padding: 0;
  }
  .theme-basic .hours { color: #ffffff; }
  .theme-basic .minutes { color: rgba(255, 255, 255, 0.4); }
  .theme-basic .date-string {
    margin-top: 15px; margin-left: 8px; 
    font-size: 14px; font-weight: 600;
    letter-spacing: 4px; text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
  }

  /* ========================================================
     2. ANALOGUE THEME
     ======================================================== */
  .theme-analogue {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5));
  }
  .clock-face {
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(20, 20, 20, 0.85);
    border: 6px solid #e0e0e0;
    box-shadow: inset 0 8px 20px rgba(0,0,0,0.8), inset 0 -4px 10px rgba(255,255,255,0.1);
    position: relative;
    backdrop-filter: blur(12px);
  }
  .clock-mark {
    position: absolute;
    top: 12px; left: 50%;
    width: 4px; height: 14px;
    background: rgba(255,255,255,0.4);
    margin-left: -2px;
    transform-origin: 2px 88px; 
    border-radius: 2px;
  }
  .hand {
    position: absolute;
    bottom: 50%; left: 50%;
    transform-origin: bottom center;
    border-radius: 4px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.6);
  }
  .hour-hand {
    width: 8px; height: 50px;
    margin-left: -4px;
    background: #ffffff;
  }
  .minute-hand {
    width: 6px; height: 75px;
    margin-left: -3px;
    background: #cccccc;
  }
  .second-hand {
    width: 2px; height: 85px;
    margin-left: -1px;
    background: #ff3b30;
  }
  .center-dot {
    position: absolute;
    top: 50%; left: 50%;
    width: 16px; height: 16px;
    margin: -8px 0 0 -8px;
    border-radius: 50%;
    background: #e0e0e0;
    border: 4px solid #ff3b30;
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  }
  .analogue-date {
    background: rgba(0,0,0,0.6);
    padding: 6px 16px;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    border: 1px solid rgba(255,255,255,0.1);
  }

  /* ========================================================
     3. ACRYLIC THEME
     ======================================================== */
  .acrylic-glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-top: 1px solid rgba(255, 255, 255, 0.4);
    border-left: 1px solid rgba(255, 255, 255, 0.4);
    padding: 30px 45px;
    border-radius: 30px;
    box-shadow: 0 25px 40px rgba(0,0,0,0.2), 0 5px 15px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .acrylic-time {
    font-size: 84px;
    font-weight: 200;
    color: #ffffff;
    letter-spacing: 2px;
    line-height: 1;
    text-shadow: 0 4px 15px rgba(0,0,0,0.2);
  }
  .acrylic-date {
    margin-top: 10px;
    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 3px;
    text-transform: uppercase;
  }

  /* ========================================================
     4. PERSONA 5 IN-GAME HUD THEME
     ======================================================== */
  .theme-p5.p5-hud {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    transform: rotate(-2.5deg);
    position: relative;
    user-select: none;
    filter: drop-shadow(8px 10px 0px rgba(0, 0, 0, 0.95));
  }

  .p5-hud-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: -10px;
    z-index: 3;
    position: relative;
    padding-left: 10px;
  }

  /* Date Badge */
  .p5-date-badge {
    background: #ffffff;
    border: 3.5px solid #000000;
    box-shadow: 4px 4px 0px #000000;
    padding: 3px 12px;
    transform: skew(-10deg);
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  .p5-date-num {
    font-family: 'P5Heavy', sans-serif !important;
    font-size: 26px;
    color: #000000;
    line-height: 1;
    letter-spacing: -0.5px;
  }

  .p5-date-slash {
    font-family: 'P5Heavy', sans-serif !important;
    font-size: 24px;
    color: #E60012;
    transform: skew(-5deg);
    margin: 0 1px;
    line-height: 1;
  }

  /* Day of Week Badge */
  .p5-day-badge {
    border: 3px solid #000000;
    box-shadow: 3px 3px 0px #000000;
    padding: 4px 10px;
    transform: skew(-10deg);
    font-family: 'P5Expose', sans-serif !important;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #ffffff;
    text-transform: uppercase;
  }

  .p5-day-badge.is-weekday {
    background: #111111;
  }

  .p5-day-badge.is-sat {
    background: #0066cc; /* Persona 5 Saturday blue */
  }

  .p5-day-badge.is-sun {
    background: #E60012; /* Persona 5 Sunday red */
  }

  /* Weather Badge */
  .p5-weather-badge {
    background: #111111;
    border: 3px solid #000000;
    box-shadow: 3px 3px 0px #000000;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: skew(-8deg);
  }

  .p5-weather-icon {
    display: block;
  }

  /* Phase Ribbon ("AFTER SCHOOL", "EVENING", etc.) */
  .p5-phase-ribbon {
    background: #000000;
    border: 2.5px solid #ffffff;
    box-shadow: 3px 3px 0px #E60012;
    padding: 4px 12px;
    transform: skew(-10deg);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .p5-phase-marker {
    color: #E60012;
    font-size: 10px;
  }

  .p5-phase-text {
    font-family: 'P5Expose', sans-serif !important;
    font-size: 13px;
    color: #ffffff;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  /* Main Red Cutout Card */
  .p5-card-wrapper {
    position: relative;
    z-index: 2;
  }

  .p5-time-card {
    background: #E60012;
    background-image: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 5px,
      rgba(0, 0, 0, 0.08) 5px,
      rgba(0, 0, 0, 0.08) 10px
    );
    border: 4px solid #000000;
    padding: 10px 24px 12px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    clip-path: polygon(0% 4%, 98% 0%, 100% 95%, 2% 100%);
    box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.2);
  }

  .p5-digits-group {
    display: flex;
    align-items: center;
    line-height: 0.9;
  }

  .p5-digit-hours, .p5-digit-minutes {
    font-family: 'P5Heavy', sans-serif !important;
    font-size: 92px;
    color: #ffffff;
    letter-spacing: -2px;
    text-shadow: 
      3px 3px 0 #000, -3px -3px 0 #000, 
      3px -3px 0 #000, -3px 3px 0 #000, 
      5px 5px 0 #000;
  }

  .p5-digit-colon {
    font-family: 'P5Heavy', sans-serif !important;
    font-size: 78px;
    color: #ffffff;
    margin: 0 4px;
    transform: translateY(-8px);
    text-shadow: 
      3px 3px 0 #000, -3px -3px 0 #000, 
      3px -3px 0 #000, -3px 3px 0 #000, 
      5px 5px 0 #000;
    transition: opacity 0.1s ease;
  }

  .p5-digit-colon.is-dim {
    opacity: 0.2;
  }

  .p5-side-column {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    margin-left: 4px;
  }

  .p5-ampm-badge {
    background: #000000;
    border: 2px solid #ffffff;
    box-shadow: 2px 2px 0px #000000;
    color: #ffffff;
    font-family: 'P5Expose', sans-serif !important;
    font-size: 15px;
    font-weight: 900;
    padding: 2px 6px;
    transform: skew(-8deg);
    letter-spacing: 1px;
    line-height: 1.1;
  }

  .p5-sec-badge {
    background: #ffffff;
    border: 2px solid #000000;
    box-shadow: 2px 2px 0px #000000;
    color: #E60012;
    font-family: 'P5Heavy', sans-serif !important;
    font-size: 16px;
    font-weight: 800;
    padding: 2px 6px;
    transform: skew(-8deg);
    line-height: 1.1;
  }

  /* Sub-ribbon ("TAKE YOUR TIME") */
  .p5-sub-ribbon {
    position: absolute;
    bottom: -12px;
    right: 20px;
    background: #111111;
    border: 2.5px solid #ffffff;
    box-shadow: 3px 3px 0px #000000;
    padding: 2px 10px;
    transform: skew(-10deg) rotate(1deg);
    display: flex;
    align-items: center;
    gap: 5px;
    z-index: 3;
  }

  .p5-sub-star {
    color: #E60012;
    font-size: 11px;
  }

  .p5-sub-text {
    font-family: 'P5Expose', sans-serif !important;
    font-size: 11px;
    color: #ffffff;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }
`;
