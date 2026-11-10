'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import SpikeLogo from '../../components/SpikeLogo';

const SUPER_ADMIN_EMAIL = 'hassanhosny2007@gmail.com';

const DEFAULT_THEME = {
  light: { bg: '#ECF3FD', card: '#FFFFFF', accent: '#014D6F' },
  dark: { bg: '#061C2A', card: '#0A2A3E', accent: '#5BB6E0' },
  headline: '',
  subline: '',
};
const HEX = /^#[0-9a-fA-F]{6}$/;

function Eye({ shown }) {
  return <span aria-hidden="true">{shown ? '🙈' : '👁️'}</span>;
}

function PassField({ id, label, value, onChange, shown, setShown, autoComplete, inp, lbl, isAr }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={lbl}>{label}</label>
      <div className="relative">
        <input id={id} name={id} type={shown ? 'text' : 'password'} required autoComplete={autoComplete} placeholder="••••••••" value={value} onChange={(e) => onChange(e.target.value)} className={`${inp} ${isAr ? 'pl-11' : 'pr-11'}`} dir="ltr" />
        <button type="button" onClick={() => setShown(!shown)} className={`absolute top-1/2 -translate-y-1/2 ${isAr ? 'left-3' : 'right-3'} text-base cursor-pointer`} title={shown ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')} aria-label={shown ? 'hide password' : 'show password'}>
          <Eye shown={shown} />
        </button>
      </div>
    </div>
  );
}

const Ic = ({ d, className = 'w-[18px] h-[18px]', sw = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{d}</svg>
);
const IGlobe = () => <Ic d={<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 4 5.7 4 9s-1.4 6.3-4 9c-2.6-2.7-4-5.7-4-9s1.4-6.3 4-9z" /></>} />;
const ISun = () => <Ic d={<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>} />;
const IMoon = () => <Ic d={<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />} />;
const IUser = () => <Ic d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>} />;
const IArrow = ({ flip }) => <Ic className={`w-4 h-4 ${flip ? 'rotate-180' : ''}`} sw={2.2} d={<path d="M5 12h14M13 6l6 6-6 6" />} />;

/* ===== حركة وخلفية صفحة التسجيل والدخول ===== */
const RG_CSS = `
.rg-aurora{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none}
.rg-blob{position:absolute;border-radius:50%;filter:blur(80px);will-change:transform}
.rg-b1{width:540px;height:540px;top:-170px;inset-inline-start:-130px;opacity:.5;background:radial-gradient(circle,#5BB6E0,transparent 70%);animation:rgf1 14s ease-in-out infinite alternate}
.rg-b2{width:600px;height:600px;bottom:-230px;inset-inline-end:-150px;opacity:.5;background:radial-gradient(circle,var(--ac),transparent 70%);animation:rgf2 17s ease-in-out infinite alternate}
.rg-b3{width:400px;height:400px;top:38%;inset-inline-start:52%;opacity:.28;background:radial-gradient(circle,#2563eb,transparent 70%);animation:rgf3 21s ease-in-out infinite alternate}
@keyframes rgf1{to{transform:translate(140px,110px) scale(1.18)}}
@keyframes rgf2{to{transform:translate(-160px,-90px) scale(1.12)}}
@keyframes rgf3{to{transform:translate(-120px,70px) scale(.85)}}
.rg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(148,163,184,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.08) 1px,transparent 1px);background-size:46px 46px;-webkit-mask-image:radial-gradient(ellipse at center,#000 25%,transparent 75%);mask-image:radial-gradient(ellipse at center,#000 25%,transparent 75%)}
.rg-card{animation:rgcard .95s cubic-bezier(.2,.9,.25,1) both;box-shadow:0 30px 80px -30px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.04) inset}
@keyframes rgcard{from{opacity:0;transform:translateY(70px) scale(.95);filter:blur(10px)}to{opacity:1;transform:none;filter:blur(0)}}
.rg-glass{-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px)}
.rg-drop{animation:rgdrop 1.1s cubic-bezier(.34,1.56,.64,1) both}
@keyframes rgdrop{from{opacity:0;transform:translateY(-90px) scale(.55)}to{opacity:1;transform:none}}
.rg-logo{filter:drop-shadow(0 8px 22px rgba(0,212,200,.35));animation:rgpulse 4s ease-in-out 1.2s infinite}
@keyframes rgpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
.rg-in{animation:rgin .65s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 75ms + 250ms)}
@keyframes rgin{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.rg-inp:focus,.rg-inp:focus-within{box-shadow:0 0 0 3px rgba(34,211,238,.28);border-color:#5BB6E0}
.rg-btn{position:relative;overflow:hidden;background:linear-gradient(135deg,#5BB6E0,var(--ac));box-shadow:0 10px 28px -10px var(--ac)}
.rg-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.rg-btn::after{content:'';position:absolute;top:0;bottom:0;width:60%;left:-80%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:rgshine 3.4s ease-in-out 1.6s infinite}
@keyframes rgshine{0%{left:-80%}55%,100%{left:140%}}
.rg-nav{position:relative;padding:8px 14px;font-weight:800;font-size:13px;opacity:.78;transition:opacity .2s}
.rg-nav::after{content:'';position:absolute;left:14px;right:14px;bottom:2px;height:2px;border-radius:2px;background:linear-gradient(90deg,#5BB6E0,var(--ac));transform:scaleX(0);transform-origin:center;transition:transform .25s}
.rg-nav:hover{opacity:1}.rg-nav:hover::after{transform:scaleX(1)}
.rg-head{box-shadow:0 1px 0 rgba(0,212,200,.18),0 18px 40px -28px rgba(0,0,0,.6)}
.rg-ibtn{width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;border-radius:14px;border:1px solid;transition:transform .2s,background .2s,border-color .2s;cursor:pointer}
.rg-ibtn:hover{transform:translateY(-2px);border-color:#5BB6E0}
.rg-ring{position:absolute;border-radius:50%;border:1px solid rgba(34,211,238,.28);animation:rgspin 40s linear infinite}
.rg-ring::after{content:'';position:absolute;top:-4px;left:50%;width:8px;height:8px;border-radius:50%;background:#5BB6E0;box-shadow:0 0 14px 3px rgba(34,211,238,.7)}
.rg-r1{width:620px;height:620px;top:-210px;inset-inline-end:-190px}
.rg-r2{width:420px;height:420px;bottom:-120px;inset-inline-start:-110px;animation-duration:55s;animation-direction:reverse;border-color:rgba(1,77,111,.3)}
.rg-r2::after{background:#014D6F;box-shadow:0 0 14px 3px rgba(1,77,111,.7)}
@keyframes rgspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.rg-blob,.rg-ring,.rg-card,.rg-drop,.rg-in,.rg-logo,.rg-btn::after{animation:none!important}}
`;

/* قوة كلمة المرور: 0 ضعيفة جداً ... 4 قوية */
function passScore(pw) {
  const v = String(pw || '');
  let sc = 0;
  if (v.length >= 8) sc++;
  if (v.length >= 12) sc++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) sc++;
  if (/\d/.test(v) && /[a-zA-Z]/.test(v)) sc++;
  if (/[^a-zA-Z0-9]/.test(v)) sc++;
  if (/^(.)\1+$/.test(v) || /^(123456|password|12345678|qwerty)/i.test(v)) sc = Math.min(sc, 1);
  return Math.min(4, sc);
}
const strengthMeta = (sc, isAr) => [
  [isAr ? 'ضعيفة جداً' : 'Very weak', '#ef4444'], [isAr ? 'ضعيفة' : 'Weak', '#f97316'], [isAr ? 'مقبولة' : 'Fair', '#eab308'],
  [isAr ? 'جيدة' : 'Good', '#22c55e'], [isAr ? 'قوية' : 'Strong', '#16a34a'],
][sc];

/* خانات كود التأكيد (6 أرقام): كتابة ولصق ومسح وتنقل تلقائي */
function OtpInput({ value, onChange, disabled, isDark }) {
  const refs = [];
  const v = String(value || '').replace(/\D/g, '').slice(0, 6);
  const focus = (i) => { const el = refs[Math.max(0, Math.min(5, i))]; if (el) el.focus(); };
  return (
    <div dir="ltr" style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={(e) => {
      const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (t) { e.preventDefault(); onChange(t); setTimeout(() => focus(t.length >= 6 ? 5 : t.length), 0); }
    }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i} ref={(el) => { refs[i] = el; }} disabled={disabled}
          inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} maxLength={1} aria-label={`digit ${i + 1}`}
          value={v[i] || ''}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1);
            if (!d) return;
            onChange((v.slice(0, i) + d + v.slice(i + 1)).slice(0, 6));
            focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') { e.preventDefault(); onChange(v.slice(0, v[i] ? i : Math.max(0, i - 1)) + (v[i] ? v.slice(i + 1) : v.slice(i))); focus(v[i] ? i : i - 1); }
            if (e.key === 'ArrowLeft') focus(i - 1);
            if (e.key === 'ArrowRight') focus(i + 1);
          }}
          onFocus={(e) => e.target.select()}
          style={{ width: 44, height: 54, textAlign: 'center', fontSize: 22, fontWeight: 900, borderRadius: 14, outline: 'none',
            border: `2px solid ${v[i] ? 'var(--ac)' : (isDark ? '#334155' : '#cbd5e1')}`,
            background: isDark ? 'rgba(15,23,42,.7)' : 'rgba(255,255,255,.85)', color: isDark ? '#fff' : '#0f172a' }}
        />
      ))}
    </div>
  );
}

export default function SpikeRegisterAndAuthPage() {
  const router = useRouter();
  const { lang, toggleLanguage, toggleTheme, isDark } = useApp();
  const isAr = lang === 'ar';

  const [mode, setMode] = useState('register'); // register | login | forgot | verify | reset
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const isLoginMode = mode === 'login';

  const t = {
    ar: {
      brand: 'سبايك', home: 'الرئيسية', pricing: 'الأسعار', subscribeBtn: 'اشترك الآن',
      loginTitle: 'تسجيل الدخول إلى حسابك', registerTitle: 'انشئ حساب مجاني', forgotTitle: 'استعادة كلمة المرور',
      storeNameLabel: 'اسم موقعك', currencyLabel: 'العملة الأساسية', nameLabel: 'اسمك واسم العائلة', phoneLabel: 'رقم الهاتف',
      emailLabel: 'البريد الالكتروني', passLabel: 'الرقم السري', confirmPassLabel: 'اعد كتابة الرقم السري',
      submitRegister: 'انشاء حساب', submitLogin: 'تسجيل الدخول', submitForgot: 'أرسل كود الاستعادة', processing: 'جاري المعالجة...',
      noAccount: 'ليس لديك حساب بعد؟', hasAccount: 'لديك حساب بالفعل؟', switchRegister: 'انشئ حساب مجاني جديد', switchLogin: 'تسجيل الدخول',
      remember: 'تذكّرني', forgot: 'نسيت كلمة المرور؟', backLogin: 'العودة لتسجيل الدخول',
      agreePre: 'أوافق على', agreeLink: 'الشروط والسياسات', autoLogin: 'تسجيل الدخول تلقائياً بعد إنشاء المتجر',
      forgotHint: 'اكتب بريدك وسنرسل لك كود من 6 أرقام لتعيين كلمة مرور جديدة.',
      aboutTitle: 'عن سبايك', academyTitle: 'الأكاديمية', devsTitle: 'للمطورين', appTitle: 'حمّل التطبيق', rights: 'Copyright © SPIKE | 2026',
    },
    en: {
      brand: 'SPIKE', home: 'Home', pricing: 'Pricing', subscribeBtn: 'Start Free',
      loginTitle: 'Sign In to Your Account', registerTitle: 'Create Free Account', forgotTitle: 'Reset Password',
      storeNameLabel: 'Your Store Name', currencyLabel: 'Base Currency', nameLabel: 'Full Name', phoneLabel: 'Phone Number',
      emailLabel: 'Email Address', passLabel: 'Password', confirmPassLabel: 'Confirm Password',
      submitRegister: 'Create Account', submitLogin: 'Sign In', submitForgot: 'Send reset code', processing: 'Processing...',
      noAccount: "Don't have an account?", hasAccount: 'Already have an account?', switchRegister: 'Create a new free account', switchLogin: 'Sign In',
      remember: 'Remember me', forgot: 'Forgot password?', backLogin: 'Back to sign in',
      agreePre: 'I agree to the', agreeLink: 'Terms & Policies', autoLogin: 'Sign in automatically after creating my store',
      forgotHint: "Enter your email and we'll send you a 6-digit code to set a new password.",
      aboutTitle: 'About SPIKE', academyTitle: 'Academy', devsTitle: 'Developers', appTitle: 'Download App', rights: 'Copyright © SPIKE | 2026',
    },
  }[lang || 'ar'];

  const [msg, setMsg] = useState(null);
  const say = (text, kind = 'err', forMode) => setMsg({ text, kind, mode: forMode || mode });
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [formData, setFormData] = useState({ storeSlug: '', currency: 'USD', fullName: '', phone: '', email: '', password: '', confirmPassword: '', promo: '' });
  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  /* ألوان واجهة التسجيل (يعدلها الأدمن) + البريد المحفوظ */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('platform_kv').select('value').eq('key', 'theme_colors').maybeSingle();
        if (data?.value) {
          const j = JSON.parse(data.value);
          /* القيم القديمة الافتراضية (الأخضر والنيلي) المحفوظة قبل الهوية الجديدة تتعامل كأنها غير محددة */
          const OLD = ['#f4f6f9', '#0b132b', '#0e1e38', '#00b050'];
          const keep = (o = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => !OLD.includes(String(v).toLowerCase())));
          j.light = keep(j.light); j.dark = keep(j.dark);
          setTheme({
            light: { ...DEFAULT_THEME.light, ...(j.light || {}) },
            dark: { ...DEFAULT_THEME.dark, ...(j.dark || {}) },
            headline: String(j.headline || ''), subline: String(j.subline || ''),
          });
        }
      } catch { /* نستخدم الألوان الافتراضية */ }
    })();
    try {
      const saved = localStorage.getItem('spike_remember_email');
      if (saved) { setFormData((p) => ({ ...p, email: saved })); setMode('login'); }
    } catch { /* تجاهل */ }
  }, []);

  const pick = (k) => { const c = (isDark ? theme.dark : theme.light)[k]; return HEX.test(c) ? c : (isDark ? DEFAULT_THEME.dark : DEFAULT_THEME.light)[k]; };
  const vars = { '--bg': pick('bg'), '--card': pick('card'), '--ac': pick('accent') };

  const emailNow = formData.email.trim().toLowerCase();
  const isAdminEmail = emailNow === SUPER_ADMIN_EMAIL.toLowerCase();
  const showRegisterFields = mode === 'register';
  const showLogin = mode === 'login';
  const score = passScore(formData.password);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  /* إرسال كود تأكيد جديد والانتقال لشاشة إدخاله */
  const startVerify = async (em, resend) => {
    setPendingEmail(em); setOtp(''); setMode('verify');
    if (resend) {
      const { error } = await supabase.auth.resend({ type: 'signup', email: em });
      if (error) { say((isAr ? 'تعذر إرسال الكود: ' : 'Could not send code: ') + error.message, 'err', 'verify'); return; }
    }
    setCooldown(60);
    say(isAr ? `📧 بعتنا كود من 6 أرقام على ${em}. اكتبه هنا لتأكيد حسابك.` : `📧 We sent a 6-digit code to ${em}. Enter it below.`, 'ok', 'verify');
  };

  /* قفل مؤقت بعد محاولات دخول غلط متكررة (حماية واجهة؛ سوبابيز عنده حد خاص من السيرفر) */
  const LOCK_KEY = 'spike_login_lock';
  const lockLeft = () => {
    try { const j = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}'); return Math.max(0, Math.ceil(((j.until || 0) - Date.now()) / 1000)); } catch { return 0; }
  };
  const noteFail = () => {
    try {
      const j = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}');
      const fresh = Date.now() - (j.at || 0) < 15 * 60000;
      const n = (fresh ? j.n || 0 : 0) + 1;
      localStorage.setItem(LOCK_KEY, JSON.stringify({ n, at: Date.now(), until: n >= 5 ? Date.now() + 5 * 60000 : 0 }));
      return n;
    } catch { return 0; }
  };
  const clearFails = () => { try { localStorage.removeItem(LOCK_KEY); } catch { /* تجاهل */ } };

  const startReset = async (em) => {
    setPendingEmail(em); setOtp(''); setCooldown(60);
    setFormData((p) => ({ ...p, email: em, password: '', confirmPassword: '' }));
    setMode('reset');
    say(isAr ? `📧 لو ${em} مسجّل عندنا هيوصله كود من 6 أرقام. اكتبه مع كلمة المرور الجديدة.` : `📧 If ${em} is registered, a 6-digit code is on its way. Enter it with your new password.`, 'ok', 'reset');
  };

  const resendReset = async () => {
    if (cooldown > 0 || !pendingEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(pendingEmail, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { say((isAr ? 'تعذر الإرسال: ' : 'Failed: ') + error.message, 'err', 'reset'); return; }
    setCooldown(60); setOtp('');
    say(isAr ? '📧 بعتنا كود جديد' : '📧 New code sent', 'ok', 'reset');
  };

  const handleReset = async () => {
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) { say(isAr ? 'اكتب الكود كامل (6 أرقام)' : 'Enter the full 6-digit code'); return; }
    if (formData.password !== formData.confirmPassword) { say(isAr ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!'); return; }
    if (formData.password.length < 8 || passScore(formData.password) < 2) { say(isAr ? 'كلمة المرور لازم تكون 8 أحرف على الأقل وتجمع حروف وأرقام' : 'Password must be 8+ characters mixing letters and numbers'); return; }
    const { data, error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code, type: 'recovery' });
    if (error || !data?.user) { say(isAr ? 'الكود غلط أو انتهت صلاحيته. اطلب كود جديد.' : 'Invalid or expired code. Request a new one.'); setOtp(''); return; }
    const { error: upErr } = await supabase.auth.updateUser({ password: formData.password });
    if (upErr) { await supabase.auth.signOut(); say((isAr ? 'تعذر تغيير كلمة المرور: ' : 'Could not change password: ') + upErr.message); return; }
    await supabase.auth.signOut();
    clearFails();
    setFormData((p) => ({ ...p, email: pendingEmail, password: '', confirmPassword: '' }));
    setMode('login');
    say(isAr ? '✅ تم تغيير كلمة المرور. سجّل الدخول بالجديدة.' : '✅ Password changed. Sign in with the new one.', 'ok', 'login');
  };

  const handleVerify = async () => {
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) { say(isAr ? 'اكتب الكود كامل (6 أرقام)' : 'Enter the full 6-digit code'); return; }
    const { data, error } = await supabase.auth.verifyOtp({ email: pendingEmail, token: code, type: 'signup' });
    if (error || !data?.user) { say(isAr ? 'الكود غلط أو انتهت صلاحيته. اطلب كود جديد.' : 'Invalid or expired code. Request a new one.'); setOtp(''); return; }
    await ensureStore(data.user);
    rememberSession(data.user, false);
    say(isAr ? '✅ تم تأكيد حسابك' : '✅ Account verified', 'ok');
    router.replace('/dashboard');
  };

  const resendCode = async () => {
    if (cooldown > 0 || !pendingEmail) return;
    await startVerify(pendingEmail, true);
  };

  /* تبديل الوضع: عند الذهاب لإنشاء حساب جديد نفرّغ البريد المحفوظ وكلمة المرور */
  const switchMode = (m) => {
    setMsg(null);
    if (m === 'register') setFormData((p) => ({ ...p, email: '', password: '', confirmPassword: '' }));
    setMode(m);
  };

  const ensureStore = async (user) => {
    const meta = user.user_metadata || {};
    const { data: existing } = await supabase.from('store_profiles').select('id').eq('user_id', user.id).maybeSingle();
    if (existing || !meta.store_slug) return;
    const cleanSlug = String(meta.store_slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const phone = '+20' + String(meta.phone || '').replace(/^0+/, '');
    const { error: spErr } = await supabase.from('store_profiles').insert([{
      user_id: user.id, store_name: meta.store_slug, store_slug: cleanSlug, owner_name: meta.full_name || '', phone,
      is_active: false, subscription_status: 'active', plan_type: 'starter',
    }]);
    if (spErr) throw new Error(spErr.message);
    if (meta.promo_code) { try { await supabase.rpc('redeem_promo', { p_code: String(meta.promo_code) }); } catch { /* الكود اختياري */ } }
  };

  const rememberSession = (user, isAdmin) => {
    try {
      localStorage.setItem('user_email', user.email || '');
      localStorage.setItem('is_super_admin', isAdmin ? 'true' : 'false');
      if (!isAdmin) localStorage.setItem('merchant_user_id', user.id);
      if (remember) localStorage.setItem('spike_remember_email', user.email || ''); else localStorage.removeItem('spike_remember_email');
    } catch { /* تجاهل */ }
  };

  const handleForgot = async () => {
    const em = formData.email.trim().toLowerCase();
    if (!em) { say(isAr ? 'اكتب بريدك الإلكتروني' : 'Enter your email'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { say((isAr ? 'تعذر الإرسال: ' : 'Failed: ') + error.message); return; }
    await startReset(em);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      setMsg(null);
      if (mode === 'forgot') { await handleForgot(); setLoading(false); return; }
      if (mode === 'verify') { await handleVerify(); setLoading(false); return; }
      if (mode === 'reset') { await handleReset(); setLoading(false); return; }
      const emailInput = formData.email.trim().toLowerCase();

      if (mode === 'login') {
        if (!emailInput || !formData.password) { say(isAr ? 'يرجى كتابة البريد الإلكتروني وكلمة المرور' : 'Please enter email and password'); setLoading(false); return; }
        const left = lockLeft();
        if (left > 0) { say(isAr ? `محاولات كتير غلط. جرّب بعد ${Math.ceil(left / 60)} دقيقة أو استعد كلمة المرور.` : `Too many attempts. Try again in ${Math.ceil(left / 60)} min or reset your password.`); setLoading(false); return; }
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email: emailInput, password: formData.password });
        if (/not confirmed/i.test(loginError?.message || '')) { await startVerify(emailInput, true); setLoading(false); return; }
        if (loginError || !data?.user) { const nf = /invalid login/i.test(loginError?.message || '') ? noteFail() : 0; if (nf >= 3 && nf < 5) say(isAr ? `كلمة المرور غلط (${nf}/5). فاضل ${5 - nf} محاولات قبل القفل المؤقت.` : `Wrong password (${nf}/5).`); else if (nf >= 5) say(isAr ? 'اتقفل الدخول 5 دقايق بسبب المحاولات الغلط. تقدر تستعيد كلمة المرور.' : 'Locked for 5 minutes. You can reset your password.'); else say(/invalid login/i.test(loginError?.message || '') ? (isAr ? 'البريد أو كلمة المرور غير صحيحة' : 'Incorrect email or password') : (isAr ? 'تعذر تسجيل الدخول: ' : 'Login error: ') + (loginError?.message || '')); setLoading(false); return; }
        clearFails();
        if (emailInput === SUPER_ADMIN_EMAIL.toLowerCase()) { rememberSession(data.user, true); router.replace('/admin'); return; }
        await ensureStore(data.user);
        rememberSession(data.user, false);
        router.replace('/dashboard');
        return;
      }

      if (!formData.storeSlug || !formData.fullName || !formData.phone || !emailInput || !formData.password) { say(isAr ? 'يرجى ملء كافة الحقول المطلوبة' : 'Please fill all required fields'); setLoading(false); return; }
      if (!agree) { say(isAr ? 'يجب الموافقة على الشروط والسياسات للمتابعة' : 'You must accept the terms and policies to continue'); setLoading(false); return; }
      if (formData.password !== formData.confirmPassword) { say(isAr ? 'كلمتا المرور غير متطابقتين!' : 'Passwords do not match!'); setLoading(false); return; }
      if (formData.password.length < 8 || passScore(formData.password) < 2) { say(isAr ? 'كلمة المرور لازم تكون 8 أحرف على الأقل وتجمع حروف وأرقام' : 'Password must be 8+ characters mixing letters and numbers'); setLoading(false); return; }

      const cleanSlug = formData.storeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailInput, password: formData.password,
        options: { data: { store_slug: formData.storeSlug.trim(), full_name: formData.fullName.trim(), phone: formData.phone.trim(), currency: formData.currency, accepted_terms_at: new Date().toISOString(), promo_code: formData.promo.trim().toUpperCase() } },
      });
      if (signUpError) { say((isAr ? 'تعذر إنشاء الحساب: ' : 'Sign up failed: ') + signUpError.message); setLoading(false); return; }

      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        say(isAr ? 'هذا البريد مسجل بالفعل، سجّل الدخول بدلاً من ذلك.' : 'Email already registered. Please sign in.', 'err', 'login');
        setMode('login'); setLoading(false); return;
      }

      if (!data?.session) { await startVerify(emailInput, false); setLoading(false); return; }

      await ensureStore(data.user);
      if (!autoLogin) {
        await supabase.auth.signOut();
        try { localStorage.removeItem('merchant_user_id'); } catch { /* تجاهل */ }
        say(isAr ? `🎉 تم إنشاء متجرك (${cleanSlug}). سجّل الدخول للمتابعة. ملحوظة: متجرك سيتم تفعيله من الإدارة.` : `🎉 Store (${cleanSlug}) created. Please sign in to continue. Your store will be activated by the admin.`, 'ok', 'login');
        setMode('login'); setLoading(false); return;
      }
      rememberSession(data.user, false);
      say(isAr ? `🎉 تم إنشاء متجرك (${cleanSlug}) بنجاح! سيتم تفعيله من الإدارة، وفي الأثناء تقدر تبني متجرك.` : `🎉 Store (${cleanSlug}) created! The admin will activate it. Meanwhile you can build your store.`, 'ok');
      router.replace('/dashboard');
      return;
    } catch (err) {
      say('Error: ' + (err.message || 'Connection failed'));
    }
    setLoading(false);
  };

  const lbl = isDark ? 'text-slate-300' : 'text-slate-700';
  const inp = `rg-inp w-full p-3 rounded-xl border outline-none text-xs transition-all focus:border-[var(--ac)] ${isDark ? 'bg-slate-900/70 border-slate-700 text-white placeholder-slate-500' : 'bg-white/80 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'}`;
  const grp = `rg-inp flex items-stretch rounded-xl border overflow-hidden transition-all focus-within:border-[var(--ac)] ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-300 bg-white/80 focus-within:bg-white'}`;
  const addon = `px-3 flex items-center font-mono text-xs select-none ${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-slate-200/80 text-slate-700'}`;
  const title = mode === 'reset' ? (isAr ? 'تعيين كلمة مرور جديدة' : 'Set a new password') : mode === 'verify' ? (isAr ? 'أكّد بريدك الإلكتروني' : 'Verify your email') : mode === 'forgot' ? t.forgotTitle : (showLogin ? t.loginTitle : t.registerTitle);

  /* ترتيب ظهور العناصر: كل عنصر يتأخر عن اللي قبله */
  let n = 1;
  const st = () => ({ '--i': n++ });

  return (
    <div
      style={{ ...vars, backgroundColor: 'var(--bg)', isolation: 'isolate' }}
      className={`min-h-screen font-sans flex flex-col justify-between selection:bg-[var(--ac)] selection:text-white transition-colors duration-200 overflow-x-hidden ${isDark ? 'text-slate-100' : 'text-slate-800'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <style dangerouslySetInnerHTML={{ __html: RG_CSS }} />

      {/* خلفية متحركة */}
      <div className="rg-aurora" aria-hidden="true">
        <span className="rg-blob rg-b1" />
        <span className="rg-blob rg-b2" />
        <span className="rg-blob rg-b3" />
        <span className="rg-grid" />
        <span className="rg-ring rg-r1" />
        <span className="rg-ring rg-r2" />
      </div>

      <header className={`rg-head sticky top-0 z-40 border-b backdrop-blur-xl transition-colors ${isDark ? 'bg-[#04141F]/75 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
        <div className="max-w-7xl mx-auto h-[72px] px-4 sm:px-8 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <SpikeLogo dark={isDark} alt="SPIKE" className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
            <span className="hidden sm:flex flex-col leading-none">
              <span className={`text-xl font-black tracking-[0.2em] ${isDark ? 'text-white' : 'text-[#0A2A3E]'}`}>SPIKE</span>
              <span className="text-[10px] font-bold tracking-[0.14em] text-[var(--ac)] mt-1.5">{isAr ? 'منصة التجارة بالدفع عند الاستلام' : 'COD COMMERCE PLATFORM'}</span>
            </span>
          </Link>

          <nav className={`hidden md:flex items-center gap-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            <Link href="/" className="rg-nav">{t.home}</Link>
            <Link href="/#pricing" className="rg-nav">{t.pricing}</Link>
            <Link href="/terms" className="rg-nav">{isAr ? 'الشروط والسياسات' : 'Terms'}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleLanguage} title={isAr ? 'English' : 'العربية'} aria-label="language" className={`rg-ibtn ${isDark ? 'border-white/15 bg-white/5 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
              <IGlobe />
            </button>
            <button type="button" onClick={toggleTheme} title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'} aria-label="theme" className={`rg-ibtn ${isDark ? 'border-white/15 bg-white/5 text-amber-300' : 'border-slate-200 bg-white text-slate-700'}`}>
              {isDark ? <ISun /> : <IMoon />}
            </button>
            <button type="button" onClick={() => switchMode('login')} className={`hidden sm:inline-flex items-center gap-2 h-[42px] px-4 rounded-[14px] border text-xs font-black cursor-pointer transition-all hover:-translate-y-0.5 ${mode === 'login' ? 'border-[var(--ac)] text-[var(--ac)]' : isDark ? 'border-white/15 bg-white/5 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}>
              <IUser />{t.submitLogin}
            </button>
            <button type="button" onClick={() => switchMode('register')} className="rg-btn inline-flex items-center gap-2 h-[42px] px-4 sm:px-5 rounded-[14px] text-xs font-black text-white cursor-pointer transition-all">
              <span className="relative z-10">{t.subscribeBtn}</span><span className="relative z-10"><IArrow flip={isAr} /></span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10 w-full max-w-lg mx-auto">
        <div className="text-center space-y-2 mb-5">
          <div className="flex justify-center rg-drop"><SpikeLogo dark={isDark} alt="SPIKE" className="rg-logo h-40 w-auto object-contain" /></div>
          <div key={`h-${mode}`} className="space-y-2">
            <div className="rg-in flex items-center justify-center gap-1.5 font-black text-xl" style={{ '--i': 0 }}>
              <span className={isDark ? 'text-white' : 'text-[#0A2A3E]'}>سبايك</span>
              <span className="text-slate-400 font-light">|</span>
              <span className="text-[var(--ac)] font-mono tracking-wider">SPIKE</span>
            </div>
            <h2 className={`rg-in text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`} style={{ '--i': 1 }}>{theme.headline && mode === 'register' ? theme.headline : title}</h2>
            {theme.subline && mode === 'register' ? <p className="rg-in text-xs text-slate-500" style={{ '--i': 2 }}>{theme.subline}</p> : null}
          </div>
        </div>

        <div className="rg-card rg-glass w-full rounded-3xl border p-5 sm:p-8 transition-colors" style={{ backgroundColor: isDark ? 'rgba(14,30,56,.72)' : 'rgba(255,255,255,.78)', borderColor: isDark ? 'rgba(148,163,184,.18)' : 'rgba(226,232,240,.9)' }}>
          <form key={mode} onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
            {msg && msg.mode === mode && (
              <div role="alert" className="rounded-xl p-3 text-[12px] font-bold leading-relaxed" style={{ background: msg.kind === 'ok' ? 'rgba(22,163,74,.12)' : 'rgba(239,68,68,.12)', color: msg.kind === 'ok' ? '#16a34a' : '#ef4444', border: `1px solid ${msg.kind === 'ok' ? 'rgba(22,163,74,.35)' : 'rgba(239,68,68,.35)'}` }}>{msg.text}</div>
            )}
            {mode === 'forgot' && <p className="rg-in font-normal text-slate-500" style={st()}>{t.forgotHint}</p>}
            {mode === 'reset' && (
              <div className="rg-in space-y-4" style={st()}>
                <p className="font-normal text-slate-500 text-center">{isAr ? 'اكتب الكود اللي وصلك على بريدك، وبعدها كلمة المرور الجديدة.' : 'Enter the emailed code, then your new password.'}</p>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} isDark={isDark} />
                <div className="text-center">
                  <button type="button" disabled={cooldown > 0} onClick={resendReset} className="text-[var(--ac)] font-black cursor-pointer hover:underline disabled:opacity-50 disabled:no-underline">
                    {cooldown > 0 ? (isAr ? `إعادة الإرسال بعد ${cooldown} ث` : `Resend in ${cooldown}s`) : (isAr ? 'إعادة إرسال الكود' : 'Resend code')}
                  </button>
                </div>
              </div>
            )}
            {mode === 'verify' && (
              <div className="rg-in space-y-4" style={st()}>
                <p className="font-normal text-slate-500 text-center">{isAr ? 'اكتب الكود اللي وصلك على بريدك. لو ما لقيتوش راجع السبام.' : 'Enter the code sent to your email. Check spam if you can’t find it.'}</p>
                <OtpInput value={otp} onChange={setOtp} disabled={loading} isDark={isDark} />
                <div className="text-center">
                  <button type="button" disabled={cooldown > 0} onClick={resendCode} className="text-[var(--ac)] font-black cursor-pointer hover:underline disabled:opacity-50 disabled:no-underline">
                    {cooldown > 0 ? (isAr ? `إعادة الإرسال بعد ${cooldown} ث` : `Resend in ${cooldown}s`) : (isAr ? 'إعادة إرسال الكود' : 'Resend code')}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && isAdminEmail && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-500 p-3 text-[11px] font-bold flex items-center justify-between gap-2">
                <span>{isAr ? 'هذا بريد الإدارة، مكانه تسجيل الدخول.' : 'This is the admin email — use Sign in.'}</span>
                <button type="button" onClick={() => switchMode('login')} className="underline cursor-pointer shrink-0">{t.submitLogin}</button>
              </div>
            )}

            {showRegisterFields && (
              <>
                <div className="rg-in space-y-1.5" style={st()}>
                  <label className={lbl}>{t.storeNameLabel}</label>
                  <div className={grp} dir="ltr">
                    <input type="text" required placeholder="store-name" value={formData.storeSlug} onChange={(e) => handleChange('storeSlug', e.target.value)} className={`flex-1 p-3 outline-none font-mono text-xs text-left bg-transparent ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
                    <span className={`${addon} border-l ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>.spike.shop</span>
                  </div>
                </div>
                <div className="rg-in space-y-1.5" style={st()}>
                  <label className={lbl}>{t.currencyLabel}</label>
                  <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)} className={inp}>
                    <option value="USD">{isAr ? 'دولار أمريكي - USD' : 'US Dollar - USD'}</option>
                    <option value="EGP">{isAr ? 'جنيه مصري - EGP' : 'Egyptian Pound - EGP'}</option>
                    <option value="SAR">{isAr ? 'ريال سعودي - SAR' : 'Saudi Riyal - SAR'}</option>
                    <option value="AED">{isAr ? 'درهم إماراتي - AED' : 'UAE Dirham - AED'}</option>
                  </select>
                </div>
                <div className="rg-in space-y-1.5" style={st()}>
                  <label className={lbl}>{t.nameLabel}</label>
                  <input type="text" name="name" autoComplete="name" required placeholder={isAr ? 'مثال: أحمد محمد' : 'e.g. John Doe'} value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className={inp} />
                </div>
                <div className="rg-in space-y-1.5" style={st()}>
                  <label className={lbl}>{t.phoneLabel}</label>
                  <div className={grp} dir="ltr">
                    <div className={`${addon} gap-1.5 border-r ${isDark ? 'border-slate-700' : 'border-slate-300'}`}><span>🇪🇬</span><span>+20</span></div>
                    <input type="tel" name="tel" autoComplete="tel" required placeholder="01xxxxxxxxx" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} className={`flex-1 p-3 outline-none font-mono text-xs text-left bg-transparent ${isDark ? 'text-white placeholder-slate-500' : 'text-slate-900 placeholder-slate-400'}`} />
                  </div>
                </div>
                <div className="rg-in space-y-1.5" style={st()}>
                  <label className={lbl}>{isAr ? 'كود ترحيبي (اختياري)' : 'Promo code (optional)'}</label>
                  <input type="text" dir="ltr" autoComplete="off" placeholder="WELCOME" value={formData.promo} onChange={(e) => handleChange('promo', e.target.value.toUpperCase())} className={`${inp} font-mono text-left`} />
                </div>
              </>
            )}

            {mode !== 'verify' && mode !== 'reset' && <div className="rg-in space-y-1.5" style={st()}>
              <label className={lbl}>{t.emailLabel}</label>
              <input type="email" name="email" autoComplete="username" required dir="ltr" placeholder="name@example.com" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} className={`${inp} font-mono text-left`} />
            </div>}

            {mode !== 'forgot' && mode !== 'verify' && (
              <div className="rg-in" style={st()}>
                <PassField id="password" label={t.passLabel} value={formData.password} onChange={(v) => handleChange('password', v)} shown={showPass} setShown={setShowPass} autoComplete={showLogin ? 'current-password' : 'new-password'} inp={inp} lbl={lbl} isAr={isAr} />
              </div>
            )}

            {(showRegisterFields || mode === 'reset') && formData.password && (
              <div className="rg-in" style={{ marginTop: -6 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2, 3].map((k) => <span key={k} style={{ flex: 1, height: 5, borderRadius: 4, background: k < score ? strengthMeta(score, isAr)[1] : (isDark ? '#334155' : '#e2e8f0'), transition: 'background .2s' }} />)}
                </div>
                <div className="font-normal" style={{ marginTop: 5, fontSize: 11, color: strengthMeta(score, isAr)[1] }}>
                  {isAr ? 'قوة كلمة المرور: ' : 'Strength: '}{strengthMeta(score, isAr)[0]}{score < 2 ? (isAr ? ' — استخدم 8 أحرف أو أكتر مع أرقام' : ' — use 8+ characters with numbers') : ''}
                </div>
              </div>
            )}

            {(showRegisterFields || mode === 'reset') && (
              <div className="rg-in" style={st()}>
                <PassField id="confirm-password" label={t.confirmPassLabel} value={formData.confirmPassword} onChange={(v) => handleChange('confirmPassword', v)} shown={showPass2} setShown={setShowPass2} autoComplete="new-password" inp={inp} lbl={lbl} isAr={isAr} />
              </div>
            )}

            {showLogin && (
              <div className="rg-in flex items-center justify-between gap-2" style={st()}>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-4 h-4 accent-[var(--ac)]" />
                  <span className={lbl}>{t.remember}</span>
                </label>
                <button type="button" onClick={() => setMode('forgot')} className="text-[var(--ac)] font-black cursor-pointer hover:underline">{t.forgot}</button>
              </div>
            )}

            {showRegisterFields && (
              <div className="rg-in space-y-2.5" style={st()}>
                <label className="flex items-start gap-2 cursor-pointer font-bold">
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[var(--ac)]" />
                  <span className={lbl}>{t.agreePre} <Link href="/terms" target="_blank" className="text-[var(--ac)] underline">{t.agreeLink}</Link></span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer font-bold">
                  <input type="checkbox" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[var(--ac)]" />
                  <span className={lbl}>{t.autoLogin}</span>
                </label>
              </div>
            )}

            <div className="pt-3 space-y-3">
              <div className="rg-in" style={st()}>
                <button type="submit" disabled={loading} className="rg-btn w-full py-3.5 text-white rounded-xl text-sm font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60">
                  <span className="relative z-10">{loading ? t.processing : mode === 'reset' ? (isAr ? 'تغيير كلمة المرور' : 'Change password') : mode === 'verify' ? (isAr ? 'تأكيد الحساب' : 'Verify account') : mode === 'forgot' ? t.submitForgot : showLogin ? t.submitLogin : t.submitRegister}</span>
                </button>
              </div>

              <div className="rg-in text-center pt-1" style={st()}>
                {mode === 'forgot' || mode === 'verify' || mode === 'reset' ? (
                  <button type="button" onClick={() => switchMode('login')} className="w-full py-2.5 border-2 border-[var(--ac)] text-[var(--ac)] hover:opacity-80 rounded-xl text-xs font-black transition cursor-pointer">{t.backLogin}</button>
                ) : (
                  <>
                    <span className="text-slate-400 text-xs block mb-2 font-normal">{isLoginMode ? t.noAccount : t.hasAccount}</span>
                    <button type="button" onClick={() => switchMode(isLoginMode ? 'register' : 'login')} className="w-full py-2.5 border-2 border-[var(--ac)] text-[var(--ac)] hover:opacity-80 rounded-xl text-xs font-black transition cursor-pointer">
                      {isLoginMode ? t.switchRegister : t.switchLogin}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="bg-[#121824] text-white pt-8 pb-6 px-4 sm:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto space-y-6">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 items-start">
            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.aboutTitle}</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li><Link href="/" className="hover:text-white transition">{t.home}</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition">{t.pricing}</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.academyTitle}</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px]">
                <li><span className="hover:text-white transition cursor-pointer">شروحات COD</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.devsTitle}</h4>
              <ul className="space-y-1.5 text-slate-400 text-[11px] font-mono">
                <li><span className="hover:text-white cursor-pointer">Public API</span></li>
                <li><span className="hover:text-white cursor-pointer">Webhooks</span></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs text-white">{t.appTitle}</h4>
              <div className="space-y-1.5">
                <div className="border border-slate-700 bg-black/40 rounded-lg p-1.5 flex items-center gap-2 cursor-pointer">
                  <span className="text-base">🍏</span>
                  <div>
                    <span className="text-[8px] text-slate-400 block leading-none">Download on</span>
                    <strong className="text-[10px] font-mono">App Store</strong>
                  </div>
                </div>
                <div className="border border-slate-700 bg-black/40 rounded-lg p-1.5 flex items-center gap-2 cursor-pointer">
                  <span className="text-base">▶️</span>
                  <div>
                    <span className="text-[8px] text-slate-400 block leading-none">GET IT ON</span>
                    <strong className="text-[10px] font-mono">Google Play</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-slate-500 text-[10px]">
            <div>{t.rights}</div>
            <div className="flex items-center gap-2 font-bold text-slate-400">
              <span className="text-white">EG</span>
              <span>•</span>
              <span>MA</span>
              <span>•</span>
              <span>DZ</span>
              <span>•</span>
              <span>SA</span>
            </div>
          </div>

        </div>
      </footer>

      <a
        href="https://wa.me/201000000000"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 z-50 w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center text-xl shadow-xl transition-transform active:scale-90 cursor-pointer"
        title="WhatsApp Support"
      >
        💬
      </a>

    </div>
  );
}
