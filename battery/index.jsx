import { run } from 'uebersicht';

export const refreshFrequency = 10000;

export const command = `
THEME=$(cat /tmp/desktop_theme.txt 2>/dev/null || echo "realistic")
BATT=$(pmset -g batt | grep -Eo "\\d+%" | cut -d% -f1)
STATE=$(pmset -g batt | grep -o 'AC Power')
echo "$THEME|$BATT|$STATE"
`;

export const updateState = (event) => {
  const parts = event.output ? event.output.trim().split('|') : [];
  return { theme: parts[0] || 'realistic', pct: parts[1] || '100', isCharging: !!parts[2] };
};

export const render = ({ theme, pct, isCharging }) => (
  <div className={`widget-wrapper ${theme}`}>
    <div className="batt-container">
      <div className="batt-label">{isCharging ? 'CHARGING' : 'BATTERY'}</div>
      <div className="batt-val">{pct}%</div>
      <div className="batt-bar"><div className="batt-fill" style={{ width: `${pct}%` }}></div></div>
    </div>
  </div>
);

export const className = `
  @font-face { font-family: 'P5Menu'; src: url('vinyl-player.widget/Persona5MenuFontPrototype-Regular.ttf') format('truetype'); }
  @font-face { font-family: 'P5Expose'; src: url('vinyl-player.widget/Expose-Regular.otf') format('opentype'); }
  @font-face { font-family: 'P5Heavy'; src: url('vinyl-player.widget/HEAVYHEA.TTF') format('truetype'); }

  top: 40px; left: 350px; user-select: none; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  
  .batt-container { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; width: 120px; transition: all 0.3s; }
  .batt-label { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; }
  .batt-val { font-size: 24px; font-weight: 800; }
  .batt-bar { width: 100%; height: 6px; border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .batt-fill { height: 100%; transition: width 1s; }

  /* REALISTIC */
  .realistic .batt-container { background: #1c1c1e; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
  .realistic .batt-label { color: rgba(255,255,255,0.4); } .realistic .batt-val { color: #fff; }
  .realistic .batt-bar { background: rgba(255,255,255,0.1); } .realistic .batt-fill { background: #34c759; }

  /* BASIC */
  .basic .batt-container { background: #f2f2f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
  .basic .batt-label { color: #888; } .basic .batt-val { color: #111; }
  .basic .batt-bar { background: rgba(0,0,0,0.1); } .basic .batt-fill { background: #34c759; }

  /* ACRYLIC */
  .acrylic .batt-container { background: rgba(255,255,255,0.05); backdrop-filter: blur(15px); border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
  .acrylic .batt-label, .acrylic .batt-val { color: #fff; }
  .acrylic .batt-bar { background: rgba(255,255,255,0.2); } .acrylic .batt-fill { background: #fff; box-shadow: 0 0 10px rgba(255,255,255,0.8); }

  /* PERSONA 5 */
  .persona .batt-container { background: #fff; border: 4px solid #000; box-shadow: 4px 4px 0px #E60012; transform: skew(-5deg); border-radius: 0; }
  .persona .batt-label { font-family: 'P5Expose', sans-serif !important; color: #000; font-size: 14px; transform: skew(-5deg); }
  .persona .batt-val { font-family: 'P5Heavy', sans-serif !important; color: #E60012; font-size: 36px; text-shadow: 2px 2px 0px #000; transform: skew(-5deg); line-height: 1; }
  .persona .batt-bar { background: #121212; border: 2px solid #000; border-radius: 0; height: 10px; }
  .persona .batt-fill { background: #E60012; }
`;
