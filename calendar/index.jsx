import { run } from 'uebersicht';

export const refreshFrequency = 5000;

export const handleCalendarThemeToggle = () => {
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

export const command = `
THEME=$(cat /tmp/vinyl_theme.txt 2>/dev/null || echo "realistic")
CACHE="/tmp/mac_cal_cache_apple_style.txt"

if [ ! -f "$CACHE" ] || [ $(expr $(date +%s) - $(stat -f "%m" "$CACHE" 2>/dev/null || echo 0)) -gt 300 ]; then
  osascript -e '
    set now to (current date)
    set endRange to now + (7 * days)
    set eventList to {}
    tell application "Calendar"
      repeat with c in calendars
        try
          set evts to (every event of c whose (start date >= (now - 1 * days)) and (start date < endRange) and (allday event is false))
          repeat with ev in evts
            set evName to summary of ev
            set sTime to start date of ev
            set eTime to end date of ev
            
            set sY to year of sTime
            set sM to (month of sTime as integer)
            set sD to day of sTime
            set sH to hours of sTime
            set sMin to minutes of sTime
            
            set eY to year of eTime
            set eM to (month of eTime as integer)
            set eD to day of eTime
            set eH to hours of eTime
            set eMin to minutes of eTime
            
            set end of eventList to evName & "::" & sY & "/" & sM & "/" & sD & " " & sH & ":" & sMin & "::" & eY & "/" & eM & "/" & eD & " " & eH & ":" & eMin
          end repeat
        end try
      end repeat
    end tell
    set text item delimiters to "||"
    return (eventList as text)
  ' > "$CACHE"
fi

DATA=$(cat "$CACHE" 2>/dev/null)
echo "$THEME^^$DATA"
`;

export const updateState = (event, previousState) => {
  if (event.error) return { theme: 'realistic', rawEvents: '' };
  
  const parts = event.output.trim().split('^^');
  const theme = parts[0] || 'realistic';
  const rawEvents = parts[1] || '';
  
  return { theme, rawEvents };
};

const formatTime = (dateObj) => {
  let h = dateObj.getHours();
  let m = dateObj.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  m = m < 10 ? '0' + m : m;
  return `${h}:${m} ${ampm}`;
};

export const render = ({ theme, rawEvents }) => {
  const now = new Date();
  
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dayNumber = now.getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();

  let parsedEvents = [];
  if (rawEvents && rawEvents !== "") {
    const rawArray = rawEvents.split('||');
    parsedEvents = rawArray.map(ev => {
      const [name, startStr, endStr] = ev.split('::');
      const startObj = new Date(startStr);
      const endObj = new Date(endStr);
      return { name, startObj, endObj };
    });
    
    parsedEvents = parsedEvents.filter(e => e.endObj > now);
    parsedEvents.sort((a, b) => a.startObj - b.startObj);
  }

  const displayEvents = parsedEvents.slice(0, 3);

  return (
    <div className={`widget-wrapper ${theme}`}>
      <div className="calendar-box" onClick={handleCalendarThemeToggle} title="Click header to cycle theme">
        <div className="cal-header">
          <div className="day-name">{dayName}</div>
          <div className="day-number">{dayNumber}</div>
          <div className="paper-month">{monthName}</div>
        </div>
        
        <div className="events-list">
          {displayEvents.length === 0 ? (
            <div className="no-events">No upcoming events</div>
          ) : (
            displayEvents.map((e, index) => {
              const isNow = e.startObj <= now && e.endObj > now;
              const timeString = `${formatTime(e.startObj)} - ${formatTime(e.endObj)}`;
              
              return (
                <div key={index} className={`event-item ${isNow ? 'is-now' : ''}`}>
                  <div className="event-indicator"></div>
                  <div className="event-details">
                    <div className="event-title">{e.name}</div>
                    <div className="event-time">{timeString}</div>
                  </div>
                </div>
              );
            })
          )}
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

  top: 40px;
  left: 40px;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  
  /* --- REALISTIC THEME --- */
  .calendar-box {
    background-color: #1c1c1e;
    border-radius: 20px;
    padding: 16px 20px 20px 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 260px;
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: all 0.4s ease-in-out;
  }
  .cal-header { display: flex; flex-direction: column; position: relative; }
  .day-name { color: #ff453a; font-size: 13px; font-weight: 700; letter-spacing: 1px; }
  .day-number { color: #ffffff; font-size: 38px; font-weight: 400; line-height: 1.1; margin-top: -2px; }
  .paper-month { display: none; }

  .events-list { display: flex; flex-direction: column; gap: 14px; }
  .event-item { display: flex; gap: 10px; align-items: stretch; }
  .event-indicator { width: 3px; background-color: rgba(255, 255, 255, 0.3); border-radius: 4px; flex-shrink: 0; }
  .event-item.is-now .event-indicator { background-color: #ff453a; }
  .event-details { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
  .event-title { color: #ffffff; font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .event-time { color: rgba(255, 255, 255, 0.5); font-size: 13px; font-weight: 500; }
  .event-item.is-now .event-time { color: rgba(255, 255, 255, 0.8); }
  .no-events { color: rgba(255, 255, 255, 0.4); font-size: 14px; font-weight: 500; padding-top: 8px; }

  /* --- REALISTIC-CLEAN THEME --- */
  .realistic-clean .calendar-box { background-color: #f2f2f7; border: 1px solid rgba(0, 0, 0, 0.08); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1); }
  .realistic-clean .day-name { color: #ff3b30; }
  .realistic-clean .day-number { color: #000000; }
  .realistic-clean .event-indicator { background-color: rgba(0, 0, 0, 0.2); }
  .realistic-clean .event-item.is-now .event-indicator { background-color: #ff3b30; }
  .realistic-clean .event-title { color: #1c1c1e; }
  .realistic-clean .event-time { color: #8e8e93; }
  .realistic-clean .event-item.is-now .event-time { color: #3a3a3c; }

  /* --- ACRYLIC THEME --- */
  .acrylic .calendar-box { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); }
  .acrylic .day-name { color: rgba(255, 255, 255, 0.9); text-shadow: 0 0 10px rgba(255,255,255,0.4); }
  .acrylic .day-number { text-shadow: 0 0 15px rgba(255,255,255,0.5); }
  .acrylic .event-indicator { background-color: rgba(255, 255, 255, 0.2); }
  .acrylic .event-item.is-now .event-indicator { background-color: rgba(255, 255, 255, 0.9); box-shadow: 0 0 8px rgba(255,255,255,0.6); }
  .acrylic .event-time { color: rgba(255, 255, 255, 0.6); }

  /* --- PERSONA 5 THEME --- */
  .persona .calendar-box { border: 4px solid #000; border-radius: 0; box-shadow: 6px 6px 0px #E60012; transform: rotate(2deg); background-color: #121212; }
  .persona .day-name { color: #E60012; font-family: 'P5Font', sans-serif !important; font-size: 16px; transform: skew(-5deg); }
  .persona .day-number { color: #f5f5f7; font-family: 'P5Font', sans-serif !important; font-size: 44px; text-shadow: 2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000; transform: skew(-6deg); line-height: 0.9; }
  .persona .event-indicator { background-color: #3a3a3c; width: 4px; border-radius: 0; transform: skew(-10deg); }
  .persona .event-item.is-now .event-indicator { background-color: #E60012; }
  .persona .event-title, .persona .event-time, .persona .day-name, .persona .day-number { font-family: 'P5Font', sans-serif !important; }
  .persona .event-title { color: #f5f5f7; font-size: 18px; transform: skew(-5deg); }
  .persona .event-item.is-now .event-title { color: #E60012; }
  .persona .event-time { color: rgba(245, 245, 247, 0.6); font-size: 14px; transform: skew(-5deg); }
  .persona .no-events { color: #f5f5f7; font-family: 'P5Font', sans-serif !important; font-size: 16px; transform: skew(-5deg); }

  /* --- PAPER CALENDAR THEME (4th Design) --- */
  .turntable .calendar-box {
    background-color: #f7f4eb; /* Warm cream paper tone */
    border-radius: 2px;
    border: 1px solid #d1ccc0;
    box-shadow: 8px 12px 30px rgba(0,0,0,0.5);
    color: #111;
  }
  .turntable .calendar-box::before {
    content: '';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 14px;
    background: linear-gradient(to bottom, #8e8e93, #3a3a3c);
    border-radius: 4px;
    box-shadow: 0 3px 6px rgba(0,0,0,0.4);
  }
  .turntable .cal-header {
    background-color: #d9381e; /* Vintage red weekend header strip */
    margin: -16px -20px 14px -20px;
    padding: 12px 20px;
    border-radius: 2px 2px 0 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: baseline;
  }
  .turntable .day-name { color: #fff; font-size: 12px; font-weight: 800; letter-spacing: 2px; }
  .turntable .paper-month { color: rgba(255,255,255,0.8); font-size: 12px; font-weight: 700; letter-spacing: 1px; display: block; }
  .turntable .day-number { color: #111; font-size: 32px; font-weight: 900; margin-top: 4px; }
  .turntable .event-indicator { background-color: #d9381e; width: 3px; }
  .turntable .event-item.is-now .event-indicator { background-color: #111; }
  .turntable .event-title { color: #111; font-weight: 700; }
  .turntable .event-time { color: #636366; }
  .turntable .no-events { color: #8e8e93; }
`;
