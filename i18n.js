/* ============================================================
   SirrApp — نظام الترجمة متعدد اللغات (i18n)
   العربية (RTL) | English (LTR) | Français (LTR)
   ============================================================ */

const TRANSLATIONS = {
  /* ================= العربية ================= */
  ar: {
    _dir: 'rtl',
    _name: 'العربية',

    appName: 'SirrApp',
    tagline: 'دردشة فردية فورية',
    themeTitle: 'تبديل المظهر',
    logout: 'تسجيل الخروج',

    // Auth
    welcome: 'مرحباً بك في SirrApp',
    authSubtitle: 'دردشة فردية فورية — بدون تخزين للرسائل',
    loginTab: 'تسجيل الدخول',
    signupTab: 'حساب جديد',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginBtn: 'دخول',
    signupBtn: 'إنشاء الحساب',
    fullName: 'الاسم واللقب',
    username: 'اسم المستخدم',
    age: 'العمر',
    phone: 'رقم الهاتف',
    optional: '(اختياري)',
    ageError: 'يجب أن يكون عمرك 16 عاماً أو أكثر لاستخدام SirrApp.',
    privacyNote: '🔒 لا يتم تخزين محتوى رسائلك على السيرفر — تُنقل مباشرة عبر WebSockets.',

    // Chat
    online: 'متصل',
    searchUsers: 'ابحث عن مستخدم...',
    ephemeralNote: '⚡ الرسائل مؤقتة ولا تُخزَّن — تختفي عند إغلاق الصفحة.',
    selectChatTitle: 'اختر محادثة للبدء',
    selectChatDesc: 'اختر مستخدماً من القائمة لبدء دردشة فردية فورية ومشفّرة.',
    e2eBadge: 'قناة مباشرة',
    typing: 'يكتب الآن...',
    recordingHint: 'جارٍ التسجيل... (الحد الأقصى 60 ثانية)',
    cancel: 'إلغاء',
    send: 'إرسال',
    emoji: 'الرموز التعبيرية',
    sendImages: 'إرسال صور',
    typeMessage: 'اكتب رسالتك...',
    recordVoice: 'تسجيل رسالة صوتية',

    // Toasts & Alerts
    fillAllFields: 'يرجى تعبئة جميع الحقول الإجبارية.',
    invalidEmail: 'البريد الإلكتروني غير صالح.',
    passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    usernameInvalid: 'اسم المستخدم يجب أن يكون بين 3 و20 حرفاً (أحرف إنجليزية، أرقام، أو _).',
    ageInvalid: 'يجب أن يكون عمرك 16 عاماً أو أكثر.',
    signupSuccess: '✅ تم إنشاء الحساب بنجاح! جارٍ تسجيل دخولك...',
    signupNeedConfirm: '📧 تم إنشاء الحساب! يرجى تأكيد بريدك الإلكتروني ثم تسجيل الدخول.',
    signupFailed: 'فشل إنشاء الحساب: ',
    loginSuccess: '✅ تم تسجيل الدخول بنجاح!',
    loginFailed: 'فشل تسجيل الدخول: ',
    logoutSuccess: '👋 تم تسجيل الخروج.',
    userNotFound: 'لم يتم العثور على المستخدم.',
    noUsers: 'لا يوجد مستخدمون متاحون حالياً.',
    selectUser: 'اختر مستخدماً لبدء المحادثة.',
    msgSent: 'تم إرسال الرسالة',
    msgFailed: 'فشل إرسال الرسالة',
    imageCompressed: 'تم ضغط الصورة',
    imageTooBig: 'تعذّر ضغط الصورة تحت 50KB.',
    tooManyImages: 'يمكنك إرسال 5 صور كحد أقصى.',
    imagesSent: 'تم إرسال الصور',
    recordingStarted: '🔴 بدأ التسجيل...',
    recordingStopped: '⏹️ تم إيقاف التسجيل',
    recordingCanceled: 'تم إلغاء التسجيل',
    audioTooLong: '⏱️ الحد الأقصى للتسجيل 60 ثانية.',
    micError: 'تعذّر الوصول إلى الميكروفون.',
    audioSent: 'تم إرسال الرسالة الصوتية',
    msgTooLong: 'الرسالة طويلة جداً (الحد 500 حرف).',
    copied: 'تم النسخ',
    lightMode: 'الوضع النهاري',
    darkMode: 'الوضع الليلي',
    you: 'أنت',
    today: 'اليوم',
    yesterday: 'أمس'
    recent: 'المحادثات الأخيرة',
    searchResults: 'نتائج البحث',
    noRecentTitle: 'لا محادثات بعد',
    noRecentDesc: 'ابحث عن مستخدم باسمه لبدء الدردشة.',
  },

  /* ================= English ================= */
  en: {
    _dir: 'ltr',
    _name: 'English',

    appName: 'SirrApp',
    tagline: 'Private 1-on-1 Chat',
    themeTitle: 'Toggle theme',
    logout: 'Logout',

    welcome: 'Welcome to SirrApp',
    authSubtitle: 'Instant private chat — no messages stored on the server',
    loginTab: 'Login',
    signupTab: 'Sign Up',
    email: 'Email',
    password: 'Password',
    loginBtn: 'Login',
    signupBtn: 'Create Account',
    fullName: 'Full Name',
    username: 'Username',
    age: 'Age',
    phone: 'Phone Number',
    optional: '(optional)',
    ageError: 'You must be at least 16 years old to use SirrApp.',
    privacyNote: '🔒 Your messages are never stored on the server — they travel directly via WebSockets.',

    online: 'Online',
    searchUsers: 'Search users...',
    ephemeralNote: '⚡ Messages are ephemeral — they vanish when the page closes.',
    selectChatTitle: 'Select a chat to start',
    selectChatDesc: 'Pick a user from the list to begin a private, real-time conversation.',
    e2eBadge: 'Live channel',
    typing: 'typing...',
    recordingHint: 'Recording... (max 60 seconds)',
    cancel: 'Cancel',
    send: 'Send',
    emoji: 'Emoji',
    sendImages: 'Send images',
    typeMessage: 'Type your message...',
    recordVoice: 'Record voice message',

    fillAllFields: 'Please fill in all required fields.',
    invalidEmail: 'Invalid email address.',
    passwordMin: 'Password must be at least 6 characters.',
    usernameInvalid: 'Username must be 3–20 chars (letters, numbers, or _).',
    ageInvalid: 'You must be at least 16 years old.',
    signupSuccess: '✅ Account created! Signing you in...',
    signupNeedConfirm: '📧 Account created! Confirm your email then log in.',
    signupFailed: 'Sign up failed: ',
    loginSuccess: '✅ Logged in successfully!',
    loginFailed: 'Login failed: ',
    logoutSuccess: '👋 Logged out.',
    userNotFound: 'User not found.',
    noUsers: 'No users available right now.',
    selectUser: 'Select a user to start chatting.',
    msgSent: 'Message sent',
    msgFailed: 'Failed to send message',
    imageCompressed: 'Image compressed',
    imageTooBig: 'Could not compress image under 50KB.',
    tooManyImages: 'You can send up to 5 images.',
    imagesSent: 'Images sent',
    recordingStarted: '🔴 Recording started...',
    recordingStopped: '⏹️ Recording stopped',
    recordingCanceled: 'Recording canceled',
    audioTooLong: '⏱️ Maximum recording is 60 seconds.',
    micError: 'Microphone access denied.',
    audioSent: 'Voice message sent',
    msgTooLong: 'Message is too long (max 500 chars).',
    copied: 'Copied',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    you: 'You',
    today: 'Today',
    yesterday: 'Yesterday'
    recent: 'Recent Chats',
    searchResults: 'Search Results',
    noRecentTitle: 'No chats yet',
    noRecentDesc: 'Search by username to start chatting.',
  },

  /* ================= Français ================= */
  fr: {
    _dir: 'ltr',
    _name: 'Français',

    appName: 'SirrApp',
    tagline: 'Chat privé 1 à 1',
    themeTitle: 'Changer de thème',
    logout: 'Déconnexion',

    welcome: 'Bienvenue sur SirrApp',
    authSubtitle: 'Chat instantané privé — aucun message stocké sur le serveur',
    loginTab: 'Connexion',
    signupTab: 'Inscription',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    loginBtn: 'Se connecter',
    signupBtn: 'Créer un compte',
    fullName: 'Nom complet',
    username: "Nom d'utilisateur",
    age: 'Âge',
    phone: 'Numéro de téléphone',
    optional: '(optionnel)',
    ageError: "Vous devez avoir au moins 16 ans pour utiliser SirrApp.",
    privacyNote: '🔒 Vos messages ne sont jamais stockés sur le serveur — ils passent directement via WebSockets.',

    online: 'En ligne',
    searchUsers: 'Rechercher des utilisateurs...',
    ephemeralNote: '⚡ Les messages sont éphémères — ils disparaissent à la fermeture.',
    selectChatTitle: 'Choisissez une discussion',
    selectChatDesc: 'Sélectionnez un utilisateur pour démarrer une conversation privée en temps réel.',
    e2eBadge: 'Canal direct',
    typing: 'est en train d\'écrire...',
    recordingHint: 'Enregistrement... (60 secondes max)',
    cancel: 'Annuler',
    send: 'Envoyer',
    emoji: 'Émojis',
    sendImages: 'Envoyer des images',
    typeMessage: 'Écrivez votre message...',
    recordVoice: 'Enregistrer un message vocal',

    fillAllFields: 'Veuillez remplir tous les champs obligatoires.',
    invalidEmail: 'Adresse e-mail invalide.',
    passwordMin: 'Le mot de passe doit contenir au moins 6 caractères.',
    usernameInvalid: "Le nom d'utilisateur doit faire 3 à 20 caractères.",
    ageInvalid: 'Vous devez avoir au moins 16 ans.',
    signupSuccess: '✅ Compte créé ! Connexion en cours...',
    signupNeedConfirm: '📧 Compte créé ! Confirmez votre e-mail puis connectez-vous.',
    signupFailed: 'Échec de l\'inscription : ',
    loginSuccess: '✅ Connexion réussie !',
    loginFailed: 'Échec de la connexion : ',
    logoutSuccess: '👋 Déconnecté.',
    userNotFound: 'Utilisateur introuvable.',
    noUsers: 'Aucun utilisateur disponible.',
    selectUser: 'Sélectionnez un utilisateur pour discuter.',
    msgSent: 'Message envoyé',
    msgFailed: 'Échec de l\'envoi',
    imageCompressed: 'Image compressée',
    imageTooBig: 'Impossible de compresser sous 50 Ko.',
    tooManyImages: 'Maximum 5 images.',
    imagesSent: 'Images envoyées',
    recordingStarted: '🔴 Enregistrement démarré...',
    recordingStopped: '⏹️ Enregistrement arrêté',
    recordingCanceled: 'Enregistrement annulé',
    audioTooLong: '⏱️ Durée maximale : 60 secondes.',
    micError: 'Accès au microphone refusé.',
    audioSent: 'Message vocal envoyé',
    msgTooLong: 'Message trop long (500 caractères max).',
    copied: 'Copié',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    you: 'Vous',
    today: "Aujourd'hui",
    yesterday: 'Hier'
    recent: 'Discussions récentes',
    searchResults: 'Résultats',
    noRecentTitle: 'Aucune discussion',
    noRecentDesc: 'Recherchez un utilisateur pour commencer.',
  }
};

/* ============================================================
   مدير الترجمة
   ============================================================ */
const I18n = (() => {
  let currentLang = localStorage.getItem('sirrapp-lang') || 'ar';

  /** جلب النص حسب المفتاح */
  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
    return dict[key] ?? TRANSLATIONS.ar[key] ?? key;
  }

  /** تغيير اللغة وتحديث الواجهة */
  function setLang(lang) {
    if (!TRANSLATIONS[lang]) lang = 'ar';
    currentLang = lang;
    localStorage.setItem('sirrapp-lang', lang);

    const dir = TRANSLATIONS[lang]._dir || 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);

    applyTranslations();
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang, dir } }));
  }

  /** تطبيق الترجمة على كل عناصر الصفحة */
  function applyTranslations() {
    // 1) النصوص العادية
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.textContent = val;
    });

    // 2) Placeholders
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const key = el.getAttribute('data-i18n-ph');
      const val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });

    // 3) Titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(key);
      if (val) el.setAttribute('title', val);
    });

    // 4) Title الصفحة
    document.title = `SirrApp — ${t('tagline')}`;
  }

  /** جلب اللغة الحالية */
  function getLang() { return currentLang; }

  /** جلب الاتجاه الحالي */
  function getDir() { return TRANSLATIONS[currentLang]._dir || 'ltr'; }

  return { t, setLang, getLang, getDir, applyTranslations, translations: TRANSLATIONS };
})();

/* إتاحة عالمية */
window.I18n = I18n;
window.t = I18n.t;

/* تطبيق تلقائي عند الجاهزية */
document.addEventListener('DOMContentLoaded', () => {
  I18n.setLang(I18n.getLang());
});
