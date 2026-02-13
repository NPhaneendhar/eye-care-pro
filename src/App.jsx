import { useState, useEffect, useRef } from 'react'
import './App.css'

const snellenLetters = ['E', 'F', 'P', 'T', 'O', 'Z', 'L', 'D', 'C']
const snellenAcuityMap = [
  { level: 1, ratio: '20/200', size: 80 },
  { level: 2, ratio: '20/100', size: 60 },
  { level: 3, ratio: '20/70', size: 50 },
  { level: 4, ratio: '20/50', size: 40 },
  { level: 5, ratio: '20/40', size: 30 },
  { level: 6, ratio: '20/30', size: 25 },
  { level: 7, ratio: '20/25', size: 20 },
  { level: 8, ratio: '20/20', size: 16 },
  { level: 9, ratio: '20/15', size: 12 },
  { level: 10, ratio: '20/13', size: 10 },
  { level: 11, ratio: '20/10', size: 8 },
]

const ishiharaPlates = [
  { id: 1, number: '12', description: 'Sample Plate', difficulty: 'Beginner', bg: '#134e4a', fg: '#f97316' },
  { id: 2, number: '8', description: 'Red-Green Screen', difficulty: 'Standard', bg: '#064e3b', fg: '#ea580c' },
  { id: 3, number: '5', description: 'Protanopia Test', difficulty: 'Moderate', bg: '#1e3a8a', fg: '#f59e0b' },
  { id: 4, number: '29', description: 'Deuteranopia Test', difficulty: 'Advanced', bg: '#312e81', fg: '#fb923c' },
  { id: 5, number: '74', description: 'Total Blindness Check', difficulty: 'Hard', bg: '#4c1d95', fg: '#fdba74' },
]

// Enhanced Ishihara Dot Component
const IshiharaPlate = ({ number, bgColor, fgColor }) => {
  const dots = Array.from({ length: 400 }).map((_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    x: Math.random() * 90 + 5,
    y: Math.random() * 90 + 5,
    isDigit: Math.random() > 0.7 // Simulated digit mask
  }))

  return (
    <div className="clinical-plate" style={{ background: bgColor }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        {dots.map(dot => (
          <circle 
            key={dot.id} 
            cx={dot.x} cy={dot.y} r={dot.size/2} 
            fill={dot.isDigit ? fgColor : 'rgba(255,255,255,0.1)'} 
            opacity={Math.random() * 0.5 + 0.5}
          />
        ))}
        <text 
          x="50" y="65" textAnchor="middle" 
          fontSize="40" fontWeight="900" 
          fill={fgColor} style={{ opacity: 0.9, filter: 'blur(0.5px)' }}
        >
          {number}
        </text>
      </svg>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentSection, setCurrentSection] = useState('home')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [reminderInterval, setReminderInterval] = useState(20)
  const [nextReminderTime, setNextReminderTime] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [showBreakGuide, setShowBreakGuide] = useState(false)
  const [breakSteps, setBreakSteps] = useState({ blink: false, lookAway: false, hydrate: false })
  
  // Persistent State
  const [breaksTaken, setBreaksTaken] = useState(() => Number(localStorage.getItem('breaksTaken')) || 0)
  const [healthScore, setHealthScore] = useState(() => {
    const saved = localStorage.getItem('healthScore')
    return saved !== null ? Number(saved) : 100
  })
  const [activityLogs, setActivityLogs] = useState(() => JSON.parse(localStorage.getItem('activityLogs')) || [])
  const [sessionStartTime] = useState(Date.now())
  
  // Screening State
  const [screeningType, setScreeningType] = useState(null)
  const [snellenIndex, setSnellenIndex] = useState(0)
  const [currentSnellenLetter, setCurrentSnellenLetter] = useState('E')
  
  // Ishihara State
  const [ishiharaStep, setIshiharaStep] = useState(0)
  const [ishiharaScore, setIshiharaScore] = useState(0)
  const [ishiharaResult, setIshiharaResult] = useState(() => localStorage.getItem('ishiharaResult') || 'Neutral')

  // Astigmatism State
  const [astigmatismNotes, setAstigmatismNotes] = useState('')
  const [blurrySegments, setBlurrySegments] = useState([])

  // Contrast State
  const [contrastLevel, setContrastLevel] = useState(100)
  const [contrastStep, setContrastStep] = useState(0)
  const [contrastScore, setContrastScore] = useState(0)

  // Blink Tracker State
  const [blinkCount, setBlinkCount] = useState(0)
  const [isBlinkTracking, setIsBlinkTracking] = useState(false)
  const [blinkTimer, setBlinkTimer] = useState(0)
  const timerRef = useRef(null)

  // Core Sync & Score Calc
  useEffect(() => {
    localStorage.setItem('breaksTaken', breaksTaken.toString())
    localStorage.setItem('ishiharaResult', ishiharaResult)
    localStorage.setItem('activityLogs', JSON.stringify(activityLogs))
    localStorage.setItem('healthScore', healthScore.toString())
  }, [breaksTaken, ishiharaResult, activityLogs, healthScore])

  // Reminder Countdown Logic
  useEffect(() => {
    let timer;
    if (nextReminderTime) {
      timer = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((nextReminderTime - Date.now()) / 1000))
        setCountdown(remaining)
        if (remaining === 0) {
          triggerReminder()
        }
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [nextReminderTime])

  const triggerReminder = () => {
    setNextReminderTime(null)
    setCountdown(0)
    setShowBreakGuide(true)
    if (Notification.permission === 'granted') {
      new Notification('👁️ EyeCare Pro: Break Time!', { 
        body: '20s Protocol Required: Blink, Look Away, Relax.', 
        icon: '/eye-icon.svg',
        tag: 'eye-break'
      })
    }
  }

  const startReminders = (mins = reminderInterval) => {
    const nextTime = Date.now() + mins * 60 * 1000
    setNextReminderTime(nextTime)
    setCountdown(mins * 60)
    localStorage.setItem('reminderInterval', mins.toString())
  }

  const stopReminders = () => {
    setNextReminderTime(null)
    setCountdown(0)
  }

  // Health Decay Logic
  useEffect(() => {
    const decayInterval = setInterval(() => {
      setHealthScore(prev => Math.max(0, prev - 2))
    }, 60000) // 2% decay every minute

    return () => clearInterval(decayInterval)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      setCurrentSection('content')
    }
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); setDeferredPrompt(e); })
    if ('Notification' in window && Notification.permission === 'granted') setNotificationsEnabled(true)
  }, [])

  const addLog = (type, value) => {
    const newLog = { 
      id: Date.now(), 
      type, 
      value, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString()
    }
    setActivityLogs(prev => [newLog, ...prev].slice(0, 10))
  }

  const resetAllData = () => {
    if (window.confirm('CRITICAL: Reset all medical history and scores?')) {
      localStorage.clear()
      setBreaksTaken(0)
      setHealthScore(0)
      setActivityLogs([])
      setIshiharaResult('Neutral')
      setIshiharaScore(0)
      setIshiharaStep(0)
      setSnellenIndex(0)
      setContrastScore(0)
      setContrastStep(0)
      alert('System Sanitized. Baseline 0% restored.')
    }
  }

  const trackBreak = () => {
    setBreaksTaken(prev => prev + 1)
    setHealthScore(prev => Math.min(100, prev + 5))
    addLog('Rest Break', '+5% Health')
    if (Notification.permission === 'granted') {
       new Notification('EyeCare Pro', { body: 'Break tracked! System optimized.', icon: '/icons/icon-192.png' })
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setCurrentSection('content')
  }

  const enableNotifications = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
      startReminders()
    }
  }

  const startRemindersLegacy = () => {
    startReminders(reminderInterval)
  }

  // Snellen Logic
  const randomizeSnellen = () => {
    setCurrentSnellenLetter(snellenLetters[Math.floor(Math.random() * snellenLetters.length)])
  }
  const nextSnellenLevel = () => {
    if (snellenIndex < snellenAcuityMap.length - 1) {
      setSnellenIndex(prev => prev + 1)
      randomizeSnellen()
    } else {
      addLog('Acuity Check', `Score: ${snellenAcuityMap[snellenIndex].ratio}`)
      alert('Test Complete!')
    }
  }

  // Ishihara Logic
  const handleIshiharaAnswer = (isCorrect) => {
    const newScore = isCorrect ? ishiharaScore + 1 : ishiharaScore
    setIshiharaScore(newScore)
    if (ishiharaStep < ishiharaPlates.length - 1) {
      setIshiharaStep(prev => prev + 1)
    } else {
      const pct = Math.round((newScore / ishiharaPlates.length) * 100)
      const res = pct > 90 ? 'Healthy' : pct > 60 ? 'Suspect' : 'At Risk'
      setIshiharaResult(`${res} (${pct}%)`)
      addLog('Color Vision', `${res} (${pct}%)`)
      setScreeningType(null)
      alert(`Diagnostic Complete: ${res}`)
    }
  }

  // Astigmatism Logic
  const toggleSegment = (i) => {
    setBlurrySegments(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  const recordAstigmatismResult = () => {
    if (blurrySegments.length === 0) {
      alert('Please select the blurry or darker segments first.')
      return
    }
    const angles = blurrySegments.map(s => s * 15).join('°, ')
    addLog('Astigmatism', `Meridians: ${angles}°`)
    setScreeningType(null)
    setBlurrySegments([])
    alert(`Observations Recorded. Detected Meridians: ${angles}°`)
  }

  // Contrast Logic
  const handleContrastAnswer = (isCorrect) => {
    const newScore = isCorrect ? contrastScore + 1 : contrastScore
    setContrastScore(newScore)
    if (contrastStep < 5) {
      setContrastStep(prev => prev + 1)
      setContrastLevel(prev => Math.max(1, prev - 20))
    } else {
      const pct = Math.round((newScore / 6) * 100)
      addLog('Contrast Test', `${pct}% Sensitivity`)
      setScreeningType(null)
      alert(`Contrast Diagnostic: ${pct}% Sensitivity`)
      setContrastStep(0)
      setContrastLevel(100)
    }
  }

  // Blink Logic
  const startBlinkTracker = () => {
    setIsBlinkTracking(true); setBlinkCount(0); setBlinkTimer(60)
    timerRef.current = setInterval(() => {
      setBlinkTimer(p => {
        if (p <= 1) { 
          clearInterval(timerRef.current); 
          setIsBlinkTracking(false); 
          addLog('Blink Rate', `${blinkCount} bpm`);
          return 0; 
        }
        return p - 1
      })
    }, 1000)
  }

  if (currentSection === 'home' && !isInstalled) {
    return (
      <div className="landing-page">
        <div className="hero-section">
          <div className="eye-icon">👁️</div>
          <h1 className="premium-glow-text">EyeCare Pro</h1>
          <p className="description">Advanced Clinical Dashboard for Mobile</p>
          <button className="install-btn glass-btn" onClick={() => {
            if (deferredPrompt) handleInstall()
            else setCurrentSection('content')
          }}>
            {deferredPrompt ? '📲 Install Application' : '🚀 Authenticate Dashboard'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app premium-theme">
      <header className="app-header glass">
        <div className="logo-group">
          <div className="mini-logo">
            <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 256C100 256 160 140 256 140C352 140 412 256 412 256C412 256 352 372 256 372C160 372 100 256 100 256Z" stroke="#6366f1" strokeWidth="20"/>
              <circle cx="256" cy="256" r="60" fill="#6366f1"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>EyeCare Pro</h1>
            <span className="version-pill">v2.1-Clinical</span>
          </div>
        </div>
        <div className="header-stats">
          {countdown > 0 && (
            <div className="header-timer">
              <span className="time">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span>
              <span className="lab">NEXT REST</span>
            </div>
          )}
          <div className="mini-score">
            <span className="val">{healthScore}%</span>
            <span className="lab">INTEGRITY</span>
          </div>
        </div>
      </header>

      {deferredPrompt && (
        <div className="install-banner glass-card animate-slide-down">
          <div className="banner-content">
            <span className="icon">📲</span>
            <div className="text">
              <h3>Install Desktop Dashboard</h3>
              <p>Experience EyeCare Pro as a native application.</p>
            </div>
          </div>
          <button className="install-action-btn" onClick={handleInstall}>DOWNLOAD APP</button>
        </div>
      )}

      {showBreakGuide && (
        <div className="break-overlay glass-heavy animate-fade-in">
          <div className="break-card glass-card">
            <div className="break-header">
              <h2>Protocol Required: 20s Break</h2>
              <p>Execute mandatory ocular rest for system recovery.</p>
            </div>
            <div className="check-list">
              <label className={`check-item ${breakSteps.blink ? 'done' : ''}`}>
                <input type="checkbox" checked={breakSteps.blink} onChange={(e) => setBreakSteps(s => ({...s, blink: e.target.checked}))} />
                <span>Blink Squeeze (2s)</span>
              </label>
              <label className={`check-item ${breakSteps.lookAway ? 'done' : ''}`}>
                <input type="checkbox" checked={breakSteps.lookAway} onChange={(e) => setBreakSteps(s => ({...s, lookAway: e.target.checked}))} />
                <span>Focus 20ft Away</span>
              </label>
              <label className={`check-item ${breakSteps.hydrate ? 'done' : ''}`}>
                <input type="checkbox" checked={breakSteps.hydrate} onChange={(e) => setBreakSteps(s => ({...s, hydrate: e.target.checked}))} />
                <span>System Hydration</span>
              </label>
            </div>
            {breakSteps.blink && breakSteps.lookAway && breakSteps.hydrate && (
              <button className="complete-break-btn glow-btn" onClick={() => {
                setShowBreakGuide(false)
                setBreakSteps({ blink: false, lookAway: false, hydrate: false })
                trackBreak()
                startReminders()
              }}>SYSTEM RESTORED</button>
            )}
          </div>
        </div>
      )}

      <div className="scroll-container">
        {activeTab === 'dashboard' && (
          <div className="dashboard-grid">
            <div className="card glass hero-card">
              <div className="card-header">
                <span className="card-tag">SYSTEM STATUS</span>
                <button className="reset-action-btn" onClick={resetAllData}>Sanitize System</button>
              </div>
              <div className="health-gauge">
                <div className={`gauge-fill ${healthScore < 20 ? 'critical' : ''}`} style={{ width: `${healthScore}%` }}></div>
                <div className="gauge-label">
                  <span className="pct">{healthScore}%</span>
                  <span className="desc">Optical Integrity</span>
                </div>
              </div>
              <div className="stat-row">
                <div className="stat"><span>Breaks</span><strong>{breaksTaken}</strong></div>
                <div className="stat"><span>Session Time</span><strong>{Math.floor((Date.now() - sessionStartTime) / 60000)}m</strong></div>
              </div>
            </div>

            <div className="card glass">
              <div className="card-title">🛡️ Rapid Optimization</div>
              <button className="btn-primary glow-btn" onClick={trackBreak}>Execute Rest Break</button>
              <p className="card-hint">Instantly restores 12% optical integrity</p>
            </div>

            <div className="card glass">
              <div className="card-title">📜 System Logs (Recent 10)</div>
              <div className="log-list">
                {activityLogs.length === 0 ? (
                  <p className="no-logs">No encrypted records found.</p>
                ) : activityLogs.map(log => (
                  <div key={log.id} className="log-item">
                    <span className="log-time">{log.time}</span>
                    <span className="log-type">{log.type}</span>
                    <span className="log-val">{log.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass">
              <div className="card-title">⏱️ Blink Stress Lab</div>
              {isBlinkTracking ? (
                <div onClick={() => setBlinkCount(c => c + 1)} className="blink-target active">
                  <div className="timer">{blinkTimer}s</div>
                  <div className="count">{blinkCount}</div>
                  <span className="tap-hint">TAP ON BLINK</span>
                </div>
              ) : (
                <button className="btn-secondary" onClick={startBlinkTracker}>Begin 60s Diagnostic</button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="content-area">
            <div className="card glass info-card">
              <div className="card-title">🔬 Clinical Matter: Ergonomics</div>
              <div className="info-section">
                <h4>1. The 20-20-20 Advanced Protocol</h4>
                <p>Every 20 minutes, focus on an object at least 20 feet away for 20 seconds. <strong>Why?</strong> This relaxes the ciliary muscles in the eyes, which are constantly contracted during near-work like reading or coding.</p>
              </div>
              <div className="info-section">
                <h4>2. Ocular Geometry</h4>
                <p>Position your screen 15-20 degrees below eye level. This naturally lowers your eyelids, reducing the exposed surface area of the cornea and slowing down tear evaporation by up to 40%.</p>
              </div>
            </div>
            
            <div className="card glass">
              <div className="card-title">🧬 Photopic Stress & Blue Light</div>
              <div className="info-section">
                <p>High-energy visible (HEV) light, especially in the 415-455nm range, can cause oxidative stress in the retinal pigment epithelium.</p>
                <ul className="premium-list">
                  <li><strong>OLED Dark Mode</strong>: Eliminates backlight flicker and reduces total HEV output.</li>
                  <li><strong>Night Shift</strong>: Shift your color temperature to &lt; 3000K after sunset to protect melatonin production.</li>
                  <li><strong>Ambient Lighting</strong>: Ensure room lighting is equal to screen brightness to prevent "contrast fatigue".</li>
                </ul>
              </div>
            </div>

            <div className="card glass">
              <div className="card-title">💧 Ocular Surface Hygiene</div>
              <div className="info-section">
                <p>Digital Eye Strain is often actually <strong>Evaporative Dry Eye</strong>. Follow these protocols:</p>
                <ul className="premium-list">
                  <li><strong>Blink Squeeze</strong>: Every hour, close your eyes firmly for 2 seconds to engage Meibomian glands.</li>
                  <li><strong>Hydration</strong>: Systemic hydration directly impacts the volume of the aqueous layer in your tear film.</li>
                  <li><span>🛡️</span><strong>Pro Tip</strong>: Use a humidifier in your workspace to keep the air &gt; 45% moisture.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'screening' && (
          <div className="screening-container">
            {!screeningType ? (
              <div className="lab-selector">
                <h2>Vision Screening Labs</h2>
                <div className="lab-grid">
                  <button className="lab-btn" onClick={() => setScreeningType('snellen')}>
                    <span className="icon">📐</span>
                    <span className="label">Acuity Lab</span>
                  </button>
                  <button className="lab-btn" onClick={() => { setScreeningType('ishihara'); setIshiharaStep(0); setIshiharaScore(0); }}>
                    <span className="icon">🌈</span>
                    <span className="label">Color Matrix</span>
                  </button>
                  <button className="lab-btn" onClick={() => setScreeningType('astigmatism')}>
                    <span className="icon">🕒</span>
                    <span className="label">Astigmatism</span>
                  </button>
                  <button className="lab-btn" onClick={() => { setScreeningType('contrast'); setContrastStep(0); setContrastScore(0); setContrastLevel(100); }}>
                    <span className="icon">🌓</span>
                    <span className="label">Contrast Lab</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="card glass screening-box">
                <button className="exit-btn" onClick={() => setScreeningType(null)}>← TERMINATE SESSION</button>
                
                {screeningType === 'snellen' && (
                  <div className="lab-panel">
                    <h3>Visual Acuity / Snellen</h3>
                    <div className="acuity-badge">{snellenAcuityMap[snellenIndex].ratio}</div>
                    <div className="snellen-viewport">
                      <div className="letter" style={{ fontSize: `${snellenAcuityMap[snellenIndex].size * 4}px` }}>
                        {currentSnellenLetter}
                      </div>
                    </div>
                    <div className="control-group">
                      <button className="glass-btn btn-sm" onClick={() => setSnellenIndex(p => Math.max(0, p - 1))}>Larger</button>
                      <button className="glass-btn btn-lg" onClick={nextSnellenLevel}>Readable / Next</button>
                    </div>
                  </div>
                )}
                
                {screeningType === 'ishihara' && (
                  <div className="lab-panel">
                    <div className="panel-header">
                      <h3>Clinical Plate {ishiharaStep + 1}/5</h3>
                      <span className="diff">{ishiharaPlates[ishiharaStep].difficulty}</span>
                    </div>
                    <IshiharaPlate 
                      number={ishiharaPlates[ishiharaStep].number} 
                      bgColor={ishiharaPlates[ishiharaStep].bg} 
                      fgColor={ishiharaPlates[ishiharaStep].fg}
                    />
                    <div style={{marginTop: '20px'}}>
                      <p className="hint">Identify the numeric pattern above.</p>
                      <div className="decision-group">
                        <button className="btn-pass" onClick={() => handleIshiharaAnswer(true)}>IDENTIFIED</button>
                        <button className="btn-fail" onClick={() => handleIshiharaAnswer(false)}>UNABLE</button>
                      </div>
                    </div>
                  </div>
                )}

                {screeningType === 'astigmatism' && (
                  <div className="lab-panel text-center">
                    <h3>Astigmatism Precision Chart</h3>
                    <div className="interactive-wheel">
                      {[...Array(24)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`segment-line ${blurrySegments.includes(i) ? 'blurry' : ''}`} 
                          style={{ transform: `translate(-50%, -50%) rotate(${i * 15}deg)` }}
                          onClick={() => toggleSegment(i)}
                        ></div>
                      ))}
                      <div className="center-point"></div>
                    </div>
                    <p className="hint mt-2">Tap segments that appear <strong>darker</strong> or <strong>blurry</strong>.</p>
                    {blurrySegments.length > 0 && (
                      <div className="report-flow">
                        <div className="feedback-pill">Axis Detected: {blurrySegments.map(s => s * 15).join('°, ')}°</div>
                        <button className="btn-primary glow-btn btn-full" style={{marginTop: '20px'}} onClick={recordAstigmatismResult}>GENERATE CLINICAL RECORD</button>
                      </div>
                    )}
                  </div>
                )}

                {screeningType === 'contrast' && (
                  <div className="lab-panel">
                    <div className="panel-header">
                      <h3>Contrast Sensitivity {contrastStep + 1}/6</h3>
                      <span className="diff">Level: {contrastLevel}%</span>
                    </div>
                    <div className="contrast-viewport">
                      <div className="letter" style={{ opacity: contrastLevel / 100 }}>
                        {snellenLetters[Math.floor(Math.random() * snellenLetters.length)]}
                      </div>
                    </div>
                    <div style={{marginTop: '20px'}}>
                      <p className="hint">Identify the character above.</p>
                      <div className="decision-group">
                        <button className="btn-pass" onClick={() => handleContrastAnswer(true)}>VISIBLE</button>
                        <button className="btn-fail" onClick={() => handleContrastAnswer(false)}>INVISIBLE</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="reminders-container">
            <div className="card glass hero-card">
              <div className="card-title">🔔 Logicreminders Protocol</div>
              <div className="settings-panel">
                <p className="description">Integrated automated ocular rest signals.</p>
                
                {!notificationsEnabled ? (
                  <button className="glow-btn btn-full large-action" onClick={enableNotifications}>INITIALIZE PROTOCOL</button>
                ) : (
                  <div className="protocol-controls">
                    <div className={`status-badge ${nextReminderTime ? 'active' : 'idle'}`}>
                      {nextReminderTime ? 'PROTOCOL EXECUTING' : 'PROTOCOL STANDBY'}
                    </div>

                    <div className="interval-selector">
                      <label>REST INTERVAL</label>
                      <div className="interval-grid">
                        {[1, 5, 20, 40, 60].map(mins => (
                          <button 
                            key={mins} 
                            className={`interval-btn ${reminderInterval === mins ? 'selected' : ''}`}
                            onClick={() => { setReminderInterval(mins); startReminders(mins); }}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </div>

                    {countdown > 0 ? (
                      <div className="live-countdown-card glass-inner">
                        <div className="timer-display">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</div>
                        <p>SEC UNTIL MANDATORY BREAK</p>
                        <button className="btn-secondary btn-sm" onClick={stopReminders}>ABORT PROTOCOL</button>
                      </div>
                    ) : (
                      <button className="btn-primary glow-btn btn-full" onClick={() => startReminders(reminderInterval)}>ENGAGE PROTOCOL</button>
                    )}

                    <div className="demo-section">
                      <p className="hint">Rapid Validation Mode</p>
                      <button className="glass-btn btn-xs" onClick={() => { setReminderInterval(1); startReminders(1); }}>Test 60s Cycle</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card glass">
              <div className="card-title">📖 Protocol Reference</div>
              <div className="protocol-steps">
                <div className="p-step">
                  <span className="step-num">1</span>
                  <div className="step-text">
                    <strong>Signal Detection</strong>
                    <p>When the notification triggers, immediately cease screen activity.</p>
                  </div>
                </div>
                <div className="p-step">
                  <span className="step-num">2</span>
                  <div className="step-text">
                    <strong>20-20-20 Execution</strong>
                    <p>Focus on an object 20ft away for a minimum of 20 seconds.</p>
                  </div>
                </div>
                <div className="p-step">
                  <span className="step-num">3</span>
                  <div className="step-text">
                    <strong>Checklist Verification</strong>
                    <p>Complete the on-screen recovery checklist to resume.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'developer' && (
          <div className="developer-container">
            <div className="card glass developer-card">
              <div className="dev-header">
                <div className="dev-avatar">
                   <span>GN</span>
                </div>
                <div className="dev-title-group">
                  <h2 className="premium-glow-text">Goteti Naga Sai Santhosh</h2>
                  <span className="dev-role">System Architect & Lead Developer</span>
                </div>
              </div>
              
              <div className="dev-content">
                <div className="info-item">
                  <span className="label">CREDENTIALS</span>
                  <span className="value">B.Sc. Optometry</span>
                </div>
                <div className="info-item">
                   <span className="label">AFFILIATION</span>
                   <span className="value">Centurion University of Management and Technology</span>
                </div>
              </div>
            </div>

            <div className="card glass">
               <div className="card-title">👨‍⚕️ Professional Overview</div>
               <p className="description" style={{marginBottom: 0}}>Passionate Optometry professional dedicated to digital health innovation and clinical diagnostics.</p>
            </div>
          </div>
        )}
      </div>

      <nav className="bottom-nav glass">
        <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>📊<span>Health</span></button>
        <button className={`nav-item ${activeTab === 'content' ? 'active' : ''}`} onClick={() => setActiveTab('content')}>🔬<span>Library</span></button>
        <button className={`nav-item ${activeTab === 'screening' ? 'active' : ''}`} onClick={() => setActiveTab('screening')}>🧪<span>Labs</span></button>
        <button className={`nav-item ${activeTab === 'reminders' ? 'active' : ''}`} onClick={() => setActiveTab('reminders')}>🔔<span>Alerts</span></button>
        <button className={`nav-item ${activeTab === 'developer' ? 'active' : ''}`} onClick={() => setActiveTab('developer')}>👨‍💻<span>Author</span></button>
      </nav>
    </div>
  )
}

export default App
