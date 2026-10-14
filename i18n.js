/* ============================================================
   SirrApp — i18n (AR / EN / FR) with Profile Settings keys
   ============================================================ */

const TRANSLATIONS = {
  /* ================= العربية ================= */
  ar: {
    _dir: 'rtl', _name: 'العربية',
    appName: 'SirrApp', tagline: 'دردشة فردية فورية',
    themeTitle: 'تبديل المظهر', logout: 'تسجيل الخروج',

    welcome: 'مرحباً بك في SirrApp',
    authSubtitle: 'دردشة فردية فورية — بدون تخزين للرسائل',
    loginTab: 'تسجيل الدخول', signupTab: 'حساب جديد',
    email: 'البريد الإلكتروني', password: 'كلمة المرور',
    loginBtn: 'دخول', signupBtn: 'إنشاء الحساب',
    fullName: 'الاسم واللقب', username: 'اسم المستخدم', age: 'العمر',
    phone: 'رقم الهاتف', optional: '(اختياري)',
    ageError: 'يجب أن يكون عمرك 16 عاماً أو أكثر لاستخدام SirrApp.',
    privacyNote: '🔒 لا يتم تخزين محتوى رسائلك على السيرفر — تُنقل مباشرة عبر WebSockets.',

    online: 'متصل', searchUsers: 'ابحث عن مستخدم...',
    ephemeralNote: '⚡ الرسائل مؤقتة ولا تُخزَّن.',
    selectChatTitle: 'اختر محادثة للبدء',
    selectChatDesc: 'ابحث عن مستخدم أو اختر من محادثاتك الأخيرة.',
    e2eBadge: 'قناة مباشرة', typing: 'يكتب الآن...',
    recordingHint: 'جارٍ التسجيل... (الحد 60 ثانية)',
    cancel: 'إلغاء', send: 'إرسال',
    emoji: 'الرموز', sendImages: 'إرسال صور',
    typeMessage: 'اكتب رسالتك...', recordVoice: 'تسجيل صوتي',

    // Profile Settings
    editProfile: 'تعديل الملف الشخصي',
    avatarColor: 'لون الصورة الرمزية',
    save: 'حفظ',
    profileSaved: '✅ تم حفظ التغييرات بنجاح!',
    profileSaveFailed: 'فشل حفظ الملف الشخصي: ',
    profileInvalidName: 'الاسم يجب أن يكون بين 2 و60 حرفاً.',

    // States & Lists
    recent: 'المحادثات الأخيرة',
    searchResults: 'نتائج البحث',
    noRecentTitle: 'لا محادثات بعد',
    noRecentDesc: 'ابحث عن مستخدم باسمه لبدء الدردشة.',
    noSearchResults: 'لا نتائج',
    noSearchDesc: 'لم نجد أي مستخدم بهذا الاسم.',
    noUsers: 'لا يوجد مستخدمون.',

    // Toasts
    fillAllFields: 'يرجى تعبئة جميع الحقول الإجبارية.',
    invalidEmail: 'البريد الإلكتروني غير صالح.',
    passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.',
    usernameInvalid: 'اسم المستخدم يجب أن يكون بين 3 و20 حرفاً (أحرف إنجليزية، أرقام، أو _).',
    ageInvalid: 'يجب أن يكون عمرك 16 عاماً أو أكثر.',
    signupSuccess: '✅ تم إنشاء الحساب بنجاح!',
    signupNeedConfirm: '📧 تم إنشاء الحساب! يرجى تأكيد بريدك.',
    signupFailed: 'فشل إنشاء الحساب: ',
    loginSuccess: '✅ تم تسجيل الدخول بنجاح!',
    loginFailed: 'فشل تسجيل الدخول: ',
    logoutSuccess: '👋 تم تسجيل الخروج.',
    selectUser: 'اختر مستخدماً لبدء المحادثة.',
    msgSent: 'تم إرسال الرسالة', msgFailed: 'فشل إرسال الرسالة',
    imageTooBig: 'تعذّر ضغط الصورة تحت 50KB.',
    tooManyImages: 'يمكنك إرسال 5 صور كحد أقصى.',
    imagesSent: 'تم إرسال الصور',
    recordingStarted: '🔴 بدأ التسجيل...',
    recordingStopped: '⏹️ تم إيقاف التسجيل',
    recordingCanceled: 'تم إلغاء التسجيل',
    audioTooLong: '⏱️ الحد الأقصى 60 ثانية.',
    micError: 'تعذّر الوصول إلى الميكروفون.',
    audioSent: 'تم إرسال الرسالة الصوتية',
    msgTooLong: 'الرسالة طويلة جداً (الحد 500 حرف).',
    lightMode: 'الوضع النهاري', darkMode: 'الوضع الليلي'
  },

  /* ================= English ================= */
  en: {
    _dir: 'ltr', _name: 'English',
    appName: 'SirrApp', tagline: 'Private 1-on-1 Chat',
    themeTitle: 'Toggle theme', logout: 'Logout',

    welcome: 'Welcome to SirrApp',
    authSubtitle: 'Instant private chat — no messages stored on the server',
    loginTab: 'Login', signupTab: 'Sign Up',
    email: 'Email', password: 'Password',
    loginBtn: 'Login', signupBtn: 'Create Account',
    fullName: 'Full Name', username: 'Username', age: 'Age',
    phone: 'Phone Number', optional: '(optional)',
    ageError: 'You must be at least 16 years old to use SirrApp.',
    privacyNote: '🔒 Your messages are never stored on the server — they travel directly via WebSockets.',

    online: 'Online', searchUsers: 'Search users...',
    ephemeralNote: '⚡ Messages are ephemeral — they vanish when the page closes.',
    selectChatTitle: 'Select a chat to start',
    selectChatDesc: 'Search a user or pick from your recent chats.',
    e2eBadge: 'Live channel', typing: 'typing...',
    recordingHint: 'Recording... (max 60 seconds)',
    cancel: 'Cancel', send: 'Send',
    emoji: 'Emoji', sendImages: 'Send images',
    typeMessage: 'Type your message...', recordVoice: 'Record voice',

    editProfile: 'Edit Profile',
    avatarColor: 'Avatar Color',
    save: 'Save',
    profileSaved: '✅ Profile updated successfully!',
    profileSaveFailed: 'Failed to save profile: ',
    profileInvalidName: 'Name must be between 2 and 60 characters.',

    recent: 'Recent Chats',
    searchResults: 'Search Results',
    noRecentTitle: 'No chats yet',
    noRecentDesc: 'Search by username to start chatting.',
    noSearchResults: 'No results',
    noSearchDesc: 'No user found with that name.',
    noUsers: 'No users available.',

    fillAllFields: 'Please fill in all required fields.',
    invalidEmail: 'Invalid email address.',
    passwordMin: 'Password must be at least 6 characters.',
    usernameInvalid: 'Username must be 3–20 chars (letters, numbers, or _).',
    ageInvalid: 'You must be at least 16 years old.',
    signupSuccess: '✅ Account created!',
    signupNeedConfirm: '📧 Account created! Confirm your email.',
    signupFailed: 'Sign up failed: ',
    loginSuccess: '✅ Logged in successfully!',
    loginFailed: 'Login failed: ',
    logoutSuccess: '👋 Logged out.',
    selectUser: 'Select a user to start chatting.',
    msgSent: 'Message sent', msgFailed: 'Failed to send message',
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
    lightMode: 'Light mode', darkMode: 'Dark mode'
  },

  /* ================= Français ================= */
  fr: {
    _dir: 'ltr', _name: 'Français',
    appName: 'SirrApp', tagline: 'Chat privé 1 à 1',
    themeTitle: 'Changer de thème', logout: 'Déconnexion',

    welcome: 'Bienvenue sur SirrApp',
    authSubtitle: 'Chat instantané privé — aucun message stocké sur le serveur',
    loginTab: 'Connexion', signupTab: 'Inscription',
    email: 'Adresse e-mail', password: 'Mot de passe',
    loginBtn: 'Se connecter', signupBtn: 'Créer un compte',
    fullName: 'Nom complet', username: "Nom d'utilisateur", age: 'Âge',
    phone: 'Numéro de téléphone', optional: '(optionnel)',
    ageError: 'Vous devez avoir au moins 16 ans pour utiliser SirrApp.',
    privacyNote: '🔒 Vos messages ne sont jamais stockés — ils passent directement via WebSockets.',

    online: 'En ligne', searchUsers: 'Rechercher des utilisateurs...',
    ephemeralNote: '⚡ Les messages sont éphémères.',
    selectChatTitle: 'Choisissez une discussion',
    selectChatDesc: 'Recherchez un utilisateur ou choisissez dans vos discussions récentes.',
    e2eBadge: 'Canal direct', typing: 'est en train d\'écrire...',
    recordingHint: 'Enregistrement... (60 secondes max)',
    cancel: 'Annuler', send: 'Envoyer',
    emoji: 'Émojis', sendImages: 'Envoyer des images',
    typeMessage: 'Écrivez votre message...', recordVoice: 'Enregistrer un message vocal',

    editProfile: 'Modifier le profil',
    avatarColor: 'Couleur de l\'avatar',
    save: 'Enregistrer',
    profileSaved: '✅ Profil mis à jour !',
    profileSaveFailed: 'Échec de la sauvegarde : ',
    profileInvalidName: 'Le nom doit contenir 2 à 60 caractères.',

    recent: 'Discussions récentes',
    searchResults: 'Résultats',
    noRecentTitle: 'Aucune discussion',
    noRecentDesc: 'Recherchez un utilisateur pour commencer.',
    noSearchResults: 'Aucun résultat',
    noSearchDesc: 'Aucun utilisateur trouvé avec ce nom.',
    noUsers: 'Aucun utilisateur disponible.',

    fillAllFields: 'Veuillez remplir tous les champs obligatoires.',
    invalidEmail: 'Adresse e-mail invalide.',
    passwordMin: 'Le mot de passe doit contenir au moins 6 caractères.',
    usernameInvalid: "Le nom d'utilisateur doit faire 3 à 20 caractères.",
    ageInvalid: 'Vous devez avoir au moins 16 ans.',
    signupSuccess: '✅ Compte créé !',
    signupNeedConfirm: '📧 Compte créé ! Confirmez votre e-mail.',
    signupFailed: 'Échec de l\'inscription : ',
    loginSuccess: '✅ Connexion réussie !',
    loginFailed: 'Échec de la connexion : ',
    logoutSuccess: '👋 Déconnecté.',
    selectUser: 'Sélectionnez un utilisateur pour discuter.',
    msgSent: 'Message envoyé', msgFailed: 'Échec de l\'envoi',
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
    lightMode: 'Mode clair', darkMode: 'Mode sombre'
  }
};

const I18n = (() => {
  let currentLang = localStorage.getItem('sirrapp-lang') || 'ar';

  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;
    return dict[key] ?? TRANSLATIONS.ar[key] ?? key;
  }

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

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = t(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-ph'));
      if (v) el.setAttribute('placeholder', v);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const v = t(el.getAttribute('data-i18n-title'));
      if (v) el.setAttribute('title', v);
    });
    document.title = `SirrApp — ${t('tagline')}`;
  }

  function getLang() { return currentLang; }
  function getDir() { return TRANSLATIONS[currentLang]._dir || 'ltr'; }

  return { t, setLang, getLang, getDir, applyTranslations, translations: TRANSLATIONS };
})();

window.I18n = I18n;
window.t = I18n.t;

document.addEventListener('DOMContentLoaded', () => {
  I18n.setLang(I18n.getLang());
});
