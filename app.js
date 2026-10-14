/* ============================================================
   SirrApp — App Logic (Redesigned)
   ============================================================
   New:
   - Recent chats tracker (localStorage)
   - Sidebar shows ONLY recent chats + search results
   - Mobile: no chat preview; tap to open; back to return
   ============================================================ */

/* ---------- 1) State ---------- */
const state = {
  user: null,
  profile: null,
  users: [],
  filteredUsers: [],
  selectedPartner: null,
  myInboxChannel: null,
  partnerSendChannel: null,
  conversations: {},
  pendingImages: [],
  mediaRecorder: null,
  audioChunks: [],
  recTimer: null,
  recSeconds: 0,
  lastTypingSent: 0,
  isMobile: window.innerWidth < 1024
};

/* ---------- 2) Helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}
function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
function hashColor(str) {
  const p = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#06b6d4','#0ea5e9','#14b8a6','#a855f7'];
  let h = 0;
  for (let i = 0; i < (str||'').length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return p[h % p.length];
}
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[s]));
}
function dataURLtoBlob(dataURL) {
  const [meta, b64] = dataURL.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/* ---------- 3) Recent Chats tracker ---------- */
const Chats = {
  KEY: 'sirrapp-recent-chats',
  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '{}'); }
    catch { return {}; }
  },
  save(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },
  touch(partner) {
    if (!partner?.id) return;
    const data = this.load();
    data[partner.id] = {
      id: partner.id,
      username: partner.username || '',
      full_name: partner.full_name || partner.username || 'User',
      lastAt: Date.now()
    };
    this.save(data);
  },
  all() {
    const data = this.load();
    return Object.values(data).sort((a, b) => b.lastAt - a.lastAt);
  },
  remove(id) {
    const data = this.load();
    delete data[id];
    this.save(data);
  }
};

/* ---------- 4) Toasts ---------- */
function showToast(message, type = 'info', duration = 3000) {
  const c = $('#toasts');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }, duration);
}

/* ---------- 5) Theme ---------- */
const Theme = (() => {
  const KEY = 'sirrapp-theme';
  let current = localStorage.getItem(KEY);
  function sysPref() { return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function apply(mode) {
    const dark = mode === 'dark';
    document.documentElement.classList.toggle('dark', dark);
    $('#iconSun')?.classList.toggle('hidden', !dark);
    $('#iconMoon')?.classList.toggle('hidden', dark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0a0a' : '#fafafa');
  }
  function init() {
    if (!current) current = sysPref();
    apply(current);
    localStorage.setItem(KEY, current);
  }
  function toggle() {
    current = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, current);
    localStorage.setItem(KEY + '-manual', '1');
    apply(current);
  }
  return { init, toggle };
})();

/* ---------- 6) Language ---------- */
function initLanguage() {
  const select = $('#langSelect');
  select.value = localStorage.getItem('sirrapp-lang') || 'ar';
  select.addEventListener('change', e => {
    I18n.setLang(e.target.value);
    renderUsersList();
    renderMessages();
    updatePartnerHeader();
  });
}

/* ---------- 7) Auth ---------- */
const Auth = {
  async signUp({ email, password, username, fullName, age, phone }) {
    if (!email || !password || !username || !fullName || !age) throw new Error(I18n.t('fillAllFields'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(I18n.t('invalidEmail'));
    if (password.length < 6) throw new Error(I18n.t('passwordMin'));
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) throw new Error(I18n.t('usernameInvalid'));
    const n = parseInt(age, 10);
    if (!Number.isFinite(n) || n < 16 || n > 120) throw new Error(I18n.t('ageInvalid'));

    const { data, error } = await supabaseClient.auth.signUp({
      email, password,
      options: {
        data: { username, full_name: fullName, age: n, phone: phone || null },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) throw error;
    if (data.session && data.user) {
      await Profile.upsert({
        id: data.user.id, email, username,
        full_name: fullName, age: n, phone: phone || null
      });
    }
    return data;
  },
  async signIn(email, password) {
    if (!email || !password) throw new Error(I18n.t('fillAllFields'));
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },
  async signOut() { await supabaseClient.auth.signOut(); }
};

/* ---------- 8) Profile ---------- */
const Profile = {
  async get(id) {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  async upsert(p) {
    const { data, error } = await supabaseClient.from('profiles').upsert(p, { onConflict: 'id' }).select().maybeSingle();
    if (error) throw error;
    return data;
  },
  async listExcept(id) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, email, username, full_name, age, phone, avatar_url, created_at')
      .neq('id', id)
      .order('created_at', { ascending: false })
      .limit(300);
    if (error) throw error;
    return data || [];
  },
  async ensureFromMeta(user) {
    let p = await Profile.get(user.id);
    if (p) return p;
    const m = user.user_metadata || {};
    const np = {
      id: user.id, email: user.email,
      username: m.username || `user_${user.id.slice(0,8)}`,
      full_name: m.full_name || 'User',
      age: parseInt(m.age, 10) || 16,
      phone: m.phone || null
    };
    try { p = await Profile.upsert(np); } catch { p = np; }
    return p;
  }
};

/* ---------- 9) Views ---------- */
function showAuthView() {
  $('#authView').classList.remove('hidden');
  $('#chatView').classList.add('hidden');
  $('#userMenu').classList.add('hidden');
  $('#userMenu').classList.remove('flex');
}
function showChatView() {
  $('#authView').classList.add('hidden');
  $('#chatView').classList.remove('hidden');
  $('#userMenu').classList.remove('hidden');
  $('#userMenu').classList.add('flex');
}

/* ---------- 10) Auth tabs/forms ---------- */
function initAuthTabs() {
  const tl = $('#tabLogin'), ts = $('#tabSignup');
  const fl = $('#loginForm'), fs = $('#signupForm');
  tl.addEventListener('click', () => {
    tl.classList.add('tab-active'); ts.classList.remove('tab-active');
    fl.classList.remove('hidden'); fs.classList.add('hidden');
  });
  ts.addEventListener('click', () => {
    ts.classList.add('tab-active'); tl.classList.remove('tab-active');
    fs.classList.remove('hidden'); fl.classList.add('hidden');
  });
}

function showFormMsg(el, text, type = 'info') {
  el.textContent = text;
  el.className = `form-msg ${type}`;
  el.classList.remove('hidden');
}
function hideFormMsg(el) { el.classList.add('hidden'); }

function initAgeValidation() {
  const age = $('#suAge'), warn = $('#ageWarning'), btn = $('#signupBtn');
  age.addEventListener('input', () => {
    const v = parseInt(age.value, 10);
    if (Number.isFinite(v) && v < 16) {
      warn.classList.remove('hidden');
      btn.disabled = true;
    } else {
      warn.classList.add('hidden');
      btn.disabled = false;
    }
  });
}

function initAuthForms() {
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#loginMsg'); hideFormMsg(msg);
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await Auth.signIn($('#loginEmail').value.trim(), $('#loginPassword').value);
      showFormMsg(msg, I18n.t('loginSuccess'), 'success');
    } catch (err) {
      showFormMsg(msg, I18n.t('loginFailed') + (err.message || ''), 'error');
    } finally { btn.disabled = false; }
  });

  $('#signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#signupMsg'); hideFormMsg(msg);
    const btn = $('#signupBtn'); btn.disabled = true;
    try {
      const age = parseInt($('#suAge').value, 10);
      const res = await Auth.signUp({
        email: $('#suEmail').value.trim(),
        password: $('#suPassword').value,
        username: $('#suUsername').value.trim(),
        fullName: $('#suFullName').value.trim(),
        age,
        phone: $('#suPhone').value.trim() || null
      });
      if (res.session) showFormMsg(msg, I18n.t('signupSuccess'), 'success');
      else { showFormMsg(msg, I18n.t('signupNeedConfirm'), 'info'); $('#signupForm').reset(); }
    } catch (err) {
      showFormMsg(msg, I18n.t('signupFailed') + (err.message || ''), 'error');
    } finally { btn.disabled = false; }
  });
}

/* ---------- 11) Auth state ---------- */
function initAuthListener() {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      state.user = null; state.profile = null;
      cleanupRealtime();
      showAuthView();
      return;
    }
    if (session?.user) {
      state.user = session.user;
      try { state.profile = await Profile.ensureFromMeta(session.user); }
      catch { state.profile = { id: session.user.id, username: session.user.email, full_name: 'User' }; }
      await onLoggedIn();
    }
  });
}

async function onLoggedIn() {
  showChatView();
  renderMyProfile();
  await loadUsers();
  subscribeMyInbox();
  // On mobile, ensure sidebar is visible initially
  if (state.isMobile) {
    closeMobileChat();
  }
}

async function cleanupRealtime() {
  if (state.myInboxChannel) { try { await supabaseClient.removeChannel(state.myInboxChannel); } catch(_){} state.myInboxChannel = null; }
  if (state.partnerSendChannel) { try { await supabaseClient.removeChannel(state.partnerSendChannel); } catch(_){} state.partnerSendChannel = null; }
}

/* ---------- 12) My profile ---------- */
function renderMyProfile() {
  const p = state.profile || {};
  const name = p.full_name || p.username || 'User';
  const color = hashColor(p.id || p.username || 'me');

  ['#myAvatar', '#userAvatar'].forEach(sel => {
    const el = $(sel);
    if (el) { el.textContent = initials(name); el.style.background = color; }
  });
  $('#myName').textContent = name;
  $('#myUsername').textContent = '@' + (p.username || 'user');
}

/* ---------- 13) Users list (recent + search) ---------- */
async function loadUsers() {
  try {
    state.users = await Profile.listExcept(state.user.id);
    renderUsersList();
  } catch (e) {
    console.error('loadUsers error:', e);
  }
}

function renderUsersList() {
  const list = $('#usersList');
  const emptyRecent = $('#emptyRecent');
  const label = $('#listLabel');
  const q = ($('#searchUsers').value || '').trim().toLowerCase();

  list.innerHTML = '';
  let items = [];

  if (!q) {
    // Show RECENT CHATS only
    label.setAttribute('data-i18n', 'recent');
    label.textContent = I18n.t('recent') || 'المحادثات الأخيرة';

    const recent = Chats.all();
    items = recent.map(r => {
      const full = state.users.find(u => u.id === r.id);
      return full || r;
    });

    if (items.length === 0) {
      emptyRecent.classList.remove('hidden');
      list.classList.add('hidden');
      return;
    } else {
      emptyRecent.classList.add('hidden');
      list.classList.remove('hidden');
    }
  } else {
    // Show SEARCH RESULTS
    label.setAttribute('data-i18n', 'searchResults');
    label.textContent = I18n.t('searchResults') || 'نتائج البحث';

    emptyRecent.classList.add('hidden');
    list.classList.remove('hidden');

    items = state.users.filter(u =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  }

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'text-align:center;color:var(--text-muted);font-size:12px;padding:24px 12px;';
    empty.textContent = I18n.t('noUsers');
    list.appendChild(empty);
    return;
  }

  items.forEach(u => {
    const color = hashColor(u.id);
    const name = u.full_name || u.username || 'User';

    const item = document.createElement('div');
    item.className = 'user-item';
    if (state.selectedPartner?.id === u.id) item.classList.add('active');
    item.dataset.id = u.id;

    item.innerHTML = `
      <div class="avatar-md" style="background:${color}">${initials(name)}</div>
      <div class="user-item-body">
        <p class="user-item-name">${escapeHtml(name)}</p>
        <p class="user-item-user">@${escapeHtml(u.username || '')}</p>
      </div>
      <span class="user-item-dot"></span>
    `;

    item.addEventListener('click', () => selectPartner(u));
    list.appendChild(item);
  });
}

/* ---------- 14) Select partner ---------- */
async function selectPartner(partner) {
  state.selectedPartner = partner;

  // Save to recent chats
  Chats.touch(partner);

  // Mark active in list
  $$('.user-item').forEach(el => el.classList.toggle('active', el.dataset.id === partner.id));

  updatePartnerHeader();
  renderMessages();

  // Clean old send channel
  if (state.partnerSendChannel) {
    try { await supabaseClient.removeChannel(state.partnerSendChannel); } catch(_){}
    state.partnerSendChannel = null;
  }

  // Create new private send channel to partner
  state.partnerSendChannel = supabaseClient.channel(`inbox-${partner.id}`, {
    config: { private: true, broadcast: { self: false } }
  });

  state.partnerSendChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') console.log('[RT] send→', partner.id);
    else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
      console.warn('[RT] channel error:', status);
  });

  // On mobile, open the chat fullscreen
  if (state.isMobile) openMobileChat();

  $('#messageInput').focus();
}

function updatePartnerHeader() {
  const p = state.selectedPartner;
  if (!p) return;
  const name = p.full_name || p.username || 'User';
  const color = hashColor(p.id);
  const av = $('#partnerAvatar');
  av.textContent = initials(name);
  av.style.background = color;
  $('#partnerName').textContent = name;
  $('#partnerStatus').textContent = '@' + (p.username || '');
}

/* ---------- 15) Mobile chat open/close ---------- */
function openMobileChat() {
  const pane = $('#chatPane');
  pane.classList.add('mobile-open');
  $('#emptyState').classList.add('hidden');
  $('#activeChat').classList.remove('hidden');
}
function closeMobileChat() {
  const pane = $('#chatPane');
  pane.classList.remove('mobile-open');
  $('#activeChat').classList.add('hidden');
  $('#emptyState').classList.remove('hidden');
}

/* ---------- 16) Messages rendering ---------- */
function renderMessages() {
  const box = $('#messages');
  if (!box) return;
  box.innerHTML = '';
  const partner = state.selectedPartner;
  if (!partner) return;
  const msgs = state.conversations[partner.id] || [];
  msgs.forEach(m => box.appendChild(buildMessageEl(m)));
  requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
}

function buildMessageEl(msg) {
  const wrap = document.createElement('div');
  const mine = msg.from === state.user.id;
  wrap.className = `flex ${mine ? 'justify-end' : 'justify-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${mine ? 'msg-mine' : 'msg-theirs'}`;

  if (msg.type === 'text') {
    const t = document.createElement('div');
    t.textContent = msg.text || '';
    bubble.appendChild(t);
  }

  if (msg.type === 'image' && Array.isArray(msg.images)) {
    const grid = document.createElement('div');
    grid.className = 'grid gap-1.5';
    grid.style.gridTemplateColumns = msg.images.length === 1 ? '1fr' : '1fr 1fr';
    msg.images.forEach(src => {
      const im = document.createElement('img');
      im.src = src; im.alt = 'image'; im.loading = 'lazy';
      im.className = 'rounded-lg cursor-zoom-in max-h-64 object-cover';
      im.addEventListener('click', () => openLightbox(src));
      grid.appendChild(im);
    });
    bubble.appendChild(grid);
    if (msg.text) {
      const c = document.createElement('div');
      c.className = 'mt-1.5 text-sm';
      c.textContent = msg.text;
      bubble.appendChild(c);
    }
  }

  if (msg.type === 'audio' && msg.audio) {
    const aw = document.createElement('div');
    aw.className = 'audio-bubble';
    const a = document.createElement('audio');
    a.controls = true; a.src = msg.audio; a.preload = 'metadata';
    aw.appendChild(a);
    bubble.appendChild(aw);
    const d = document.createElement('div');
    d.className = 'text-[10px] opacity-70 mt-1';
    d.textContent = formatDuration(msg.duration || 0);
    bubble.appendChild(d);
  }

  const t = document.createElement('div');
  t.className = 'msg-time';
  t.textContent = formatTime(msg.timestamp);
  bubble.appendChild(t);

  wrap.appendChild(bubble);
  return wrap;
}

/* ---------- 17) Realtime ---------- */
function subscribeMyInbox() {
  if (state.myInboxChannel) {
    try { supabaseClient.removeChannel(state.myInboxChannel); } catch(_){}
    state.myInboxChannel = null;
  }

  const channel = supabaseClient.channel(`inbox-${state.user.id}`, {
    config: { private: true, broadcast: { self: false } }
  });

  channel.on('broadcast', { event: 'msg' }, ({ payload }) => handleIncomingMessage(payload));
  channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
    if (payload.to !== state.user.id) return;
    if (state.selectedPartner?.id !== payload.from) return;
    showTypingIndicator();
  });

  channel.subscribe(status => {
    console.log('[RT] my inbox:', status);
  });

  state.myInboxChannel = channel;
}

function handleIncomingMessage(msg) {
  if (!msg || msg.to !== state.user.id) return;
  const conv = state.conversations[msg.from] || (state.conversations[msg.from] = []);
  conv.push(msg);

  // If from current partner → append
  if (state.selectedPartner?.id === msg.from) {
    const box = $('#messages');
    if (box) {
      box.appendChild(buildMessageEl(msg));
      requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
    }
  } else {
    // Touch recent list so sender appears at top
    const senderProfile = state.users.find(u => u.id === msg.from);
    if (senderProfile) Chats.touch(senderProfile);
    renderUsersList();
    showToast(`💬 ${I18n.t('msgSent')}`, 'info', 2200);
  }
}

async function sendToPartner(payload) {
  if (!state.partnerSendChannel || !state.selectedPartner) {
    showToast(I18n.t('selectUser'), 'error');
    return false;
  }
  const full = {
    id: uuid(),
    from: state.user.id,
    to: state.selectedPartner.id,
    timestamp: Date.now(),
    ...payload
  };
  try {
    await state.partnerSendChannel.send({ type: 'broadcast', event: 'msg', payload: full });
    const conv = state.conversations[state.selectedPartner.id] || (state.conversations[state.selectedPartner.id] = []);
    conv.push(full);
    const box = $('#messages');
    if (box) {
      box.appendChild(buildMessageEl(full));
      requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
    }
    // Ensure partner is at top of recent list
    Chats.touch(state.selectedPartner);
    renderUsersList();
    return true;
  } catch (e) {
    console.error('send error:', e);
    showToast(I18n.t('msgFailed'), 'error');
    return false;
  }
}

/* ---------- 18) Typing ---------- */
function showTypingIndicator() {
  const bar = $('#typingBar'); if (!bar) return;
  bar.classList.remove('hidden');
  clearTimeout(showTypingIndicator._t);
  showTypingIndicator._t = setTimeout(() => bar.classList.add('hidden'), 1800);
}
async function emitTyping() {
  if (!state.partnerSendChannel || !state.selectedPartner) return;
  const now = Date.now();
  if (now - state.lastTypingSent < 900) return;
  state.lastTypingSent = now;
  try {
    await state.partnerSendChannel.send({
      type: 'broadcast', event: 'typing',
      payload: { from: state.user.id, to: state.selectedPartner.id, ts: now }
    });
  } catch(_){}
}

/* ---------- 19) Composer ---------- */
function initComposer() {
  const input = $('#messageInput');
  const counter = $('#charCounter');
  const sendBtn = $('#sendBtn');
  const emojiBtn = $('#emojiBtn');
  const emojiPanel = $('#emojiPanel');

  input.addEventListener('input', () => {
    const len = input.value.length;
    counter.textContent = `${len}/500`;
    counter.style.color = len >= 480 ? '#ef4444' : '';
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    if (len > 0) emitTyping();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendClick(); }
  });

  sendBtn.addEventListener('click', handleSendClick);

  const EMOJIS = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
    '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
    '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','😕',
    '👍','👎','👌','✌️','🤞','🤝','🙏','👏','🙌','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💯',
    '🔥','✨','⭐','🌟','💫','⚡','💥','🎉','🎊','🎁','🎈','🎯','🏆','🥇','🌈','☀️','🌙','⛅','☁️','❄️',
    '🍕','🍔','🍟','🌭','🍿','🍩','🍪','🎂','🍰','🍎','🍌','🍇','🍓','🍒','🍑','🥝','🍍','🥥','☕','🍵'];

  emojiPanel.innerHTML = '';
  EMOJIS.forEach(e => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = e;
    b.addEventListener('click', () => {
      input.value += e;
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
    emojiPanel.appendChild(b);
  });

  emojiBtn.addEventListener('click', e => {
    e.stopPropagation();
    emojiPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', e => {
    if (!emojiPanel.contains(e.target) && !emojiBtn.contains(e.target)) {
      emojiPanel.classList.add('hidden');
    }
  });
}

async function handleSendClick() {
  const input = $('#messageInput');
  const text = input.value.trim();

  if (state.pendingImages.length > 0) {
    const imgs = state.pendingImages.map(p => p.dataURL);
    const ok = await sendToPartner({ type: 'image', images: imgs, text: text || '' });
    if (ok) {
      state.pendingImages = [];
      renderPendingImages();
      showToast(I18n.t('imagesSent'), 'success', 1500);
    }
    input.value = ''; input.dispatchEvent(new Event('input'));
    return;
  }

  if (!text) return;
  if (text.length > 500) { showToast(I18n.t('msgTooLong'), 'error'); return; }

  const ok = await sendToPartner({ type: 'text', text });
  if (ok) { input.value = ''; input.dispatchEvent(new Event('input')); }
}

/* ---------- 20) Images ---------- */
function initImagePicker() {
  const btn = $('#imageBtn'), fi = $('#imageInput');
  btn.addEventListener('click', () => fi.click());
  fi.addEventListener('change', async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 5 - state.pendingImages.length;
    if (remaining <= 0) { showToast(I18n.t('tooManyImages'), 'error'); fi.value = ''; return; }
    const toDo = files.slice(0, remaining);
    if (files.length > remaining) showToast(I18n.t('tooManyImages'), 'info');
    for (const f of toDo) {
      try { state.pendingImages.push(await compressImage(f, 50 * 1024)); }
      catch { showToast(I18n.t('imageTooBig'), 'error'); }
    }
    renderPendingImages();
    fi.value = '';
  });
}

async function compressImage(file, maxBytes) {
  const src = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej;
    i.src = src;
  });

  let maxDim = 1600, quality = 0.85, out = null;
  for (let i = 0; i < 12; i++) {
    const r = drawJpeg(img, maxDim, quality);
    if (r.blob.size <= maxBytes) { out = r; break; }
    if (quality > 0.4) quality -= 0.12;
    else maxDim = Math.round(maxDim * 0.82);
    if (maxDim < 200) break;
  }
  if (!out) out = drawJpeg(img, 320, 0.4);
  if (out.blob.size > maxBytes * 1.15) throw new Error('too big');
  return out;
}

function drawJpeg(img, maxDim, quality) {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const dataURL = c.toDataURL('image/jpeg', quality);
  return { dataURL, blob: dataURLtoBlob(dataURL) };
}

function renderPendingImages() {
  const wrap = $('#pendingImages');
  wrap.innerHTML = '';
  if (!state.pendingImages.length) { wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');
  state.pendingImages.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'thumb';
    el.innerHTML = `<img src="${p.dataURL}" alt="preview" /><button type="button">×</button>`;
    el.querySelector('button').addEventListener('click', () => {
      state.pendingImages.splice(i, 1);
      renderPendingImages();
    });
    wrap.appendChild(el);
  });
}

/* ---------- 21) Audio ---------- */
function initAudioRecorder() {
  const mic = $('#micBtn'), bar = $('#recBar'), time = $('#recTime');
  const stop = $('#recStop'), cancel = $('#recCancel');

  mic.addEventListener('click', async () => {
    if (state.mediaRecorder?.state === 'recording') { stopRec(true); return; }
    await startRec();
  });
  stop.addEventListener('click', () => stopRec(true));
  cancel.addEventListener('click', () => stopRec(false));

  async function startRec() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 24000, echoCancellation: true, noiseSuppression: true }
      });
      const mime = pickMime();
      const opts = mime ? { mimeType: mime, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 };
      state.audioChunks = [];
      state.mediaRecorder = new MediaRecorder(stream, opts);

      state.mediaRecorder.ondataavailable = e => { if (e.data?.size) state.audioChunks.push(e.data); };
      state.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(state.recTimer); state.recTimer = null;
        const wasCancel = state._cancelRec; state._cancelRec = false;
        if (wasCancel || !state.audioChunks.length) { state.audioChunks = []; return; }
        const blob = new Blob(state.audioChunks, { type: mime || 'audio/webm' });
        state.audioChunks = [];
        if (state.recSeconds < 1) return;
        const dataURL = await blobToDataURL(blob);
        const ok = await sendToPartner({ type: 'audio', audio: dataURL, duration: state.recSeconds });
        if (ok) showToast(I18n.t('audioSent'), 'success', 1500);
      };

      state._cancelRec = false;
      state.recSeconds = 0;
      time.textContent = '0:00';
      bar.classList.remove('hidden'); bar.classList.add('flex');

      state.mediaRecorder.start(250);
      state.recTimer = setInterval(() => {
        state.recSeconds++;
        time.textContent = formatDuration(state.recSeconds);
        if (state.recSeconds >= 60) { showToast(I18n.t('audioTooLong'), 'info', 1500); stopRec(true); }
      }, 1000);
    } catch { showToast(I18n.t('micError'), 'error'); }
  }

  function stopRec(shouldSend) {
    if (!state.mediaRecorder) return;
    state._cancelRec = !shouldSend;
    try { state.mediaRecorder.stop(); } catch(_){}
    state.mediaRecorder = null;
    bar.classList.add('hidden'); bar.classList.remove('flex');
  }
}

function pickMime() {
  const c = ['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/webm','audio/mp4','audio/ogg'];
  for (const m of c) if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  return '';
}
function blobToDataURL(b) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej;
    r.readAsDataURL(b);
  });
}

/* ---------- 22) Lightbox ---------- */
function openLightbox(src) {
  const lb = $('#lightbox');
  $('#lightboxImg').src = src;
  lb.classList.remove('hidden');
}
function initLightbox() {
  const lb = $('#lightbox');
  lb.addEventListener('click', () => { lb.classList.add('hidden'); $('#lightboxImg').src = ''; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.add('hidden'); });
}

/* ---------- 23) Sidebar interactions ---------- */
function initSidebar() {
  $('#searchUsers').addEventListener('input', () => renderUsersList());

  $('#logoutBtn').addEventListener('click', async () => {
    try { await Auth.signOut(); showToast(I18n.t('logoutSuccess'), 'info'); }
    catch (e) { showToast('Logout failed: ' + e.message, 'error'); }
  });

  $('#backBtn').addEventListener('click', () => closeMobileChat());

  window.addEventListener('resize', () => {
    const nowMobile = window.innerWidth < 1024;
    if (nowMobile !== state.isMobile) {
      state.isMobile = nowMobile;
      if (!nowMobile) {
        $('#chatPane').classList.remove('mobile-open');
        // On desktop: if no partner, show empty state
        if (!state.selectedPartner) {
          $('#activeChat').classList.add('hidden');
          $('#emptyState').classList.remove('hidden');
        }
      } else {
        // On mobile: if no partner, ensure chat is hidden
        if (!state.selectedPartner) closeMobileChat();
      }
    }
  });
}

/* ---------- 24) Bootstrap ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  initLanguage();
  initAuthTabs();
  initAuthForms();
  initAgeValidation();
  initComposer();
  initImagePicker();
  initAudioRecorder();
  initSidebar();
  initLightbox();

  $('#themeToggle').addEventListener('click', Theme.toggle);

  showAuthView();
  initAuthListener();

  document.addEventListener('i18n:changed', () => {
    renderUsersList();
    renderMessages();
    updatePartnerHeader();
  });

  console.log('%cSirrApp','color:#6366f1;font-weight:bold;font-size:14px;','— ready ✨');
});

window.addEventListener('beforeunload', () => {
  cleanupRealtime();
  if (state.mediaRecorder?.state === 'recording') { try { state.mediaRecorder.stop(); } catch(_){} }
  clearInterval(state.recTimer);
});
