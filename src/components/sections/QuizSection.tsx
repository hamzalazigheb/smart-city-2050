import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { gsap } from 'gsap';
import {
  ref, push, set, onValue, onDisconnect, remove,
  type DatabaseReference,
} from 'firebase/database';
import { db } from '../../lib/firebase';
import { quizQuestions, scoreMessages, type QuizQuestion } from '../../data/quiz';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// ─── Sage palette ─────────────────────────────────────────────────────────────
const SAGE  = '#8fbb91';
const SAGE2 = '#b5d6b7';
const BG    = 'rgba(13,26,15,0.78)';
const BORDER = 'rgba(143,187,145,0.18)';

// ─── Firebase room path ───────────────────────────────────────────────────────
const ROOM = 'rooms/current';
const MIN_PLAYERS = 6;          // auto-start threshold

// ─── Types ───────────────────────────────────────────────────────────────────
interface Player {
  id:       string;
  name:     string;
  joinedAt: number;
}

type RoomStatus = 'waiting' | 'playing' | 'finished';

// ─── Hook: watch Firebase room ────────────────────────────────────────────────
function useFirebaseRoom() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [status,  setStatus]  = useState<RoomStatus>('waiting');

  useEffect(() => {
    const playersRef = ref(db, `${ROOM}/players`);
    const statusRef  = ref(db, `${ROOM}/status`);

    const unsubPlayers = onValue(playersRef, snap => {
      const val = snap.val() as Record<string, Omit<Player, 'id'>> | null;
      setPlayers(
        val
          ? Object.entries(val).map(([id, p]) => ({ id, ...p })).sort((a, b) => a.joinedAt - b.joinedAt)
          : [],
      );
    });

    const unsubStatus = onValue(statusRef, snap => {
      setStatus((snap.val() as RoomStatus) ?? 'waiting');
    });

    return () => { unsubPlayers(); unsubStatus(); };
  }, []);

  return { players, status };
}

// ─── Host controls ────────────────────────────────────────────────────────────
async function hostStartQuiz() {
  await set(ref(db, `${ROOM}/status`), 'playing');
}

async function hostResetRoom() {
  await set(ref(db, ROOM), { status: 'waiting' });
}

// ─── Join screen (phone) ─────────────────────────────────────────────────────
function JoinScreen({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(id);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (t) onJoin(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg,#132016 0%,#0d1a0f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(143,187,145,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(143,187,145,.03) 1px,transparent 1px)`, backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8 text-center">
        <div className="text-6xl">🏙️</div>
        <div>
          <p className="font-display font-black text-xs tracking-widest mb-2" style={{ color: 'rgba(143,187,145,.6)', letterSpacing: '.3em' }}>SMART CITY 2050</p>
          <h1 className="font-display font-black mb-3" style={{ fontSize: 'clamp(1.8rem,8vw,2.6rem)', color: '#fff', lineHeight: 1.1 }}>
            City <span style={{ color: SAGE }}>Quiz</span>
          </h1>
          <p className="text-sm" style={{ color: 'rgba(220,240,220,.55)', lineHeight: 1.6 }}>
            Rejoins le lobby et attends que le quiz commence !<br/>
            <span style={{ color: 'rgba(220,240,220,.35)' }}>8 questions · niveau B2–C1</span>
          </p>
        </div>

        <form onSubmit={submit} className="w-full flex flex-col gap-4">
          <div>
            <label htmlFor="pname" className="block text-xs font-semibold mb-2 tracking-wider" style={{ color: SAGE2 }}>TON PRÉNOM</label>
            <input id="pname" ref={inputRef} type="text" value={name} onChange={e => setName(e.target.value)}
              maxLength={20} placeholder="ex. Alice"
              className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none"
              style={{ background: 'rgba(143,187,145,.08)', border: `1.5px solid ${name.trim() ? 'rgba(143,187,145,.5)' : 'rgba(143,187,145,.2)'}`, color: '#fff', caretColor: SAGE }} />
          </div>
          <button type="submit" disabled={!name.trim()}
            className="w-full font-display font-black text-base tracking-widest py-4 rounded-xl"
            style={{
              background: name.trim() ? 'linear-gradient(135deg,rgba(111,170,114,.3),rgba(143,187,145,.2))' : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${name.trim() ? 'rgba(143,187,145,.6)' : 'rgba(255,255,255,.08)'}`,
              color: name.trim() ? '#fff' : 'rgba(255,255,255,.3)',
              cursor: name.trim() ? 'pointer' : 'default',
              boxShadow: name.trim() ? '0 0 24px rgba(143,187,145,.2)' : 'none',
            }}>
            REJOINDRE →
          </button>
        </form>
        <p className="text-xs" style={{ color: 'rgba(220,240,220,.3)' }}>Pas de compte nécessaire</p>
      </div>
    </div>
  );
}

// ─── Lobby waiting screen (phone — waiting for host) ─────────────────────────
function PlayerWaiting({
  playerName,
  players,
  status,
  onQuizStart,
}: {
  playerName: string;
  players: Player[];
  status: RoomStatus;
  onQuizStart: () => void;
}) {
  const [dot, setDot] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setDot(d => (d + 1) % 4), 500);
    return () => clearInterval(id);
  }, []);

  // When host fires start → trigger countdown on this phone
  useEffect(() => {
    if (status === 'playing') onQuizStart();
  }, [status, onQuizStart]);

  const count = players.length;
  const pct   = Math.min((count / MIN_PLAYERS) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 gap-8"
      style={{ background: 'linear-gradient(160deg,#132016 0%,#0d1a0f 100%)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(143,187,145,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(143,187,145,.03) 1px,transparent 1px)`, backgroundSize: '50px 50px' }} />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6 text-center">
        {/* Pulsing city icon */}
        <div className="text-5xl" style={{ animation: 'pulse 2s ease-in-out infinite' }}>🏙️</div>

        <div>
          <p className="font-display font-black text-xs tracking-widest mb-2" style={{ color: 'rgba(143,187,145,.55)', letterSpacing: '.25em' }}>SMART CITY QUIZ · LOBBY</p>
          <h2 className="font-display font-black text-2xl text-white mb-1">
            Prêt, <span style={{ color: SAGE }}>{playerName}</span> !
          </h2>
          <p className="text-sm" style={{ color: 'rgba(220,240,220,.5)' }}>
            En attente du démarrage{'.'.repeat(dot)}
          </p>
        </div>

        {/* Player count progress */}
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: SAGE2 }}>Joueurs connectés</span>
            <span className="font-display font-black text-sm" style={{ color: count >= MIN_PLAYERS ? '#86efac' : SAGE }}>
              {count} / {MIN_PLAYERS}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(143,187,145,.12)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg,${SAGE},${SAGE2})` }} />
          </div>
          {count >= MIN_PLAYERS && (
            <p className="mt-2 text-xs font-semibold" style={{ color: '#86efac' }}>
              ✓ Nombre atteint — le prof va lancer !
            </p>
          )}
        </div>

        {/* Player list */}
        {players.length > 0 && (
          <div className="w-full">
            <p className="text-xs mb-2 text-left font-semibold" style={{ color: 'rgba(220,240,220,.4)' }}>DANS LE LOBBY</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {players.map(p => (
                <span key={p.id}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: p.name === playerName ? 'rgba(143,187,145,.22)' : 'rgba(143,187,145,.08)',
                    border: `1px solid ${p.name === playerName ? 'rgba(143,187,145,.6)' : 'rgba(143,187,145,.2)'}`,
                    color: p.name === playerName ? SAGE2 : 'rgba(220,240,220,.7)',
                  }}>
                  {p.name === playerName ? `✦ ${p.name}` : p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs" style={{ color: 'rgba(220,240,220,.25)' }}>
          Le quiz démarre automatiquement quand le prof appuie sur "Lancer"
        </p>
      </div>

      <style>{`@keyframes pulse { 0%,100% { transform:scale(1); opacity:.8 } 50% { transform:scale(1.08); opacity:1 } }`}</style>
    </div>
  );
}

// ─── Lobby countdown 3-2-1 ───────────────────────────────────────────────────
function LobbyCountdown({ playerName, onReady }: { playerName: string; onReady: () => void }) {
  const [count, setCount] = useState(3);
  const numRef  = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { onReady(); return; }
    if (numRef.current) gsap.fromTo(numRef.current, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2)' });

    const tick = () => {
      setCount(prev => {
        const next = prev - 1;
        if (numRef.current) gsap.fromTo(numRef.current, { scale: 2, opacity: 0 }, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2)' });
        if (next === 0) setTimeout(onReady, 700);
        return next;
      });
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ background: 'linear-gradient(160deg,#132016 0%,#0d1a0f 100%)' }}>
      <p className="font-display text-sm tracking-widest" style={{ color: SAGE2 }}>PRÊT, {playerName.toUpperCase()} !</p>
      <div ref={numRef} className="font-display font-black"
        style={{ fontSize: 'clamp(5rem,20vw,9rem)', color: count > 0 ? SAGE : '#fff', lineHeight: 1,
          textShadow: `0 0 40px ${count > 0 ? 'rgba(143,187,145,.6)' : 'rgba(255,255,255,.4)'}` }}>
        {count > 0 ? count : '🚀'}
      </div>
      <p className="text-lg font-semibold" style={{ color: 'rgba(220,240,220,.65)' }}>
        {count > 0 ? 'En route…' : 'GO !'}
      </p>
      <div className="flex gap-3">
        {[3,2,1].map(n => (
          <div key={n} className="w-3 h-3 rounded-full transition-all duration-300"
            style={{ background: n >= count && count > 0 ? SAGE : 'rgba(255,255,255,.12)', transform: n === count ? 'scale(1.4)' : 'scale(1)' }} />
        ))}
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-display text-xs" style={{ color: 'rgba(255,255,255,.4)', minWidth: 48 }}>{current+1} / {total}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${((current+1)/total)*100}%`, background: `linear-gradient(90deg,${SAGE},${SAGE2})` }} />
      </div>
    </div>
  );
}

// ─── Question card ────────────────────────────────────────────────────────────
type AnswerState = 'unanswered' | 'correct' | 'wrong';
interface QCProps { question: QuizQuestion; onAnswer: (c: boolean) => void; reduced: boolean; isMobile: boolean }

function QuestionCard({ question, onAnswer, reduced, isMobile }: QCProps) {
  const [chosen, setChosen] = useState<string|null>(null);
  const [state,  setState]  = useState<AnswerState>('unanswered');
  const cardRef = useRef<HTMLDivElement>(null);

  const submit = useCallback((id: string) => {
    if (state !== 'unanswered') return;
    setChosen(id);
    const ok = id === question.correctId;
    setState(ok ? 'correct' : 'wrong');
    if (!reduced && cardRef.current) {
      const tl = gsap.timeline();
      tl.to(cardRef.current, { y: ok ? -6 : 4, duration: .18 }).to(cardRef.current, { y: 0, duration: .22 });
    }
    setTimeout(() => onAnswer(ok), 980);
  }, [state, question.correctId, onAnswer, reduced]);

  const style = (id: string): React.CSSProperties => {
    if (state === 'unanswered') return { background: 'rgba(143,187,145,.04)', border: '1px solid rgba(143,187,145,.12)', color: 'rgba(220,240,220,.8)', cursor: 'pointer' };
    if (id === question.correctId) return { background: 'rgba(34,197,94,.14)', border: '1px solid rgba(34,197,94,.6)', color: '#86efac', cursor: 'default' };
    if (id === chosen) return { background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.5)', color: '#fca5a5', cursor: 'default' };
    return { background: 'transparent', border: '1px solid rgba(255,255,255,.05)', color: 'rgba(255,255,255,.3)', cursor: 'default' };
  };

  return (
    <div ref={cardRef}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold px-3 py-0.5 rounded-full"
          style={{ background: `${question.categoryColor}18`, border: `1px solid ${question.categoryColor}44`, color: question.categoryColor }}>
          {question.category}
        </span>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>B2–C1</span>
      </div>
      <p className="text-base font-semibold leading-relaxed mb-5" style={{ color: '#fff' }}>{question.question}</p>
      <div className="flex flex-col gap-3">
        {question.options.map(opt => (
          <button key={opt.id} type="button" onClick={() => submit(opt.id)}
            className="flex items-start gap-3 text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ ...style(opt.id), ...(isMobile ? { minHeight: 52 } : {}) }}>
            <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              style={{ background: opt.id === chosen && state !== 'unanswered'
                ? opt.id === question.correctId ? 'rgba(34,197,94,.3)' : 'rgba(239,68,68,.3)'
                : 'rgba(255,255,255,.08)',
                color: opt.id === question.correctId && state !== 'unanswered' ? '#86efac' : 'inherit' }}>
              {opt.id.toUpperCase()}
            </span>
            <span style={{ lineHeight: 1.5 }}>{opt.text}</span>
            {opt.id === question.correctId && state !== 'unanswered' && <span className="ml-auto flex-shrink-0">✓</span>}
            {opt.id === chosen && opt.id !== question.correctId && state !== 'unanswered' && <span className="ml-auto flex-shrink-0">✗</span>}
          </button>
        ))}
      </div>
      {state !== 'unanswered' && (
        <div className="mt-4 p-4 rounded-xl text-sm leading-relaxed"
          style={{ background: state === 'correct' ? 'rgba(34,197,94,.08)' : 'rgba(239,68,68,.08)',
            border: `1px solid ${state === 'correct' ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}`,
            color: 'rgba(220,240,220,.75)' }}>
          <span className="font-semibold" style={{ color: state === 'correct' ? '#86efac' : '#fca5a5' }}>
            {state === 'correct' ? '✓ Correct ! ' : '✗ Incorrect. '}
          </span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}

// ─── Mobile full-screen quiz shell ────────────────────────────────────────────
function MobileQuizShell({ playerName, onComplete }: { playerName: string; onComplete: (s: number) => void }) {
  const [idx, setIdx]       = useState(0);
  const [score, setScore]   = useState(0);
  const [done, setDone]     = useState(false);
  const [anim, setAnim]     = useState(false);
  const wrap    = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const handleAnswer = useCallback((ok: boolean) => {
    if (anim) return;
    setAnim(true);
    const ns = ok ? score + 1 : score;
    if (ok) setScore(ns);
    if (!reduced && wrap.current) {
      gsap.to(wrap.current, { x: ok ? -40 : 40, opacity: 0, duration: .28, ease: 'power2.in', onComplete: () => {
        const next = idx + 1;
        if (next >= quizQuestions.length) { setDone(true); onComplete(ns); }
        else setIdx(next);
        gsap.set(wrap.current, { x: ok ? 40 : -40 });
        gsap.to(wrap.current, { x: 0, opacity: 1, duration: .3, ease: 'power2.out', onComplete: () => setAnim(false) });
      }});
    } else {
      const next = idx + 1;
      if (next >= quizQuestions.length) { setDone(true); onComplete(ns); }
      else setIdx(next);
      setAnim(false);
    }
  }, [anim, idx, score, reduced, onComplete]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col"
      style={{ background: 'linear-gradient(160deg,#132016 0%,#0d1a0f 100%)' }}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: BORDER, background: 'rgba(13,26,15,.6)', backdropFilter: 'blur(10px)' }}>
        <div>
          <p className="font-display font-black text-xs tracking-widest" style={{ color: SAGE }}>SMART CITY QUIZ</p>
          <p className="text-xs" style={{ color: 'rgba(220,240,220,.4)' }}>{playerName}</p>
        </div>
        <div className="text-right">
          <p className="font-display font-black text-sm" style={{ color: SAGE }}>{idx}/{quizQuestions.length}</p>
          <p className="text-xs" style={{ color: 'rgba(220,240,220,.4)' }}>répondu</p>
        </div>
      </div>
      <div className="px-4 pt-3 flex-shrink-0">
        <ProgressBar current={idx} total={quizQuestions.length} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div ref={wrap}>
          <QuestionCard key={idx} question={quizQuestions[idx]} onAnswer={handleAnswer} reduced={reduced} isMobile />
        </div>
      </div>
    </div>
  );
}

// ─── Score screen ─────────────────────────────────────────────────────────────
function ScoreScreen({ score, total, playerName, onRestart, isMobile }: {
  score: number; total: number; playerName: string; onRestart: () => void; isMobile: boolean;
}) {
  const ref2   = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const pct    = Math.round((score / total) * 100);
  const msg    = scoreMessages.find(m => score >= m.min && score <= m.max)!;
  const circum = 2 * Math.PI * 52;

  useEffect(() => {
    if (reduced) { if (numRef.current) numRef.current.textContent = String(score); return; }
    if (!ref2.current) return;
    gsap.fromTo(ref2.current, { opacity: 0, scale: .9 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.4)' });
    const obj = { val: 0 };
    gsap.to(obj, { val: score, duration: 1.4, ease: 'power2.out',
      onUpdate() { if (numRef.current) numRef.current.textContent = String(Math.round(obj.val)); } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, reduced]);

  const content = (
    <div ref={ref2} className="flex flex-col items-center gap-6 text-center py-4">
      <div className="text-5xl">{msg.emoji}</div>
      {playerName && (
        <div>
          <p className="font-display font-black text-xl text-white mb-0.5">
            Bravo, <span style={{ color: SAGE }}>{playerName}</span> !
          </p>
          <p className="text-xs" style={{ color: 'rgba(220,240,220,.4)' }}>Smart City Quiz · résultat</p>
        </div>
      )}
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="8" />
          <circle cx="65" cy="65" r="52" fill="none" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circum} strokeDashoffset={circum * (1 - pct / 100)}
            style={{ transition: reduced ? 'none' : 'stroke-dashoffset 1.4s ease' }} />
          <defs>
            <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={SAGE} /><stop offset="100%" stopColor={SAGE2} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={numRef} className="font-display font-black text-4xl" style={{ color: SAGE, lineHeight: 1 }}>0</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,.4)' }}>/ {total}</span>
        </div>
      </div>
      <div>
        <h3 className="font-display font-black text-2xl mb-2" style={{ color: '#fff' }}>{msg.title}</h3>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(220,240,220,.65)', lineHeight: 1.7 }}>{msg.text}</p>
      </div>
      <div className="flex gap-2 flex-wrap justify-center max-w-xs">
        {quizQuestions.map((q, i) => (
          <div key={q.id} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: i < score ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.15)',
              border: `1px solid ${i < score ? 'rgba(34,197,94,.5)' : 'rgba(239,68,68,.3)'}`,
              color: i < score ? '#86efac' : '#fca5a5' }}>
            {i < score ? '✓' : '✗'}
          </div>
        ))}
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button type="button" onClick={onRestart}
          className="font-display font-bold text-xs tracking-widest px-6 py-2.5 rounded-full transition-all hover:scale-105"
          style={{ background: 'rgba(143,187,145,.1)', border: `1px solid rgba(143,187,145,.4)`, color: SAGE, cursor: 'pointer' }}>
          REJOUER
        </button>
      </div>
    </div>
  );

  if (isMobile) return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(160deg,#132016 0%,#0d1a0f 100%)' }}>
      {content}
    </div>
  );
  return content;
}

// ─── Host lobby panel ─────────────────────────────────────────────────────────
function HostLobby({ players, status, quizUrl, onPlayHere }: {
  players: Player[]; status: RoomStatus; quizUrl: string; onPlayHere: () => void;
}) {
  const count    = players.length;
  const canStart = count >= 1;
  const pct      = Math.min((count / MIN_PLAYERS) * 100, 100);
  const autoStart = count >= MIN_PLAYERS && status === 'waiting';

  // Auto-start when threshold reached
  useEffect(() => {
    if (autoStart) hostStartQuiz();
  }, [autoStart]);

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      {/* QR code */}
      <div className="p-4 rounded-2xl" style={{ background: '#fff', boxShadow: `0 0 50px rgba(143,187,145,.3)` }}>
        <QRCodeSVG value={quizUrl} size={180} bgColor="#ffffff" fgColor="#0d1a0f" level="M" marginSize={1} />
      </div>

      {/* Player counter */}
      <div className="w-full">
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-semibold" style={{ color: 'rgba(220,240,220,.5)' }}>JOUEURS DANS LE LOBBY</span>
          <span className="font-display font-black text-sm" style={{ color: count >= MIN_PLAYERS ? '#86efac' : SAGE }}>
            {count} / {MIN_PLAYERS}
          </span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(143,187,145,.12)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: count >= MIN_PLAYERS ? 'linear-gradient(90deg,#86efac,#4ade80)' : `linear-gradient(90deg,${SAGE},${SAGE2})` }} />
        </div>
        {count >= MIN_PLAYERS
          ? <p className="mt-1.5 text-xs font-semibold" style={{ color: '#86efac' }}>✓ Démarrage automatique…</p>
          : <p className="mt-1.5 text-xs" style={{ color: 'rgba(220,240,220,.35)' }}>Démarrage auto à {MIN_PLAYERS} joueurs</p>
        }
      </div>

      {/* Player list */}
      {players.length > 0 ? (
        <div className="w-full">
          <p className="text-xs mb-2 text-left font-semibold" style={{ color: 'rgba(220,240,220,.35)' }}>CONNECTÉS</p>
          <div className="flex flex-wrap gap-1.5">
            {players.map((p, i) => (
              <span key={p.id} className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: 'rgba(143,187,145,.1)', border: '1px solid rgba(143,187,145,.25)', color: SAGE2 }}>
                {i + 1}. {p.name}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'rgba(220,240,220,.35)', maxWidth: 220 }}>
          Les étudiants apparaissent ici dès qu'ils scannent le QR code
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-2 w-full">
        {status === 'waiting' && (
          <button type="button" onClick={hostStartQuiz} disabled={!canStart}
            className="w-full font-display font-bold text-sm tracking-widest py-3 rounded-full transition-all hover:scale-105"
            style={{
              background: canStart ? 'linear-gradient(135deg,rgba(111,170,114,.35),rgba(143,187,145,.22))' : 'rgba(255,255,255,.04)',
              border: `1.5px solid ${canStart ? 'rgba(143,187,145,.55)' : 'rgba(255,255,255,.08)'}`,
              color: canStart ? '#fff' : 'rgba(255,255,255,.25)',
              cursor: canStart ? 'pointer' : 'default',
              boxShadow: canStart ? '0 0 20px rgba(143,187,145,.2)' : 'none',
            }}>
            🚀 LANCER LE QUIZ {canStart ? `(${count} joueur${count>1?'s':''})` : ''}
          </button>
        )}
        {status === 'playing' && (
          <div className="py-2 px-4 rounded-full text-xs font-semibold text-center"
            style={{ background: 'rgba(134,239,172,.12)', border: '1px solid rgba(134,239,172,.35)', color: '#86efac' }}>
            ✓ Quiz en cours sur {count} téléphone{count>1?'s':''}
          </div>
        )}
        <button type="button" onClick={hostResetRoom}
          className="w-full text-xs py-2 rounded-full transition-all hover:opacity-80"
          style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: 'rgba(239,68,68,.7)', cursor: 'pointer' }}>
          🔄 Réinitialiser le lobby
        </button>
        <button type="button" onClick={onPlayHere}
          className="w-full text-xs py-2 rounded-full transition-all hover:opacity-80"
          style={{ background: 'rgba(143,187,145,.06)', border: BORDER, color: 'rgba(220,240,220,.5)', cursor: 'pointer' }}>
          Jouer sur cet écran →
        </button>
      </div>
    </div>
  );
}

// ─── Main exported section ────────────────────────────────────────────────────
type DesktopPhase = 'landing' | 'playing' | 'results';
type MobilePhase  = 'idle' | 'join' | 'waiting' | 'lobby' | 'quiz' | 'result';

export function QuizSection() {
  // Firebase room state
  const { players, status } = useFirebaseRoom();

  // Desktop state
  const [dPhase, setDPhase]       = useState<DesktopPhase>('landing');
  const [dIndex, setDIndex]       = useState(0);
  const [dScore, setDScore]       = useState(0);
  const [dAnim,  setDAnim]        = useState(false);
  const dWrap   = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Mobile state
  const [mPhase,      setMPhase]      = useState<MobilePhase>('idle');
  const [playerName,  setPlayerName]  = useState('');
  const [playerRef,   setPlayerRef]   = useState<DatabaseReference | null>(null);
  const [mScore,      setMScore]      = useState(0);

  const quizUrl = `${window.location.origin}/#quiz`;

  const isMobile =
    typeof window !== 'undefined' &&
    (window.matchMedia('(max-width:768px)').matches || window.matchMedia('(pointer:coarse)').matches);

  // ── Detect phone via hash ────────────────────────────────────────────────
  useEffect(() => {
    if (window.location.hash === '#quiz') setMPhase('join');
  }, []);

  // ── Join Firebase lobby ──────────────────────────────────────────────────
  const joinLobby = useCallback(async (name: string) => {
    setPlayerName(name);
    const pRef = push(ref(db, `${ROOM}/players`), { name, joinedAt: Date.now() });
    setPlayerRef(pRef);
    // Auto-remove on browser close
    onDisconnect(pRef).remove();
    setMPhase('waiting');
  }, []);

  // ── Clean up player on quiz end / rejoin ─────────────────────────────────
  const mobileRestart = useCallback(async () => {
    if (playerRef) await remove(playerRef);
    setPlayerRef(null);
    setPlayerName('');
    setMPhase('join');
  }, [playerRef]);

  // ── Desktop quiz handlers ────────────────────────────────────────────────
  const dAnswer = useCallback((ok: boolean) => {
    if (dAnim) return;
    setDAnim(true);
    if (ok) setDScore(s => s + 1);
    if (!reduced && dWrap.current) {
      gsap.to(dWrap.current, { x: ok ? -40 : 40, opacity: 0, duration: .28, ease: 'power2.in', onComplete: () => {
        const next = dIndex + 1;
        if (next >= quizQuestions.length) setDPhase('results');
        else setDIndex(next);
        gsap.set(dWrap.current, { x: ok ? 40 : -40 });
        gsap.to(dWrap.current, { x: 0, opacity: 1, duration: .3, ease: 'power2.out', onComplete: () => setDAnim(false) });
      }});
    } else {
      const next = dIndex + 1;
      if (next >= quizQuestions.length) setDPhase('results');
      else setDIndex(next);
      setDAnim(false);
    }
  }, [dAnim, dIndex, reduced]);

  const dRestart = useCallback(() => {
    setDIndex(0); setDScore(0); setDPhase('landing');
    if (!reduced && dWrap.current) gsap.set(dWrap.current, { x: 0, opacity: 1 });
  }, [reduced]);

  // ── Mobile overlays ───────────────────────────────────────────────────────
  if (mPhase === 'join') return <JoinScreen onJoin={joinLobby} />;

  if (mPhase === 'waiting') return (
    <PlayerWaiting
      playerName={playerName}
      players={players}
      status={status}
      onQuizStart={() => setMPhase('lobby')}
    />
  );

  if (mPhase === 'lobby') return (
    <LobbyCountdown playerName={playerName} onReady={() => setMPhase('quiz')} />
  );

  if (mPhase === 'quiz') return (
    <MobileQuizShell playerName={playerName} onComplete={s => { setMScore(s); setMPhase('result'); }} />
  );

  if (mPhase === 'result') return (
    <ScoreScreen score={mScore} total={quizQuestions.length} playerName={playerName} onRestart={mobileRestart} isMobile />
  );

  // ── Desktop section ───────────────────────────────────────────────────────
  return (
    <section id="quiz" className="py-20 px-4"
      style={{ background: 'linear-gradient(180deg,#0d1a0f 0%,#132016 100%)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest mb-3" style={{ color: SAGE }}>ACTIVITÉ INTERACTIVE</p>
          <h2 className="font-display font-black text-4xl md:text-5xl text-white mb-4">
            City <span style={{ color: SAGE }}>Quiz</span>
          </h2>
          <p className="text-sm" style={{ color: 'rgba(220,240,220,.5)', maxWidth: 480, margin: '0 auto' }}>
            Les étudiants scannent le QR code → entrent leur prénom → rejoignent le lobby.
            Le quiz démarre automatiquement quand <strong style={{ color: SAGE2 }}>{MIN_PLAYERS} joueurs</strong> sont connectés.
          </p>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-[1fr_1.6fr] gap-6 items-start">

          {/* LEFT — host panel */}
          <div className="rounded-2xl p-6" style={{ background: BG, backdropFilter: 'blur(16px)', border: BORDER }}>
            <HostLobby players={players} status={status} quizUrl={quizUrl}
              onPlayHere={() => { setDIndex(0); setDScore(0); setDPhase('playing'); }} />
          </div>

          {/* RIGHT — quiz area */}
          <div className="rounded-2xl p-6 min-h-96" style={{ background: BG, backdropFilter: 'blur(16px)', border: BORDER }}>

            {dPhase === 'landing' && (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-10">
                <div className="text-6xl">🌿</div>
                <div>
                  <h3 className="font-display font-black text-xl text-white mb-2">Testez vos connaissances</h3>
                  <p className="text-sm" style={{ color: 'rgba(220,240,220,.5)', maxWidth: 320 }}>
                    8 questions sur les villes intelligentes et Smart City 2050. Combien saurez-vous en réussir ?
                  </p>
                </div>
                <button type="button" onClick={() => { setDIndex(0); setDScore(0); setDPhase('playing'); }}
                  className="font-display font-bold text-sm tracking-widest px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg,rgba(143,187,145,.18),rgba(111,170,114,.12))',
                    border: `1px solid rgba(143,187,145,.5)`, color: SAGE2, cursor: 'pointer',
                    boxShadow: `0 0 24px rgba(143,187,145,.18)` }}>
                  COMMENCER LE QUIZ
                </button>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,.3)' }}>Pas d'inscription · résultats instantanés</p>
              </div>
            )}

            {dPhase === 'playing' && (
              <div>
                <ProgressBar current={dIndex} total={quizQuestions.length} />
                <div ref={dWrap}>
                  <QuestionCard key={dIndex} question={quizQuestions[dIndex]} onAnswer={dAnswer} reduced={reduced} isMobile={isMobile} />
                </div>
              </div>
            )}

            {dPhase === 'results' && (
              <ScoreScreen score={dScore} total={quizQuestions.length} playerName="" onRestart={dRestart} isMobile={false} />
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-center" style={{ color: 'rgba(220,240,220,.2)' }}>
          🎓 Conseil professeur : projetez le QR code au tableau · les étudiants jouent simultanément ·
          discutez les explications ensemble après chaque réponse.
        </p>
      </div>
    </section>
  );
}
