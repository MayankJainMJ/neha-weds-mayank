/* Firestore sync — anonymous, debounced, never blocks the UI (SPEC §8.4).
   localStorage (mwn.v1) stays the source of truth on the device; this module
   mirrors it to guests/{uid} and renders the global Top Players board.
   The config below is intentionally public — security lives in the Firestore
   rules (own-doc writes, server-side caps), not in secrecy. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, doc, setDoc, serverTimestamp,
  collection, query, orderBy, limit, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const CFG = {
  apiKey: 'AIzaSyBSSXaJeiv-90OdqTla7It0vP_gni105oE',
  authDomain: 'neha-weds-mayank.firebaseapp.com',
  projectId: 'neha-weds-mayank',
  storageBucket: 'neha-weds-mayank.firebasestorage.app',
  messagingSenderId: '747793962308',
  appId: '1:747793962308:web:ad566ee8c4d9093405b311'
};

let app = null, db = null, auth = null, uid = null, timer = null;

// test artifacts that can't be deleted client-side (rules) — hidden everywhere
const BLOCKLIST = ['ping', 'test player'];
const blocked = v => BLOCKLIST.includes(String(v.name || '').trim().toLowerCase());

/* one person, many devices -> many anonymous docs. Collapse to the best
   score per typed name (nameLower) so the board reads one row per guest. */
function dedupeByName(rows) {
  const best = new Map();
  for (const v of rows) {
    const k = String(v.nameLower || v.name || '').trim().toLowerCase();
    if (!k) continue;
    const prev = best.get(k);
    if (!prev || (v.bestScore | 0) > (prev.bestScore | 0) ||
        ((v.bestScore | 0) === (prev.bestScore | 0) && v.rsvp && !prev.rsvp)) {
      best.set(k, v);
    }
  }
  return [...best.values()].sort((a, b) => (b.bestScore | 0) - (a.bestScore | 0));
}

function init() {
  if (!app) {
    app = initializeApp(CFG);
    db = getFirestore(app);
    auth = getAuth(app);
  }
}

async function ensureAuth() {
  init();
  if (uid) return uid;
  const cred = await signInAnonymously(auth);
  uid = cred.user.uid;
  return uid;
}

async function pushNow() {
  try {
    if (!window.MWN) return;
    const st = window.MWN.load();
    if (!(st.name || st.bestScore > 0 || st.rsvp)) return; // nothing worth sending
    await ensureAuth();
    const data = {
      name: String(st.name || '').slice(0, 40),
      nameLower: String(st.name || '').toLowerCase().slice(0, 40),
      bestScore: Math.max(0, Math.min(9999, st.bestScore | 0)),
      plays: st.plays | 0,
      tokensCount: (st.tokens || []).filter(Boolean).length,
      hearts: st.hearts | 0,
      rsvp: st.rsvp ? JSON.parse(JSON.stringify(st.rsvp)) : null,
      device: (navigator.userAgent || '').slice(0, 80),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'guests', uid), data, { merge: true });
    window.dispatchEvent(new CustomEvent('mwn-synced'));
  } catch (e) {
    /* offline / blocked / rules reject — localStorage still has everything;
       we retry on the next visit or the next schedulePush. */
  }
}

function schedulePush() {
  clearTimeout(timer);
  timer = setTimeout(pushNow, 1500);
}

async function renderBoard() {
  const el = document.getElementById('lbRows');
  if (!el) return;
  try {
    init();
    const snap = await getDocs(query(collection(db, 'guests'), orderBy('bestScore', 'desc'), limit(25)));
    const raw = [];
    snap.forEach(d => {
      const v = d.data();
      if (blocked(v)) return;
      if ((v.bestScore | 0) > 0 || v.name) raw.push(v);
    });
    const rows = dedupeByName(raw);
    if (!rows.length) return; // keep the device-local fallback rows
    el.innerHTML = '';
    rows.slice(0, 5).forEach((v, i) => {
      const p = document.createElement('p');
      p.style.cssText = 'font-size:.95rem;margin:.3rem 0;letter-spacing:.02em';
      const crown = v.rsvp && v.rsvp.attending ? ' \u{1F451}' : '';
      const nm = String(v.name || 'PLAYER').replace(/[<>&]/g, '');
      p.innerHTML = (i + 1) + '. <b>' + nm + '</b>' + crown +
        ' \u00B7 <span style="color:#ffd23f">' + (v.bestScore | 0) + '</span>';
      el.appendChild(p);
    });
    const note = document.createElement('p');
    note.className = 'muted';
    note.style.cssText = 'font-size:.72rem;margin-top:.5rem';
    note.textContent = '\u{1F451} = RSVP\u2019d \u00B7 live across all guests';
    el.appendChild(note);
  } catch (e) {
    /* read failed — the local board stays up */
  }
}

async function renderChamp() {
  const el = document.getElementById('champLine');
  if (!el) return;
  try {
    init();
    const snap = await getDocs(query(collection(db, 'guests'), orderBy('bestScore', 'desc'), limit(10)));
    let top = null;
    snap.forEach(d => { const v = d.data(); if (!top && !blocked(v)) top = v; });
    if (!top || (top.bestScore | 0) <= 0 || !top.name) return; // line stays hidden
    const nm = String(top.name).replace(/[<>&]/g, '');
    el.textContent = '\u{1F3C6} ' + nm + ' \u00B7 ' + (top.bestScore | 0) + ' \u2014 think you can beat it?';
    el.hidden = false;
  } catch (e) { /* stays hidden */ }
}

window.CLOUD = { schedulePush, pushNow, renderBoard, renderChamp };

schedulePush();   // auto-resync anything saved locally, every visit
renderBoard();    // global board (rsvp page only — no-op elsewhere)
renderChamp();    // challenge line (invite deck's last card — no-op elsewhere)
