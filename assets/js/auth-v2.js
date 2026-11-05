/* MindCursor auth — multi-step flow (21st.dev @jahed style).
 * Frontend demo auth (localStorage): accounts live in this browser only.
 * Swap the storage functions for real API calls when a backend is connected. */

'use strict';

const AUTH_USERS_KEY = 'mindcursor_users';
const AUTH_SESSION_KEY = 'mindcursor_session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '[]'); }
  catch (e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}
function setSession(email) {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ email: email, at: Date.now() }));
}
function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) || 'null'); }
  catch (e) { return null; }
}

async function hashPw(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mindcursor$' + pw));
  return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function validEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/* ---------- modal ---------- */
function modalEl() { return document.getElementById('auth-modal'); }
function showModal(text) {
  document.getElementById('auth-modal-text').textContent = text;
  modalEl().hidden = false;
}
function setModalText(text) {
  document.getElementById('auth-modal-text').textContent = text;
}
function showModalSuccess(title) {
  document.getElementById('auth-modal-body').innerHTML =
    '<div class="auth-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>' +
    '<p class="auth-modal-ok">' + title + '</p>';
  fireConfetti();
}

/* ---------- confetti ---------- */
function fireConfetti() {
  const c = document.getElementById('confetti');
  if (!c) return;
  c.hidden = false;
  const ctx = c.getContext('2d');
  c.width = window.innerWidth; c.height = window.innerHeight;
  const colors = ['#0038ff', '#ff77cd', '#ff5f04', '#F0C96A', '#1c7a3d', '#7d97ff'];
  const parts = [];
  for (let i = 0; i < 150; i++) {
    parts.push({
      x: c.width / 2 + (Math.random() - .5) * 140,
      y: c.height * 0.42,
      vx: (Math.random() - .5) * 11, vy: Math.random() * -9 - 3,
      s: Math.random() * 7 + 4, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      color: colors[i % colors.length], life: 1
    });
  }
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.vy += .28; p.vx *= .99; p.r += p.vr; p.life -= .008;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(p.life, 0); ctx.fillStyle = p.color;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62); ctx.restore();
    });
    if (++frames < 230) requestAnimationFrame(tick); else c.hidden = true;
  })();
}

/* ---------- step engine ---------- */
function stepError(step, msg) {
  const el = step.querySelector('.auth-error');
  if (el) el.textContent = msg || '';
}
function markBad(input, bad) {
  if (input) input.classList.toggle('is-bad', !!bad);
}
function goStep(flow, n) {
  flow.querySelectorAll('.auth-step').forEach(function (s) {
    s.classList.toggle('is-active', s.getAttribute('data-step') === String(n));
  });
  const active = flow.querySelector('.auth-step.is-active input:not([readonly])');
  if (active) setTimeout(function () { active.focus({ preventScroll: true }); }, 60);
}

function initFlow(flow, handlers) {
  let n = 1;
  const max = flow.querySelectorAll('.auth-step').length;

  flow.addEventListener('click', function (e) {
    const go = e.target.closest('[data-go]');
    if (go) { handlers.go(n, go); return; }
    if (e.target.closest('[data-back]')) {
      if (n > 1) { n--; stepError(flow.querySelector('.auth-step.is-active'), ''); goStep(flow, n); }
    }
  });
  flow.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const step = e.target.closest('.auth-step');
      const go = step && step.querySelector('[data-go]');
      if (go) { e.preventDefault(); handlers.go(n, go); }
    }
  });
  flow._setStep = function (m) { n = m; goStep(flow, n); };
  flow._getStep = function () { return n; };
  return flow;
}

document.addEventListener('DOMContentLoaded', function () {
  const close = document.getElementById('auth-modal-close');
  if (close) close.addEventListener('click', function () { modalEl().hidden = true; });

  /* ================= SIGNUP ================= */
  const signup = document.getElementById('signup-flow');
  if (signup) {
    const data = {};
    const flow = initFlow(signup, {
      go: async function (n) {
        const step = signup.querySelector('.auth-step[data-step="' + n + '"]');
        stepError(step, '');
        const q = function (sel) { return step.querySelector(sel); };

        if (n === 1) {
          const em = q('[name=email]').value.trim().toLowerCase();
          markBad(q('[name=email]'), false);
          if (!validEmail(em)) { markBad(q('[name=email]'), true); return stepError(step, 'That email address doesn\u2019t look right.'); }
          if (getUsers().some(function (u) { return u.email === em; })) {
            markBad(q('[name=email]'), true);
            return stepError(step, 'This email already has an account. Try signing in.');
          }
          data.email = em;
          signup.querySelectorAll('.js-echo-email').forEach(function (i) { i.value = em; });
          flow._setStep(2);
        } else if (n === 2) {
          const nm = q('[name=name]').value.trim();
          markBad(q('[name=name]'), false);
          if (nm.length < 2) { markBad(q('[name=name]'), true); return stepError(step, 'Please enter your name.'); }
          data.name = nm;
          flow._setStep(3);
        } else if (n === 3) {
          const p1 = q('[name=password]').value;
          markBad(q('[name=password]'), false);
          if (p1.length < 6) { markBad(q('[name=password]'), true); return stepError(step, 'Password needs at least 6 characters.'); }
          data.pw = p1;
          flow._setStep(4);
        } else if (n === 4) {
          const p2 = q('[name=confirm]').value;
          markBad(q('[name=confirm]'), false);
          if (p2 !== data.pw) { markBad(q('[name=confirm]'), true); return stepError(step, 'Passwords don\u2019t match.'); }

          const users = getUsers();
          users.push({ name: data.name, email: data.email, hash: await hashPw(data.pw), at: Date.now() });
          saveUsers(users);
          setSession(data.email);

          showModal('Signing you up...');
          setTimeout(function () { setModalText('Onboarding you...'); }, 900);
          setTimeout(function () { setModalText('Finalizing...'); }, 1800);
          setTimeout(function () {
            showModalSuccess('Welcome Aboard!');
            setTimeout(function () { location.href = 'index.html'; }, 1500);
          }, 2500);
        }
      }
    });
  }

  /* ================= SIGNIN ================= */
  const signin = document.getElementById('signin-flow');
  if (signin) {
    const data = {};
    const flow = initFlow(signin, {
      go: async function (n) {
        const step = signin.querySelector('.auth-step[data-step="' + n + '"]');
        stepError(step, '');
        const q = function (sel) { return step.querySelector(sel); };

        if (n === 1) {
          const em = q('[name=email]').value.trim().toLowerCase();
          markBad(q('[name=email]'), false);
          if (!validEmail(em)) { markBad(q('[name=email]'), true); return stepError(step, 'Enter the email you signed up with.'); }
          data.email = em;
          signin.querySelectorAll('.js-echo-email').forEach(function (i) { i.value = em; });
          flow._setStep(2);
        } else if (n === 2) {
          const p1 = q('[name=password]').value;
          markBad(q('[name=password]'), false);
          const user = getUsers().find(function (u) { return u.email === data.email; });
          if (!p1 || !user || user.hash !== await hashPw(p1)) {
            markBad(q('[name=password]'), true);
            return stepError(step, 'Email or password doesn\u2019t match. Try again.');
          }
          setSession(data.email);
          showModal('Signing you in...');
          setTimeout(function () { location.href = 'index.html'; }, 1100);
        }
      }
    });
  }
});
