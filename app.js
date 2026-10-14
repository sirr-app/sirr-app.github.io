/* ============================================================
   SirrApp — المنطق البرمجي الشامل (Vanilla JavaScript)
   ============================================================
   المزايا:
   - مصادقة Supabase Auth (تسجيل/دخول/خروج) مع تحقق العمر >= 16
   - قائمة المستخدمين + بروفايل شخصي + بحث
   - دردشة فردية لحظية عبر Supabase Realtime Broadcast (بدون تخزين)
   - قنوات Realtime خاصة (private: true) محمية بـ RLS
   - رسائل نصية ≤ 500 حرف + Emojis + عداد
   - رسائل صوتية ≤ 60 ثانية + ضغط Opus في المتصفح
   - صور ≤ 5 في المرة الواحدة + ضغط تحت 50KB لكل صورة
   - تبديل Dark/Light + تبديل اللغة (ar/en/fr)
   ============================================================ */

/* ============================================================
   1) الحالة العامة
   ============================================================ */
const state = {
  user: null,              // بيانات المصادقة
  profile: null,           // بيانات الملف الشخصي
  users: [],               // قائمة المستخدمين الآخرين
  filteredUsers: [],
  selectedPartner: null,   // المستخدم المحدد في المحادثة
  myInboxChannel: null,    // قناة الوارد الخاصة بي
  partnerSendChannel: null,// قناة الإرسال إلى الشريك الحالي
  conversations: {},       // { partnerId: [msg, ...] }
  pendingImages: [],       // الصور المضغوطة قبل الإرسال
  mediaRecorder: null,
  audioChunks: [],
  recTimer: null,
  recSeconds: 0,
  typingTimeout: null,
  lastTypingSent: 0,
  audioContext: null
};

/* ============================================================
   2) أدوات مساعدة عامة
   ============================================================ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** توليد UUID بسيط */
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** تنسيق الوقت */
function formatTime(ts) {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/** تنسيق مدة صوتية (ثانية → m:ss) */
function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Hash لون من نص */
function hashColor(str) {
  const palette = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
    '#10b981', '#06b6d4', '#0ea5e9', '#14b8a6', '#a855f7'
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

/** استخراج الأحرف الأولى من الاسم */
function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** تحويل dataURL إلى Blob */
function dataURLtoBlob(dataURL) {
  const [meta, b64] = dataURL.split(',');
  const mime = meta.match(/:(.*?);/)[1];
  const bin = atob(b64);
  const len = bin.length;
  const u8 = new Uint8Array(len);
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}

/* ============================================================
   3) نظام الإشعارات (Toast)
   ============================================================ */
function showToast(message, type = 'info', duration = 3000) {
  const container = $('#toasts');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  }, duration);
}

/* ============================================================
   4) إدارة الوضع الليلي/النهاري
   ============================================================ */
const Theme = (() => {
  const KEY = 'sirrapp-theme';
  let current = localStorage.getItem(KEY);

  function systemPref() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(mode) {
    const useDark = mode === 'dark';
    document.documentElement.classList.toggle('dark', useDark);
    $('#iconSun')?.classList.toggle('hidden', !useDark);
    $('#iconMoon')?.classList.toggle('hidden', useDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', useDark ? '#0f172a' : '#4f46e5');
  }

  function init() {
    if (!current) current = systemPref();
    apply(current);
    localStorage.setItem(KEY, current);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(KEY + '-manual')) {
        current = e.matches ? 'dark' : 'light';
        apply(current);
      }
    });
  }

  function toggle() {
    current = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(KEY, current);
    localStorage.setItem(KEY + '-manual', '1');
    apply(current);
    showToast(I18n.t(current === 'dark' ? 'darkMode' : 'lightMode'), 'info', 1500);
  }

  return { init, toggle };
})();

/* ============================================================
   5) إدارة اللغة
   ============================================================ */
function initLanguage() {
  const select = $('#langSelect');
  const saved = localStorage.getItem('sirrapp-lang') || 'ar';
  select.value = saved;

  select.addEventListener('change', e => {
    I18n.setLang(e.target.value);
    renderUsersList();
    renderMessages();
    updatePartnerHeader();
  });
}

/* ============================================================
   6) المصادقة (Auth)
   ============================================================ */
const Auth = {
  async signUp({ email, password, username, fullName, age, phone }) {
    if (!email || !password || !username || !fullName || !age) {
      throw new Error(I18n.t('fillAllFields'));
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(I18n.t('invalidEmail'));
    }
    if (password.length < 6) {
      throw new Error(I18n.t('passwordMin'));
    }
    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      throw new Error(I18n.t('usernameInvalid'));
    }
    const ageNum = parseInt(age, 10);
    if (!Number.isFinite(ageNum) || ageNum < 16 || ageNum > 120) {
      throw new Error(I18n.t('ageInvalid'));
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name: fullName,
          age: ageNum,
          phone: phone || null
        },
        emailRedirectTo: window.location.href
      }
    });
    if (error) throw error;

    if (data.session && data.user) {
      await Profile.upsert({
        id: data.user.id,
        email,
        username,
        full_name: fullName,
        age: ageNum,
        phone: phone || null
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

  async signOut() {
    await supabaseClient.auth.signOut();
  }
};

/* ============================================================
   7) الملف الشخصي (Profiles)
   ============================================================ */
const Profile = {
  async get(userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsert(profile) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async listExcept(userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, email, username, full_name, age, phone, avatar_url, created_at')
      .neq('id', userId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  },

  async ensureFromMetadata(user) {
    let prof = await Profile.get(user.id);
    if (prof) return prof;

    const meta = user.user_metadata || {};
    const newProfile = {
      id: user.id,
      email: user.email,
      username: meta.username || `user_${user.id.slice(0, 8)}`,
      full_name: meta.full_name || 'User',
      age: parseInt(meta.age, 10) || 16,
      phone: meta.phone || null
    };
    try {
      prof = await Profile.upsert(newProfile);
    } catch (e) {
      console.warn('Profile auto-create failed:', e.message);
      prof = newProfile;
    }
    return prof;
  }
};

/* ============================================================
   8) إدارة الواجهة (Views)
   ============================================================ */
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

/* ============================================================
   9) تبويبات الدخول/التسجيل
   ============================================================ */
function initAuthTabs() {
  const tabLogin  = $('#tabLogin');
  const tabSignup = $('#tabSignup');
  const formLogin = $('#loginForm');
  const formSignup = $('#signupForm');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('tab-active');
    tabSignup.classList.remove('tab-active');
    formLogin.classList.remove('hidden');
    formSignup.classList.add('hidden');
  });
  tabSignup.addEventListener('click', () => {
    tabSignup.classList.add('tab-active');
    tabLogin.classList.remove('tab-active');
    formSignup.classList.remove('hidden');
    formLogin.classList.add('hidden');
  });
}

/* ============================================================
   10) عرض رسائل النماذج (نجاح/خطأ)
   ============================================================ */
function showFormMsg(el, text, type = 'info') {
  el.textContent = text;
  el.className = `text-sm text-center rounded-xl px-3 py-2 form-msg ${type}`;
  el.classList.remove('hidden');
}
function hideFormMsg(el) {
  el.classList.add('hidden');
}

/* ============================================================
   11) التحقق من العمر أثناء الكتابة
   ============================================================ */
function initAgeValidation() {
  const ageInput = $('#suAge');
  const warning = $('#ageWarning');
  const submitBtn = $('#signupBtn');

  ageInput.addEventListener('input', () => {
    const v = parseInt(ageInput.value, 10);
    if (Number.isFinite(v) && v < 16) {
      warning.classList.remove('hidden');
      submitBtn.disabled = true;
    } else {
      warning.classList.add('hidden');
      submitBtn.disabled = false;
    }
  });
}

/* ============================================================
   12) نماذج الدخول والتسجيل
   ============================================================ */
function initAuthForms() {
  // ----- الدخول -----
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#loginMsg');
    hideFormMsg(msg);
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      await Auth.signIn($('#loginEmail').value.trim(), $('#loginPassword').value);
      showFormMsg(msg, I18n.t('loginSuccess'), 'success');
    } catch (err) {
      showFormMsg(msg, I18n.t('loginFailed') + (err.message || ''), 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // ----- التسجيل -----
  $('#signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#signupMsg');
    hideFormMsg(msg);
    const btn = $('#signupBtn');
    btn.disabled = true;

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

      if (res.session) {
        showFormMsg(msg, I18n.t('signupSuccess'), 'success');
      } else {
        showFormMsg(msg, I18n.t('signupNeedConfirm'), 'info');
        $('#signupForm').reset();
      }
    } catch (err) {
      showFormMsg(msg, I18n.t('signupFailed') + (err.message || ''), 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

/* ============================================================
   13) إدارة الجلسة (Auth State)
   ============================================================ */
function initAuthListener() {
  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      state.user = null;
      state.profile = null;
      cleanupRealtime();
      showAuthView();
      return;
    }

    if (session?.user) {
      state.user = session.user;
      try {
        state.profile = await Profile.ensureFromMetadata(session.user);
      } catch (e) {
        console.warn('Profile fetch failed:', e);
        state.profile = { id: session.user.id, username: session.user.email, full_name: 'User' };
      }
      await onLoggedIn();
    }
  });
}

/** تُنفذ بعد نجاح تسجيل الدخول */
async function onLoggedIn() {
  showChatView();
  renderMyProfile();
  await loadUsers();
  subscribeMyInbox();
}

/* ============================================================
   14) تنظيف قنوات Realtime
   ============================================================ */
async function cleanupRealtime() {
  if (state.myInboxChannel) {
    try { await supabaseClient.removeChannel(state.myInboxChannel); } catch (_) {}
    state.myInboxChannel = null;
  }
  if (state.partnerSendChannel) {
    try { await supabaseClient.removeChannel(state.partnerSendChannel); } catch (_) {}
    state.partnerSendChannel = null;
  }
}

/* ============================================================
   15) عرض البروفايل الشخصي في الشريط الجانبي
   ============================================================ */
function renderMyProfile() {
  const p = state.profile || {};
  const name = p.full_name || p.username || 'User';
  const color = hashColor(p.id || p.username || 'me');

  const myAvatar = $('#myAvatar');
  myAvatar.textContent = initials(name);
  myAvatar.style.background = color;

  const userAvatar = $('#userAvatar');
  userAvatar.textContent = initials(name);
  userAvatar.style.background = color;

  $('#myName').textContent = name;
  $('#myUsername').textContent = '@' + (p.username || 'user');
}

/* ============================================================
   16) تحميل وعرض قائمة المستخدمين
   ============================================================ */
async function loadUsers() {
  try {
    state.users = await Profile.listExcept(state.user.id);
    state.filteredUsers = [...state.users];
    renderUsersList();
  } catch (e) {
    console.error('loadUsers error:', e);
    showToast('Failed to load users: ' + e.message, 'error');
  }
}

function renderUsersList() {
  const list = $('#usersList');
  const q = ($('#searchUsers').value || '').trim().toLowerCase();

  state.filteredUsers = state.users.filter(u => {
    if (!q) return true;
    return (u.username || '').toLowerCase().includes(q)
        || (u.full_name || '').toLowerCase().includes(q)
        || (u.email || '').toLowerCase().includes(q);
  });

  list.innerHTML = '';

  if (state.filteredUsers.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'text-center text-xs text-slate-400 py-6 px-3';
    empty.textContent = I18n.t('noUsers');
    list.appendChild(empty);
    return;
  }

  state.filteredUsers.forEach(u => {
    const color = hashColor(u.id);
    const name = u.full_name || u.username || 'User';

    const item = document.createElement('div');
    item.className = 'user-item';
    if (state.selectedPartner?.id === u.id) item.classList.add('active');
    item.dataset.id = u.id;

    item.innerHTML = `
      <div class="w-10 h-10 rounded-full grid place-items-center text-white text-xs font-bold shrink-0"
           style="background:${color}">${initials(name)}</div>
      <div class="min-w-0 flex-1">
        <p class="font-semibold text-sm truncate">${escapeHtml(name)}</p>
        <p class="text-xs text-slate-500 dark:text-slate-400 truncate">@${escapeHtml(u.username || '')}</p>
      </div>
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
    `;

    item.addEventListener('click', () => selectPartner(u));
    list.appendChild(item);
  });
}

/** تهريب HTML لمنع الحقن */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

/* ============================================================
   17) تحديد الشريك وفتح المحادثة
   ============================================================ */
async function selectPartner(partner) {
  state.selectedPartner = partner;

  $$('.user-item').forEach(el => el.classList.toggle('active', el.dataset.id === partner.id));

  $('#emptyState').classList.add('hidden');
  $('#activeChat').classList.remove('hidden');
  $('#activeChat').classList.add('flex');

  updatePartnerHeader();
  renderMessages();

  if (window.innerWidth < 1024) {
    $('#sidebar').classList.add('hidden');
    $('#chatPane').classList.remove('hidden');
  }

  // تنظيف قناة الإرسال القديمة وإنشاء جديدة (خاصة + محمية بـ RLS)
  if (state.partnerSendChannel) {
    try { await supabaseClient.removeChannel(state.partnerSendChannel); } catch (_) {}
    state.partnerSendChannel = null;
  }

  state.partnerSendChannel = supabaseClient.channel(`inbox-${partner.id}`, {
    config: {
      private: true,          // ← تفعيل RLS على القناة
      broadcast: { self: false }
    }
  });

  state.partnerSendChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('[Realtime] Subscribed to partner inbox:', partner.id);
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      console.warn('[Realtime] Partner channel error:', status);
      showToast('Realtime connection issue. Retrying...', 'error', 2500);
    }
  });

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

/* ============================================================
   18) عرض الرسائل
   ============================================================ */
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

/** بناء عنصر رسالة */
function buildMessageEl(msg) {
  const wrap = document.createElement('div');
  const mine = msg.from === state.user.id;
  wrap.className = `flex ${mine ? 'justify-end' : 'justify-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${mine ? 'msg-mine' : 'msg-theirs'}`;

  // نص
  if (msg.type === 'text') {
    const txt = document.createElement('div');
    txt.textContent = msg.text || '';
    bubble.appendChild(txt);
  }

  // صور
  if (msg.type === 'image' && Array.isArray(msg.images)) {
    const grid = document.createElement('div');
    grid.className = 'grid gap-1.5';
    grid.style.gridTemplateColumns = msg.images.length === 1 ? '1fr' : '1fr 1fr';
    msg.images.forEach(src => {
      const im = document.createElement('img');
      im.src = src;
      im.alt = 'image';
      im.loading = 'lazy';
      im.className = 'rounded-lg cursor-zoom-in max-h-64 object-cover';
      im.addEventListener('click', () => openLightbox(src));
      grid.appendChild(im);
    });
    bubble.appendChild(grid);

    if (msg.text) {
      const cap = document.createElement('div');
      cap.className = 'mt-1.5 text-sm';
      cap.textContent = msg.text;
      bubble.appendChild(cap);
    }
  }

  // صوت
  if (msg.type === 'audio' && msg.audio) {
    const audioWrap = document.createElement('div');
    audioWrap.className = 'audio-bubble';
    const play = document.createElement('div');
    play.className = 'w-8 h-8 rounded-full grid place-items-center bg-white/25 shrink-0';
    play.innerHTML = `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.src = msg.audio;
    audio.preload = 'metadata';
    audioWrap.appendChild(play);
    audioWrap.appendChild(audio);
    bubble.appendChild(audioWrap);

    const dur = document.createElement('div');
    dur.className = 'text-[10px] opacity-70 mt-1';
    dur.textContent = formatDuration(msg.duration || 0);
    bubble.appendChild(dur);
  }

  // وقت
  const time = document.createElement('div');
  time.className = `text-[10px] mt-1 ${mine ? 'text-white/70 text-end' : 'text-slate-400 text-end'}`;
  time.textContent = formatTime(msg.timestamp);
  bubble.appendChild(time);

  wrap.appendChild(bubble);
  return wrap;
}

/* ============================================================
   19) إرسال واستقبال الرسائل (Realtime Broadcast — بدون تخزين)
   ============================================================ */

/** الاشتراك في صندوق الوارد الخاص بي (قناة خاصة محمية بـ RLS) */
function subscribeMyInbox() {
  if (state.myInboxChannel) {
    try { supabaseClient.removeChannel(state.myInboxChannel); } catch (_) {}
    state.myInboxChannel = null;
  }

  const channel = supabaseClient.channel(`inbox-${state.user.id}`, {
    config: {
      private: true,              // ← إجباري لتفعيل RLS
      broadcast: { self: false }
    }
  });

  channel.on('broadcast', { event: 'msg' }, ({ payload }) => {
    handleIncomingMessage(payload);
  });

  channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
    if (payload.to !== state.user.id) return;
    if (state.selectedPartner?.id !== payload.from) return;
    showTypingIndicator();
  });

  channel.subscribe((status) => {
    console.log('[Realtime] My inbox status:', status);
    if (status === 'CHANNEL_ERROR') {
      console.warn('[Realtime] Inbox subscription error — check RLS policies.');
      showToast('Realtime connection error. Please refresh.', 'error', 4000);
    }
  });

  state.myInboxChannel = channel;
}

/** معالجة رسالة واردة */
function handleIncomingMessage(msg) {
  if (!msg || msg.to !== state.user.id) return;

  const conv = state.conversations[msg.from] || (state.conversations[msg.from] = []);
  conv.push(msg);

  if (state.selectedPartner?.id === msg.from) {
    const box = $('#messages');
    if (box) {
      box.appendChild(buildMessageEl(msg));
      requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
    }
  } else {
    showToast(`💬 ${I18n.t('msgSent')} — ${msg.from.slice(0, 6)}`, 'info', 2500);
  }
}

/** إرسال رسالة إلى الشريك */
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
    const res = await state.partnerSendChannel.send({
      type: 'broadcast',
      event: 'msg',
      payload: full
    });

    if (res !== 'ok' && res?.status !== 'ok') {
      console.warn('[send] unexpected response:', res);
    }

    const conv = state.conversations[state.selectedPartner.id] || (state.conversations[state.selectedPartner.id] = []);
    conv.push(full);
    const box = $('#messages');
    if (box) {
      box.appendChild(buildMessageEl(full));
      requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
    }
    return true;
  } catch (e) {
    console.error('[send] error:', e);
    showToast(I18n.t('msgFailed'), 'error');
    return false;
  }
}

/* ============================================================
   20) مؤشر الكتابة
   ============================================================ */
function showTypingIndicator() {
  const bar = $('#typingBar');
  if (!bar) return;
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
      type: 'broadcast',
      event: 'typing',
      payload: { from: state.user.id, to: state.selectedPartner.id, ts: now }
    });
  } catch (_) { /* صامت */ }
}

/* ============================================================
   21) صندوق الكتابة: عدّاد + Emojis + إرسال
   ============================================================ */
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
    input.style.height = Math.min(input.scrollHeight, 128) + 'px';

    if (len > 0) emitTyping();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  });

  sendBtn.addEventListener('click', handleSendClick);

  const EMOJIS = [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙',
    '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
    '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','😕',
    '👍','👎','👌','✌️','🤞','🤝','🙏','👏','🙌','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💯',
    '🔥','✨','⭐','🌟','💫','⚡','💥','🎉','🎊','🎁','🎈','🎯','🏆','🥇','🌈','☀️','🌙','⛅','☁️','❄️',
    '🍕','🍔','🍟','🌭','🍿','🍩','🍪','🎂','🍰','🍎','🍌','🍇','🍓','🍒','🍑','🥝','🍍','🥥','☕','🍵'
  ];

  emojiPanel.innerHTML = '';
  EMOJIS.forEach(e => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = e;
    b.addEventListener('click', () => {
      input.value += e;
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
    emojiPanel.appendChild(b);
  });

  emojiBtn.addEventListener('click', () => {
    emojiPanel.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!emojiPanel.contains(e.target) && e.target !== emojiBtn && !emojiBtn.contains(e.target)) {
      emojiPanel.classList.add('hidden');
    }
  });
}

/** التعامل مع زر الإرسال (نص + صور) */
async function handleSendClick() {
  const input = $('#messageInput');
  const text = input.value.trim();

  if (state.pendingImages.length > 0) {
    const imgs = state.pendingImages.map(p => p.dataURL);
    const ok = await sendToPartner({ type: 'image', images: imgs, text: text || '' });
    if (ok) {
      state.pendingImages = [];
      renderPendingImages();
      showToast(I18n.t('imagesSent'), 'success', 1800);
    }
    input.value = '';
    input.dispatchEvent(new Event('input'));
    return;
  }

  if (!text) return;
  if (text.length > 500) {
    showToast(I18n.t('msgTooLong'), 'error');
    return;
  }

  const ok = await sendToPartner({ type: 'text', text });
  if (ok) {
    input.value = '';
    input.dispatchEvent(new Event('input'));
  }
}

/* ============================================================
   22) اختيار الصور وضغطها تحت 50KB
   ============================================================ */
function initImagePicker() {
  const btn = $('#imageBtn');
  const fileInput = $('#imageInput');

  btn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 5 - state.pendingImages.length;
    if (remaining <= 0) {
      showToast(I18n.t('tooManyImages'), 'error');
      fileInput.value = '';
      return;
    }

    const toProcess = files.slice(0, remaining);
    if (files.length > remaining) showToast(I18n.t('tooManyImages'), 'info');

    for (const file of toProcess) {
      try {
        const compressed = await compressImage(file, 50 * 1024);
        state.pendingImages.push(compressed);
      } catch (err) {
        console.error('Image compress error:', err);
        showToast(I18n.t('imageTooBig'), 'error');
      }
    }

    renderPendingImages();
    fileInput.value = '';
  });
}

/** ضغط صورة تحت الحد المطلوب (بالبايت) */
async function compressImage(file, maxBytes) {
  const dataURL = await fileToDataURL(file);
  const img = await loadImage(dataURL);

  let maxDim = 1600;
  let quality = 0.85;
  let result = null;

  for (let attempt = 0; attempt < 12; attempt++) {
    const { canvas, blob, dataURL: out } = await drawAndExport(img, maxDim, quality);

    if (blob.size <= maxBytes) {
      result = { dataURL: out, size: blob.size, width: canvas.width, height: canvas.height };
      break;
    }

    if (quality > 0.4) quality -= 0.12;
    else maxDim = Math.round(maxDim * 0.82);

    if (maxDim < 200) break;
  }

  if (!result) {
    const { canvas, blob, dataURL: out } = await drawAndExport(img, 320, 0.4);
    result = { dataURL: out, size: blob.size, width: canvas.width, height: canvas.height };
  }

  if (result.size > maxBytes * 1.15) {
    throw new Error('cannot compress under 50KB');
  }

  return result;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

function drawAndExport(img, maxDim, quality) {
  return new Promise((resolve) => {
    let w = img.width;
    let h = img.height;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const out = canvas.toDataURL('image/jpeg', quality);
    const blob = dataURLtoBlob(out);

    resolve({ canvas, blob, dataURL: out });
  });
}

/** عرض الصور المعلقة قبل الإرسال */
function renderPendingImages() {
  const wrap = $('#pendingImages');
  wrap.innerHTML = '';
  if (state.pendingImages.length === 0) {
    wrap.classList.add('hidden');
    return;
  }
  wrap.classList.remove('hidden');

  state.pendingImages.forEach((p, idx) => {
    const el = document.createElement('div');
    el.className = 'thumb';
    el.innerHTML = `
      <img src="${p.dataURL}" alt="preview" />
      <button type="button" aria-label="remove">×</button>
    `;
    el.querySelector('button').addEventListener('click', () => {
      state.pendingImages.splice(idx, 1);
      renderPendingImages();
    });
    wrap.appendChild(el);
  });
}

/* ============================================================
   23) تسجيل الصوت (حتى 60 ثانية) مع ضغط Opus
   ============================================================ */
function initAudioRecorder() {
  const micBtn = $('#micBtn');
  const recBar = $('#recBar');
  const recTime = $('#recTime');
  const recStop = $('#recStop');
  const recCancel = $('#recCancel');

  micBtn.addEventListener('click', async () => {
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
      stopRecording(true);
      return;
    }
    await startRecording();
  });

  recStop.addEventListener('click', () => stopRecording(true));
  recCancel.addEventListener('click', () => stopRecording(false));

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      const mime = pickAudioMime();
      const options = mime
        ? { mimeType: mime, audioBitsPerSecond: 24000 }
        : { audioBitsPerSecond: 24000 };

      state.audioChunks = [];
      state.mediaRecorder = new MediaRecorder(stream, options);

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) state.audioChunks.push(e.data);
      };

      state.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(state.recTimer);
        state.recTimer = null;

        const wasCancel = state._cancelRecording;
        state._cancelRecording = false;

        if (wasCancel || state.audioChunks.length === 0) {
          state.audioChunks = [];
          return;
        }

        const blob = new Blob(state.audioChunks, { type: mime || 'audio/webm' });
        state.audioChunks = [];

        if (state.recSeconds < 1) return;

        const dataURL = await blobToDataURL(blob);

        const ok = await sendToPartner({
          type: 'audio',
          audio: dataURL,
          duration: state.recSeconds,
          mime: mime || 'audio/webm'
        });

        if (ok) showToast(I18n.t('audioSent'), 'success', 1500);
      };

      state._cancelRecording = false;
      state.recSeconds = 0;
      recTime.textContent = '0:00';
      recBar.classList.remove('hidden');
      recBar.classList.add('flex');

      state.mediaRecorder.start(250);
      showToast(I18n.t('recordingStarted'), 'info', 1500);

      state.recTimer = setInterval(() => {
        state.recSeconds++;
        recTime.textContent = formatDuration(state.recSeconds);
        if (state.recSeconds >= 60) {
          showToast(I18n.t('audioTooLong'), 'info', 1500);
          stopRecording(true);
        }
      }, 1000);

    } catch (err) {
      console.error('Recording error:', err);
      showToast(I18n.t('micError'), 'error');
    }
  }

  function stopRecording(shouldSend) {
    if (!state.mediaRecorder) return;
    state._cancelRecording = !shouldSend;
    try {
      state.mediaRecorder.stop();
    } catch (e) { /* ignore */ }
    state.mediaRecorder = null;

    recBar.classList.add('hidden');
    recBar.classList.remove('flex');
    if (!shouldSend) showToast(I18n.t('recordingCanceled'), 'info', 1500);
    else showToast(I18n.t('recordingStopped'), 'info', 1200);
  }
}

/** اختيار أفضل صيغة صوتية مدعومة */
function pickAudioMime() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg'
  ];
  for (const c of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/* ============================================================
   24) عرض الصور بالحجم الكامل (Lightbox)
   ============================================================ */
function openLightbox(src) {
  const lb = $('#lightbox');
  $('#lightboxImg').src = src;
  lb.classList.remove('hidden');
}
function initLightbox() {
  const lb = $('#lightbox');
  lb.addEventListener('click', () => {
    lb.classList.add('hidden');
    $('#lightboxImg').src = '';
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') lb.classList.add('hidden');
  });
}

/* ============================================================
   25) الشريط الجانبي: بحث + خروج + زر الرجوع
   ============================================================ */
function initSidebar() {
  $('#searchUsers').addEventListener('input', () => renderUsersList());

  $('#logoutBtn').addEventListener('click', async () => {
    try {
      await Auth.signOut();
      showToast(I18n.t('logoutSuccess'), 'info');
    } catch (e) {
      showToast('Logout failed: ' + e.message, 'error');
    }
  });

  $('#backBtn').addEventListener('click', () => {
    if (window.innerWidth < 1024) {
      $('#sidebar').classList.remove('hidden');
      $('#chatPane').classList.add('hidden');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      $('#sidebar').classList.remove('hidden');
      $('#chatPane').classList.remove('hidden');
    }
  });
}

/* ============================================================
   26) التهيئة النهائية
   ============================================================ */
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

  console.log('%cSirrApp','color:#6366f1;font-weight:bold;font-size:14px;','— ready ✅');
});

/* تنظيف عند إغلاق الصفحة */
window.addEventListener('beforeunload', () => {
  cleanupRealtime();
  if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
    try { state.mediaRecorder.stop(); } catch (_) {}
  }
  clearInterval(state.recTimer);
});
