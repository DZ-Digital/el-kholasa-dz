import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════
   الخلاصة الجزائرية — النسخة الكاملة v2
   تصميم راقٍ للمثقفين الجزائريين
   الألوان: أخضر جزائري #006233 + أحمر #D21034
   الوضع الفاتح افتراضياً
═══════════════════════════════════════════════════════════════ */

// ─── FONT + STYLES INJECTION ────────────────────────────────────
function injectAssets() {
  if (document.getElementById("kholasa-fonts")) return;
  const link = document.createElement("link");
  link.id = "kholasa-fonts";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cairo:wght@400;600;700;900&display=swap";
  document.head.appendChild(link);

  const style = document.createElement("style");
  style.id = "kholasa-css";
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --green: #006233; --green-light: #007a3d; --green-pale: #e8f5ee;
      --red: #D21034; --red-pale: #fdf0f2;
      --gold: #C5A028; --gold-pale: #fdf8e7;
      --ink: #1a1a2e; --ink-2: #2d3748; --ink-3: #4a5568;
      --mist: #f7f8fa; --mist-2: #eef0f4; --mist-3: #e2e5eb;
      --white: #ffffff;
      --card-bg: rgba(255,255,255,0.92);
      --card-border: rgba(0,0,0,0.07);
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 24px rgba(0,0,0,0.10);
      --shadow-lg: 0 8px 48px rgba(0,0,0,0.14);
      --radius: 16px; --radius-sm: 10px; --radius-pill: 50px;
      --font-display: 'Playfair Display', serif;
      --font-ar: 'Cairo', sans-serif;
      --font-body: 'IBM Plex Sans Arabic', sans-serif;
      --transition: 0.22s cubic-bezier(0.4,0,0.2,1);
    }
    .dark {
      --green: #00a854; --green-light: #00c462; --green-pale: rgba(0,168,84,0.12);
      --red: #ff4d6d; --red-pale: rgba(210,16,52,0.12);
      --gold: #ffd166; --gold-pale: rgba(197,160,40,0.12);
      --ink: #f0f4f8; --ink-2: #cbd5e0; --ink-3: #718096;
      --mist: #0d1117; --mist-2: #161b22; --mist-3: #21262d;
      --white: #1a1f27;
      --card-bg: rgba(22,27,34,0.94);
      --card-border: rgba(255,255,255,0.07);
      --shadow-sm: 0 2px 8px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 24px rgba(0,0,0,0.4);
      --shadow-lg: 0 8px 48px rgba(0,0,0,0.6);
    }
    body { background: var(--mist); color: var(--ink); font-family: var(--font-body); direction: rtl; }
    @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes slideDown{ from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes wave1    { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
    @keyframes wave2    { 0%,100%{transform:scaleY(.7)} 50%{transform:scaleY(.2)} }
    @keyframes wave3    { 0%,100%{transform:scaleY(1)}  50%{transform:scaleY(.4)} }
    @keyframes wave4    { 0%,100%{transform:scaleY(.4)} 50%{transform:scaleY(.9)} }
    @keyframes wave5    { 0%,100%{transform:scaleY(.6)} 50%{transform:scaleY(.3)} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes ticker   { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
    @keyframes progress { from{width:0} to{width:var(--target)} }
    .shimmer {
      background: linear-gradient(90deg,var(--mist-2) 25%,var(--mist-3) 50%,var(--mist-2) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    .fade-up { animation: fadeUp .5s ease forwards; }
    .pulse-dot { animation: pulse 1.4s ease-in-out infinite; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--mist-3); border-radius: 4px; }
    input:focus, textarea:focus { outline: 2px solid var(--green); outline-offset: 2px; }
    a { color: inherit; text-decoration: none; }
    button { cursor: pointer; border: none; background: none; font-family: inherit; }
    img { display: block; max-width: 100%; }
  `;
  document.head.appendChild(style);
}

// ─── SVG ICONS (real SVG, no emoji) ─────────────────────────────
const Icon = {
  Sun: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Search: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Bookmark: ({filled}) => <svg width="17" height="17" viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  Bell: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Menu: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X: ({size=18}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  External: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  ChevDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>,
  Volume: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/><path d="M19.07 4.93a10 10 0 010 14.14"/></svg>,
  VolumeOff: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>,
  Share: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  AlertTriangle: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  CheckCircle: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  MapPin: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  TrendUp: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendDown: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Refresh: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  Link: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  Zap: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Radio: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 010 8.49"/><path d="M7.76 7.76a6 6 0 000 8.49"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M4.93 4.93a10 10 0 000 14.14"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Cloud: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>,
  Newspaper: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></svg>,
};

// ─── DATA ────────────────────────────────────────────────────────
const CATEGORIES = [
  { slug:"all",      label:"كل الأخبار",   icon:<Icon.Newspaper/>, count:87 },
  { slug:"breaking", label:"عاجل",          icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, count:4, breaking:true },
  { slug:"politics", label:"سياسة",         icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>, count:12 },
  { slug:"economy",  label:"اقتصاد",        icon:<Icon.TrendUp/>, count:8 },
  { slug:"society",  label:"مجتمع",         icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>, count:15 },
  { slug:"security", label:"أمن وقضاء",    icon:<Icon.Shield/>, count:6 },
  { slug:"sports",   label:"رياضة",         icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20"/><path d="M2 12h20"/></svg>, count:10 },
  { slug:"energy",   label:"طاقة",          icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, count:5 },
  { slug:"health",   label:"صحة",           icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, count:7 },
  { slug:"world",    label:"دولي",          icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, count:9 },
  { slug:"tech",     label:"تكنولوجيا",    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, count:5 },
];

const MARKET_DATA = [
  { label:"الدولار 🇺🇸", value:"219.50", unit:"دج", change:"+1.2", up:true },
  { label:"اليورو 🇪🇺",  value:"238.80", unit:"دج", change:"+0.8", up:true },
  { label:"الذهب",        value:"18,420", unit:"دج/غ", change:"-0.3", up:false },
  { label:"البنزين 95",   value:"50",     unit:"دج/ل",  change:"0",   up:null },
  { label:"النفط برنت",  value:"84.20",  unit:"$",     change:"+0.6", up:true },
];

const WEATHER = [
  { city:"الجزائر", temp:22, icon:"⛅", desc:"غائم جزئياً" },
  { city:"وهران",   temp:25, icon:"☀️", desc:"مشمس" },
  { city:"قسنطينة",temp:18, icon:"🌧️", desc:"أمطار خفيفة" },
  { city:"سطيف",    temp:15, icon:"🌫️", desc:"ضبابي" },
];

const CLUSTERS = [
  {
    id:1, category:"politics", priority:1, is_breaking:true, is_developing:true,
    trust_score:94,
    title:"الرئيس تبون يترأس وفداً جزائرياً رفيع المستوى في قمة الجامعة العربية بالقاهرة",
    lead:"شارك الرئيس عبد المجيد تبون في أشغال القمة العربية بالقاهرة، حيث طرح مبادرات جزائرية لتعزيز التضامن العربي وإنشاء صندوق مشترك للأمن الغذائي بتمويل أولي بثلاثة مليارات دولار.",
    summary:[
      "ترأس الرئيس تبون الوفد الجزائري في القمة العربية بالقاهرة، مؤكداً أهمية توحيد الصف العربي في مواجهة التحديات الإقليمية المتصاعدة وملف إعادة بناء غزة.",
      "قدّمت الجزائر مبادرة لإنشاء صندوق عربي مشترك لدعم الأمن الغذائي بتمويل أولي بثلاثة مليارات دولار من دول الخليج ودول المغرب العربي مجتمعةً.",
      "أكدت وزارة الخارجية أن المحادثات الثنائية تناولت ملف إعادة فتح الحدود البرية مع المغرب، مع تفاؤل حذر من الطرفين حول آفاق الحل الدبلوماسي.",
    ],
    seo:"تبون في قمة عربية بالقاهرة: مبادرة أمن غذائي ومباحثات حدود مغربية.",
    image:"https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&h=800&fit=crop&q=85",
    alt:"قاعة القمة العربية بالقاهرة",
    sources:[
      { name:"الخبر",       url:"https://elkhabar.com",        color:"#c0392b", time:"منذ 30 د" },
      { name:"الشروق",      url:"https://echoroukonline.com",   color:"#e74c3c", time:"منذ ساعة" },
      { name:"وكالة الأنباء",url:"https://aps.dz/ar",          color:"#006233", time:"منذ 3 س" },
      { name:"النهار",      url:"https://ennaharonline.com",    color:"#16a085", time:"منذ ساعة" },
      { name:"TSA",         url:"https://tsa-algerie.com",      color:"#2980b9", time:"منذ 2 س" },
    ],
    timeline:[
      { text:"أعلنت رئاسة الجمهورية مشاركة الرئيس في القمة العربية", time:"أمس 14:00" },
      { text:"توجّه تبون على رأس وفد رفيع إلى القاهرة عبر الرحلة الخاصة", time:"اليوم 07:00" },
      { text:"ألقى الرئيس كلمة الجزائر مؤكداً الثوابت الجزائرية", time:"اليوم 11:00" },
      { text:"وقّع على مذكرة تفاهم ثنائية مع القاهرة في مجال الطاقة", time:"اليوم 14:30" },
    ],
    wilayas:["الجزائر العاصمة"], updated:"منذ 30 دقيقة", views:24531,
    trust_reasons:["5 مصادر موثوقة", "وكالة أنباء رسمية", "تأكيد رئاسي مباشر"],
  },
  {
    id:2, category:"sports", priority:1, is_breaking:true, is_developing:false,
    trust_score:97,
    title:"الخضر يُتوَّجون بكأس أمم أفريقيا بعد انتصار تاريخي في النهائي أمام المغرب",
    lead:"كتب المنتخب الجزائري صفحة ذهبية جديدة في تاريخ كرة القدم الأفريقية بفوزه في ركلات الترجيح بعد تعادل 1-1 في الوقت الأصلي.",
    summary:[
      "توّج المنتخب الجزائري بلقب كأس أمم أفريقيا 2025 بعد مباراة نهائية استثنائية انتهت 1-1، قبل أن يُحسم الأمر لصالح الخضر في ركلات الترجيح بنتيجة 5-3.",
      "سجّل رياض محرز الهدف الجزائري الوحيد في الدقيقة 78 بعد مراوغة خاطفة، فيما أبدع الحارس رايس مبولحي بصده لركلتين حاسمتين.",
      "أعلنت رئاسة الجمهورية يوم الثلاثاء عطلة وطنية استثنائية، واستقبالاً شعبياً رسمياً للبعثة الرياضية في قصر الأمم بالجزائر العاصمة.",
    ],
    seo:"الجزائر تتوج بكأس أمم أفريقيا 2025 — عطلة وطنية الثلاثاء.",
    image:"https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=800&fit=crop&q=85",
    alt:"احتفالات المنتخب الجزائري",
    sources:[
      { name:"الخبر",   url:"https://elkhabar.com",      color:"#c0392b", time:"أمس 23:30" },
      { name:"الشروق",  url:"https://echoroukonline.com", color:"#e74c3c", time:"أمس 23:45" },
      { name:"النهار",  url:"https://ennaharonline.com",  color:"#16a085", time:"منذ ساعة" },
      { name:"DZfoot",  url:"https://dzfoot.com",          color:"#2980b9", time:"منذ ساعتين" },
    ],
    timeline:[], wilayas:["وطني"], updated:"منذ ساعة", views:89120,
    trust_reasons:["4 مصادر رياضية متخصصة","تغطية مباشرة من الملعب","بيان رسمي من رئاسة الجمهورية"],
  },
  {
    id:3, category:"economy", priority:2, is_breaking:false, is_developing:false,
    trust_score:88,
    title:"الحكومة تُقرّ تخفيضاً ملموساً في أسعار الوقود ابتداءً من مطلع فبراير",
    lead:"أعلنت وزارة الطاقة والمناجم عن تخفيض سعر البنزين بنوعيه وزيت الغاز ضمن حزمة إجراءات دعم القدرة الشرائية للمواطنين.",
    summary:[
      "أقرّت الحكومة تخفيض سعر البنزين بنسبة 12% وزيت الغاز بنسبة 8%، ليبدأ التطبيق الفعلي مطلع فبراير في جميع محطات الوقود عبر التراب الوطني.",
      "أوضح وزير الطاقة أن القرار يأتي في إطار توجيهات رئاسية لتعزيز القدرة الشرائية واستيعاب تداعيات التضخم العالمي على الأسرة الجزائرية.",
      "رصد اقتصاديون أن التخفيض سيُلقي بظلاله إيجاباً على النقل العام والشحن، مع توقعات بانخفاض السلع الأساسية تدريجياً خلال ستة أسابيع.",
    ],
    seo:"الجزائر تخفض أسعار الوقود 12% — تطبيق فوري من فبراير 2025.",
    image:"https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=900&h=600&fit=crop&q=80",
    alt:"محطة وقود في الجزائر",
    sources:[
      { name:"الخبر",       url:"https://elkhabar.com",      color:"#c0392b", time:"أمس 16:00" },
      { name:"الشروق",      url:"https://echoroukonline.com", color:"#e74c3c", time:"أمس 16:30" },
      { name:"الجزائر 360", url:"https://algerie360.com",    color:"#f39c12", time:"أمس 17:30" },
    ],
    timeline:[], wilayas:["وطني"], updated:"منذ 8 ساعات", views:18244,
    trust_reasons:["بيان وزاري رسمي","3 مصادر إعلامية","تأكيد من الديوان الوطني للإحصاء"],
  },
  {
    id:4, category:"society", priority:3, is_breaking:false, is_developing:false,
    trust_score:91,
    title:"نتائج البكالوريا 2025: نسبة النجاح ترتفع إلى 63.8% وتيزي وزو في المقدمة",
    lead:"كشفت وزارة التربية الوطنية عن أعلى نسبة نجاح منذ خمس سنوات في امتحانات شهادة البكالوريا دورة 2025.",
    summary:[
      "أعلنت وزارة التربية نسبة نجاح إجمالية 63.8% في البكالوريا 2025، بارتفاع 4.2 نقطة مقارنة بالسنة الماضية، وتُعدّ الأعلى منذ 2020.",
      "تصدّرت ولاية تيزي وزو الترتيب الوطني بنسبة 72.1%، تليها ولاية البويرة 70.8%، فيما سجّلت شعبة الرياضيات أعلى معدل وطني للمرة الثانية.",
      "تنطلق عملية التسجيل الجامعي عبر البوابة الإلكترونية مباشرة بعد الإعلان، مع تمديد المهلة عشرة أيام للمترشحين من ذوي الاحتياجات الخاصة.",
    ],
    seo:"بكالوريا 2025: نسبة نجاح 63.8% — تيزي وزو الأولى وطنياً.",
    image:"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&h=600&fit=crop&q=80",
    alt:"طلاب البكالوريا",
    sources:[
      { name:"الخبر",  url:"https://elkhabar.com",      color:"#c0392b", time:"اليوم 06:00" },
      { name:"الشروق", url:"https://echoroukonline.com", color:"#e74c3c", time:"اليوم 06:15" },
      { name:"وأج",    url:"https://aps.dz/ar",          color:"#006233", time:"اليوم 05:30" },
    ],
    timeline:[], wilayas:["تيزي وزو","البويرة","وهران","قسنطينة"], updated:"منذ 4 ساعات", views:41200,
    trust_reasons:["بيان رسمي من وزارة التربية","وكالة الأنباء الجزائرية","تغطية إعلامية واسعة"],
  },
  {
    id:5, category:"energy", priority:3, is_breaking:false, is_developing:false,
    trust_score:86,
    title:"سوناطراك توقّع عقوداً بـ8 مليارات دولار لتوريد الغاز لإيطاليا وإسبانيا",
    lead:"وقّعت المجموعة الجزائرية للمحروقات حزمة عقود استراتيجية لتعزيز إمدادات الغاز نحو جنوب أوروبا لمدة عشر سنوات.",
    summary:[
      "أبرمت سوناطراك عقوداً مع ENI الإيطالية وRepsol الإسبانية بإجمالي 8 مليارات دولار لتوريد 15 مليار متر مكعب سنوياً لمدة عشر سنوات.",
      "تعزّز هذه العقود مكانة الجزائر مورداً رئيسياً للغاز الأوروبي في سياق التحولات الطاقوية وتراجع الاعتماد على الغاز الروسي.",
      "أعلن الرئيس التنفيذي أن سوناطراك ستضخّ 5 مليارات دولار في تطوير حقول جديدة خلال السنوات الثلاث المقبلة بشراكة أوروبية.",
    ],
    seo:"سوناطراك تبرم 8 مليارات دولار لتوريد الغاز لإيطاليا وإسبانيا.",
    image:"https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=900&h=600&fit=crop&q=80",
    alt:"منشأة غاز سوناطراك",
    sources:[
      { name:"الخبر",      url:"https://elkhabar.com",    color:"#c0392b", time:"أمس 14:00" },
      { name:"TSA",        url:"https://tsa-algerie.com",  color:"#2980b9", time:"أمس 14:30" },
      { name:"وأج",        url:"https://aps.dz/ar",        color:"#006233", time:"أمس 13:00" },
    ],
    timeline:[], wilayas:["حاسي مسعود","إن أمناس"], updated:"منذ يوم", views:12800,
    trust_reasons:["إعلان رسمي من سوناطراك","تأكيد ENI الإيطالية","تغطية بلومبرغ"],
  },
  {
    id:6, category:"security", priority:4, is_breaking:false, is_developing:false,
    trust_score:79,
    title:"تفكيك شبكة إجرامية من 14 عنصراً متخصصة في سرقة السيارات بالعاصمة",
    lead:"نجحت الشرطة القضائية في تفكيك شبكة منظمة عملت لأكثر من ثلاثة أشهر في سرقة المركبات بوثائق مزورة.",
    summary:[
      "أعلنت الشرطة القضائية تفكيك شبكة من 14 مشتبهاً بهم متخصصين في سرقة السيارات وإعادة بيعها بوثائق مزورة في ولايات متعددة.",
      "ضُبطت أكثر من 23 مركبة مسروقة وحُجزت معدات تقنية للاختراق الإلكتروني لأنظمة تشغيل السيارات الحديثة.",
      "المشتبه بهم موضوعون تحت الحراسة النظرية على ذمة التحقيق القضائي الجاري بإشراف وكيل الجمهورية المختص.",
    ],
    seo:"شرطة الجزائر تفكك شبكة سرقة سيارات 14 عنصراً وتحجز 23 مركبة.",
    image:"https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?w=900&h=600&fit=crop&q=80",
    alt:"عملية أمنية في الجزائر",
    sources:[
      { name:"النهار",  url:"https://ennaharonline.com", color:"#16a085", time:"اليوم 08:00" },
      { name:"الشروق",  url:"https://echoroukonline.com", color:"#e74c3c", time:"اليوم 09:00" },
    ],
    timeline:[], wilayas:["الجزائر العاصمة","تيبازة"], updated:"منذ 3 ساعات", views:8900,
    trust_reasons:["بلاغ رسمي من المديرية العامة للأمن","تأكيد النيابة العامة"],
  },
  {
    id:7, category:"health", priority:5, is_breaking:false, is_developing:false,
    trust_score:93,
    title:"وزارة الصحة تُطلق الحملة الوطنية للتلقيح ضد الأنفلونزا في 48 ولاية",
    lead:"انطلقت الحملة الوطنية للتلقيح بتوفير 3 ملايين جرعة موزّعة على المراكز الصحية في كامل التراب الوطني.",
    summary:[
      "أطلقت وزارة الصحة الحملة الوطنية للتلقيح ضد الأنفلونزا الموسمية بـ3 ملايين جرعة موزّعة على المراكز الصحية في 48 ولاية.",
      "يستهدف البرنامج بالأولوية كبار السن فوق 60 عاماً والحوامل وأصحاب الأمراض المزمنة والأطفال دون السادسة.",
      "اللقاح متاح مجاناً في جميع المستشفيات العمومية والمراكز الصحية الجوارية حتى نهاية موسم الشتاء.",
    ],
    seo:"الجزائر تطلق حملة تلقيح أنفلونزا بـ3 ملايين جرعة في 48 ولاية — مجاناً.",
    image:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&h=600&fit=crop&q=80",
    alt:"حملة تلقيح صحية",
    sources:[
      { name:"الخبر",  url:"https://elkhabar.com",     color:"#c0392b", time:"أمس 10:00" },
      { name:"وأج",    url:"https://aps.dz/ar",         color:"#006233", time:"أمس 09:30" },
      { name:"النهار", url:"https://ennaharonline.com", color:"#16a085", time:"أمس 11:00" },
    ],
    timeline:[], wilayas:["وطني"], updated:"منذ يوم", views:6700,
    trust_reasons:["بيان وزارة الصحة الرسمي","وكالة الأنباء الجزائرية","منظمة الصحة العالمية"],
  },
  {
    id:8, category:"tech", priority:5, is_breaking:false, is_developing:false,
    trust_score:82,
    title:"الجزائر تطلق مشروع الفضاء الرقمي الحر لتوفير إنترنت مجاني للطلاب والمثقفين",
    lead:"أعلنت وزارة الرقمنة إطلاق مشروع طموح لتوفير اتصال مجاني بالإنترنت في 5000 نقطة على مستوى الجمهورية.",
    summary:[
      "تُطلق وزارة الرقمنة مشروع الفضاء الرقمي الحر بتوفير واي فاي مجاني في 5000 نقطة شاملة الجامعات والمكتبات والفضاءات العامة.",
      "يستهدف المشروع في مرحلته الأولى 48 ولاية بسرعات تصل إلى 100 ميغابيت، مع التوسع التدريجي نحو المناطق الريفية والجبلية.",
      "يندرج هذا المشروع ضمن استراتيجية الجزائر الرقمية 2030 الهادفة إلى تحقيق الشمول الرقمي وتقليص الهوة التكنولوجية.",
    ],
    seo:"الجزائر توفر إنترنت مجاني في 5000 نقطة ضمن مشروع الفضاء الرقمي الحر.",
    image:"https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=900&h=600&fit=crop&q=80",
    alt:"تكنولوجيا رقمية",
    sources:[
      { name:"الشروق",    url:"https://echoroukonline.com", color:"#e74c3c", time:"أمس 15:00" },
      { name:"وأج",       url:"https://aps.dz/ar",          color:"#006233", time:"أمس 14:30" },
    ],
    timeline:[], wilayas:["وطني"], updated:"منذ يومين", views:7100,
    trust_reasons:["بيان وزارة الرقمنة","تأكيد رسمي من الحكومة"],
  },
];

// ─── FAKE-NEWS ANALYSIS ENGINE (AI-powered via Claude API) ──────
async function analyzeUrl(url, apiKey) {
  // Call Claude API for analysis
  const prompt = `أنت محلل أخبار جزائري خبير في كشف الأخبار الزائفة. حلّل هذا الرابط أو الخبر التالي وأعطِ تقريراً دقيقاً باللغة العربية بصيغة JSON فقط بدون أي نص خارجه:

الرابط/الخبر: "${url}"

أعطِ النتيجة بهذا الشكل الدقيق:
{
  "score": <رقم من 0 إلى 100 حيث 100 = موثوق تماماً>,
  "verdict": "<موثوق | مشكوك فيه | زائف على الأرجح | زائف>",
  "verdict_color": "<green | yellow | orange | red>",
  "headline": "<عنوان الخبر المستخرج أو المفترض>",
  "reasons": ["<سبب 1>", "<سبب 2>", "<سبب 3>"],
  "red_flags": ["<علامة تحذير 1 إن وجدت>"],
  "confirming_sources": ["<مصدر موثوق يؤكده إن وجد>"],
  "denying_sources": ["<مصدر ينفيه إن وجد>"],
  "spread_date": "<تاريخ انتشار الخبر التقريبي>",
  "recommendation": "<توصية قصيرة للمستخدم>"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error("تعذّر تحليل الاستجابة");
}

// ─── HOOKS ──────────────────────────────────────────────────────
function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("kholasa-theme") === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("kholasa-theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);
  return { dark, toggle: () => setDark(v => !v) };
}

function useSaved() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kholasa-saved") || "[]"); } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem("kholasa-saved", JSON.stringify(saved)); } catch {} }, [saved]);
  const toggle = useCallback((c) => setSaved(p => p.some(s => s.id === c.id) ? p.filter(s => s.id !== c.id) : [{ id:c.id, title:c.title, image:c.image, summary:c.summary, savedAt:new Date().toISOString() }, ...p]), []);
  return { saved, toggle, isSaved: useCallback((id) => saved.some(s => s.id === id), [saved]), remove: (id) => setSaved(p => p.filter(s => s.id !== id)) };
}

function useAudio() {
  const [st, setSt] = useState({ id:null, playing:false });
  const stop = useCallback(() => { window.speechSynthesis?.cancel(); setSt({ id:null, playing:false }); }, []);
  const speak = useCallback((c) => {
    if (!window.speechSynthesis) return;
    if (st.id === c.id && st.playing) { window.speechSynthesis.pause(); setSt(s => ({...s, playing:false})); return; }
    window.speechSynthesis.cancel();
    const text = `${c.title}. الملخص: ${c.summary.map((p,i) => `النقطة ${i+1}: ${p}`).join(". ")}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA"; u.rate = 0.88;
    const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ar"));
    if (v) u.voice = v;
    u.onstart = () => setSt({ id:c.id, playing:true });
    u.onend = u.onerror = () => setSt({ id:null, playing:false });
    window.speechSynthesis.speak(u);
  }, [st]);
  return { st, speak, stop };
}

// ─── WAVEFORM SVG ────────────────────────────────────────────────
function Waveform({ playing, color="#006233" }) {
  return (
    <svg width="24" height="14" viewBox="0 0 24 14" style={{display:"inline-block",verticalAlign:"middle"}}>
      {[.4,.8,1,.7,.5].map((h,i) => {
        const bh=14*h, y=(14-bh)/2, x=1+i*4.6;
        return <rect key={i} x={x} y={y} width="2.8" height={bh} rx="1.4" fill={color}
          style={{transformOrigin:`${x+1.4}px 7px`,animation:playing?`wave${i+1} ${.6+i*.1}s ease-in-out ${i*.1}s infinite`:"none",transition:"fill .3s"}}/>;
      })}
    </svg>
  );
}

// ─── TRUST BADGE ─────────────────────────────────────────────────
function TrustBadge({ score, compact }) {
  const color = score >= 85 ? "#006233" : score >= 65 ? "#C5A028" : "#D21034";
  const label = score >= 85 ? "موثوق" : score >= 65 ? "تحقّق منه" : "مشكوك فيه";
  const BgColor = score >= 85 ? "rgba(0,98,51,0.1)" : score >= 65 ? "rgba(197,160,40,0.1)" : "rgba(210,16,52,0.1)";
  if (compact) return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:50,fontSize:10,fontWeight:700,background:BgColor,color,fontFamily:"var(--font-ar)"}}>
      <Icon.Shield/> {score}%
    </span>
  );
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:4,borderRadius:4,background:"var(--mist-3)",overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:4,background:color,width:`${score}%`,transition:"width 1s ease"}}/>
      </div>
      <span style={{fontSize:11,fontWeight:700,color,fontFamily:"var(--font-ar)",whiteSpace:"nowrap"}}>{label} {score}%</span>
    </div>
  );
}

// ─── SOURCE DOCK ─────────────────────────────────────────────────
function SourceDock({ sources, dark }) {
  return (
    <div>
      <p style={{fontSize:10,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--ink-3)",fontFamily:"var(--font-ar)",marginBottom:8}}>اقرأ التغطية الكاملة</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
        {sources.map(s => (
          <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:50,fontSize:11,fontWeight:600,fontFamily:"var(--font-ar)",background:"var(--card-bg)",border:"1px solid var(--card-border)",color:"var(--ink-2)",textDecoration:"none",transition:"var(--transition)","--hover-bg":"var(--green-pale)"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--green)";e.currentTarget.style.color="var(--green)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--card-border)";e.currentTarget.style.color="var(--ink-2)";}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:s.color,flexShrink:0}}/>
            {s.name}
            <span style={{opacity:.5}}><Icon.External/></span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── CLUSTER CARD ─────────────────────────────────────────────────
function ClusterCard({ c, hero, dark, audio, onAudio, isSaved, onSave }) {
  const [expanded, setExpanded] = useState(hero);
  const [imgErr, setImgErr] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const playing = audio.id === c.id && audio.playing;

  const catColor = { breaking:"var(--red)", politics:"#1a5fa8", economy:"var(--green)", society:"#7c3aed", security:"#c2410c", sports:"#b45309", energy:"#0369a1", health:"#0f766e", world:"#4338ca", tech:"#0e7490" }[c.category] || "var(--green)";

  const s = { // styles
    card: { background:"var(--card-bg)", border:"1px solid var(--card-border)", borderRadius:hero?20:16, overflow:"hidden", transition:"var(--transition)", cursor:"pointer", boxShadow:"var(--shadow-sm)" },
    title: { fontFamily:"var(--font-ar)", fontWeight:800, color:"var(--ink)", lineHeight:1.65, fontSize:hero?22:15 },
    meta: { fontSize:11, color:"var(--ink-3)", fontFamily:"var(--font-body)" },
  };

  return (
    <article style={s.card} dir="rtl"
      onClick={() => setExpanded(v=>!v)}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--shadow-md)";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--shadow-sm)";e.currentTarget.style.transform="translateY(0)";}}>

      {/* Breaking bar */}
      {c.is_breaking && <div style={{height:3,background:`linear-gradient(90deg,${catColor},var(--red),${catColor})`,animation:"pulse 2s infinite"}}/>}

      {/* Image 3:2 */}
      <div style={{aspectRatio:"3/2",overflow:"hidden",position:"relative",background:"var(--mist-2)"}}>
        {!imgErr && c.image
          ? <img src={c.image} alt={c.alt} loading={hero?"eager":"lazy"} onError={()=>setImgErr(true)}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block",transition:"transform .6s ease"}}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}/>
          : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--mist-3)" strokeWidth="1.5"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z"/></svg>
            </div>}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.72) 0%,rgba(0,0,0,.08) 55%,transparent 100%)"}}/>

        {/* Top badges */}
        <div style={{position:"absolute",top:12,right:12,display:"flex",gap:6,flexWrap:"wrap"}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:50,fontSize:11,fontWeight:700,backdropFilter:"blur(10px)",background:`${catColor}22`,color:catColor,border:`1px solid ${catColor}44`,fontFamily:"var(--font-ar)"}}>
            {c.is_breaking && <span style={{width:6,height:6,borderRadius:"50%",background:"var(--red)",animation:"pulse 1.2s infinite"}}/>}
            {{breaking:"عاجل",politics:"سياسة",economy:"اقتصاد",society:"مجتمع",security:"أمن",sports:"رياضة",energy:"طاقة",health:"صحة",world:"دولي",tech:"تقنية"}[c.category]||c.category}
          </span>
          {c.is_developing && <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:50,fontSize:11,fontWeight:700,backdropFilter:"blur(10px)",background:"rgba(197,160,40,.2)",color:"var(--gold)",border:"1px solid rgba(197,160,40,.3)",fontFamily:"var(--font-ar)"}}>
            <Icon.Radio/> متطور
          </span>}
        </div>

        {/* Trust score on image */}
        <div style={{position:"absolute",bottom:12,right:12}}><TrustBadge score={c.trust_score} compact/></div>

        {c.sources.length>1 && <div style={{position:"absolute",bottom:12,left:12}}>
          <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:50,fontSize:11,fontWeight:600,backdropFilter:"blur(10px)",background:"rgba(0,0,0,.5)",color:"rgba(255,255,255,.9)",border:"1px solid rgba(255,255,255,.15)",fontFamily:"var(--font-ar)"}}>
            <Icon.TrendUp/> {c.sources.length} مصادر
          </span>
        </div>}
      </div>

      {/* Body */}
      <div style={{padding:hero?"20px 22px 22px":16}}>
        {/* Meta */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{...s.meta,display:"flex",alignItems:"center",gap:4}}><Icon.Clock/>{c.updated}</span>
            {c.wilayas?.[0] && c.wilayas[0]!=="وطني" && c.wilayas[0]!=="وطني" && <span style={{...s.meta,display:"flex",alignItems:"center",gap:4}}><Icon.MapPin/>{c.wilayas[0]}</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {/* Audio */}
            <button onClick={e=>{e.stopPropagation();onAudio(c);}}
              style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:50,fontSize:11,fontWeight:600,fontFamily:"var(--font-ar)",background:playing?"var(--green-pale)":"var(--mist-2)",border:playing?"1px solid rgba(0,98,51,.25)":"1px solid var(--card-border)",color:playing?"var(--green)":"var(--ink-3)",transition:"var(--transition)"}}>
              {playing ? <Waveform playing color="var(--green)"/> : <Icon.Volume/>}
            </button>
            {/* Save */}
            <button onClick={e=>{e.stopPropagation();onSave(c);}}
              style={{padding:6,borderRadius:8,color:isSaved?"var(--gold)":"var(--ink-3)",transition:"var(--transition)"}}>
              <Icon.Bookmark filled={isSaved}/>
            </button>
            {/* Share */}
            <button onClick={e=>{e.stopPropagation();if(navigator.share)navigator.share({title:c.title,text:c.seo,url:window.location.href});}}
              style={{padding:6,borderRadius:8,color:"var(--ink-3)",transition:"var(--transition)"}}>
              <Icon.Share/>
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 style={s.title}>
          {c.is_breaking && <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:900,background:"var(--red)",color:"#fff",marginLeft:8,verticalAlign:"middle"}}><Icon.Zap/>عاجل</span>}
          {c.title}
        </h2>

        {/* Lead hero */}
        {hero && c.lead && <p style={{fontFamily:"var(--font-body)",fontSize:13,lineHeight:1.8,color:"var(--ink-2)",marginTop:10}}>{c.lead}</p>}

        {/* Trust bar */}
        <div style={{marginTop:12}}><TrustBadge score={c.trust_score}/></div>

        {/* Summary toggle */}
        <button onClick={e=>{e.stopPropagation();setExpanded(v=>!v);}}
          style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:12,color:"var(--ink-3)",fontSize:11,fontWeight:600,fontFamily:"var(--font-ar)",padding:"5px 0",transition:"color .2s"}}
          onMouseEnter={e=>e.currentTarget.style.color="var(--green)"}
          onMouseLeave={e=>e.currentTarget.style.color="var(--ink-3)"}>
          الجوهر الرئيسي {expanded?<Icon.ChevUp/>:<Icon.ChevDown/>}
        </button>

        {/* AI Summary */}
        {expanded && <div style={{marginTop:10,borderRadius:12,padding:16,background:"var(--mist)",border:"1px solid var(--mist-3)",animation:"slideDown .25s ease"}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
            <div style={{width:3,height:16,borderRadius:2,background:"linear-gradient(var(--green),#00a854)",flexShrink:0}}/>
            <span style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:"var(--green)"}}>الخلاصة الذكية — ٣ نقاط</span>
          </div>
          <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:10}} dir="rtl">
            {c.summary.slice(0,3).map((p,i) => (
              <li key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{flexShrink:0,width:20,height:20,borderRadius:"50%",background:"rgba(0,98,51,.1)",color:"var(--green)",fontSize:10,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",marginTop:2}}>{i+1}</span>
                <p style={{fontFamily:"var(--font-body)",fontSize:13,lineHeight:1.75,color:"var(--ink-2)",flex:1}}>{p}</p>
              </li>
            ))}
          </ul>

          {/* Trust reasons */}
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--mist-3)",display:"flex",flexWrap:"wrap",gap:6}}>
            {c.trust_reasons?.map((r,i) => (
              <span key={i} style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:50,fontSize:10,background:"rgba(0,98,51,.08)",color:"var(--green)",fontFamily:"var(--font-body)"}}>
                <Icon.CheckCircle/>{r}
              </span>
            ))}
          </div>
        </div>}

        {/* Timeline */}
        {c.is_developing && c.timeline.length>0 && <div style={{marginTop:12}}>
          <button onClick={e=>{e.stopPropagation();setShowTimeline(v=>!v);}}
            style={{display:"inline-flex",alignItems:"center",gap:5,color:"var(--gold)",fontSize:11,fontWeight:600,fontFamily:"var(--font-ar)"}}>
            <Icon.Radio/> التطورات ({c.timeline.length}) {showTimeline?<Icon.ChevUp/>:<Icon.ChevDown/>}
          </button>
          {showTimeline && <div style={{marginTop:10,borderRight:"2px solid rgba(197,160,40,.4)",paddingRight:14,display:"flex",flexDirection:"column",gap:10,animation:"slideDown .25s ease"}}>
            {c.timeline.map((t,i) => (
              <div key={i} style={{position:"relative"}}>
                <div style={{position:"absolute",right:-20,top:5,width:10,height:10,borderRadius:"50%",background:"rgba(197,160,40,.6)",border:"2px solid var(--gold)"}}/>
                <p style={{fontFamily:"var(--font-body)",fontSize:12,lineHeight:1.7,color:"var(--ink-2)"}}>{t.text}</p>
                <span style={{fontSize:10,color:"var(--ink-3)"}}>{t.time}</span>
              </div>
            ))}
          </div>}
        </div>}

        {/* Source Dock */}
        {expanded && <div style={{marginTop:14}} onClick={e=>e.stopPropagation()}><SourceDock sources={c.sources} dark={dark}/></div>}
      </div>
    </article>
  );
}

// ─── FAKE NEWS DETECTOR ──────────────────────────────────────────
function FakeNewsDetector({ dark }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setResult(null); setError("");
    try {
      const r = await analyzeUrl(url.trim());
      setResult(r);
    } catch(e) {
      setError("تعذّر التحليل. تأكد من الرابط وحاول مجدداً.");
    }
    setLoading(false);
  };

  const verdictColor = { green:"var(--green)", yellow:"var(--gold)", orange:"#ea580c", red:"var(--red)" };
  const verdictBg    = { green:"rgba(0,98,51,.08)", yellow:"rgba(197,160,40,.08)", orange:"rgba(234,88,12,.08)", red:"rgba(210,16,52,.08)" };

  return (
    <section style={{borderRadius:20,border:"1px solid var(--card-border)",background:"var(--card-bg)",overflow:"hidden",boxShadow:"var(--shadow-md)"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#006233 0%,#004d28 100%)",padding:"20px 22px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>
          <Icon.Shield/>
        </div>
        <div>
          <h2 style={{fontFamily:"var(--font-ar)",fontSize:17,fontWeight:800,color:"#fff"}}>رادار الحقيقة</h2>
          <p style={{fontFamily:"var(--font-body)",fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>كاشف الأخبار الزائفة — مدعوم بالذكاء الاصطناعي</p>
        </div>
        <div style={{marginRight:"auto",background:"rgba(255,255,255,.1)",borderRadius:8,padding:"4px 10px"}}>
          <span style={{fontFamily:"var(--font-ar)",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.85)"}}>تلقائي + يدوي</span>
        </div>
      </div>

      <div style={{padding:20}}>
        {/* Input */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"var(--mist)",border:"1.5px solid var(--mist-3)",borderRadius:12,padding:"10px 14px",transition:"var(--transition)"}}>
            <Icon.Link/>
            <input value={url} onChange={e=>setUrl(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&analyze()}
              placeholder="الصق رابط الخبر أو نصه هنا للتحليل..."
              style={{flex:1,background:"none",border:"none",outline:"none",fontFamily:"var(--font-body)",fontSize:13,color:"var(--ink)",direction:"rtl"}}/>
            {url && <button onClick={()=>setUrl("")} style={{color:"var(--ink-3)",padding:2}}><Icon.X size={14}/></button>}
          </div>
          <button onClick={analyze} disabled={!url.trim()||loading}
            style={{padding:"10px 20px",borderRadius:12,background:url.trim()&&!loading?"var(--green)":"var(--mist-3)",color:url.trim()&&!loading?"#fff":"var(--ink-3)",fontFamily:"var(--font-ar)",fontSize:13,fontWeight:700,transition:"var(--transition)",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {loading ? <span style={{display:"inline-block",animation:"spin 1s linear infinite"}}><Icon.Refresh/></span> : <Icon.Shield/>}
            {loading?"جارٍ التحليل...":"تحليل"}
          </button>
        </div>

        {/* Error */}
        {error && <div style={{padding:"10px 14px",borderRadius:10,background:"var(--red-pale)",border:"1px solid rgba(210,16,52,.15)",color:"var(--red)",fontFamily:"var(--font-body)",fontSize:12,marginBottom:12}}>{error}</div>}

        {/* Loading shimmer */}
        {loading && <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[100,75,90,60].map((w,i) => <div key={i} className="shimmer" style={{height:16,borderRadius:8,width:`${w}%`}}/>)}
        </div>}

        {/* Result */}
        {result && !loading && (
          <div style={{animation:"fadeUp .4s ease"}}>
            {/* Verdict */}
            <div style={{padding:16,borderRadius:14,background:verdictBg[result.verdict_color]||verdictBg.yellow,border:`1.5px solid ${verdictColor[result.verdict_color]||"var(--gold)"}33`,marginBottom:14}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {result.score>=85 ? <Icon.CheckCircle/> : <Icon.AlertTriangle/>}
                  <span style={{fontFamily:"var(--font-ar)",fontSize:15,fontWeight:800,color:verdictColor[result.verdict_color]}}>{result.verdict}</span>
                </div>
                <span style={{fontSize:22,fontWeight:900,color:verdictColor[result.verdict_color],fontFamily:"var(--font-display)"}}>{result.score}%</span>
              </div>

              {/* Score bar */}
              <div style={{height:6,borderRadius:3,background:"var(--mist-3)",overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",borderRadius:3,background:verdictColor[result.verdict_color],width:`${result.score}%`,transition:"width 1.2s ease"}}/>
              </div>

              {result.headline && <p style={{fontFamily:"var(--font-ar)",fontSize:13,fontWeight:700,color:"var(--ink-2)",marginBottom:8}}>"{result.headline}"</p>}
              <p style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--ink-3)"}}>{result.recommendation}</p>
            </div>

            {/* Details Grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {/* Reasons */}
              <div style={{padding:12,borderRadius:12,background:"var(--mist)",border:"1px solid var(--mist-3)"}}>
                <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--green)",marginBottom:8}}>✅ أسباب الحكم</p>
                {result.reasons?.map((r,i) => <p key={i} style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-2)",lineHeight:1.6,marginBottom:4}}>• {r}</p>)}
              </div>
              {/* Red flags */}
              <div style={{padding:12,borderRadius:12,background:"var(--mist)",border:"1px solid var(--mist-3)"}}>
                <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--red)",marginBottom:8}}>⚠️ علامات تحذير</p>
                {result.red_flags?.length ? result.red_flags.map((r,i) => <p key={i} style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-2)",lineHeight:1.6,marginBottom:4}}>• {r}</p>)
                  : <p style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-3)"}}>لا توجد علامات تحذير</p>}
              </div>
            </div>

            {/* Sources confirming/denying */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              {result.confirming_sources?.length>0 && <div style={{padding:12,borderRadius:12,border:"1px solid rgba(0,98,51,.2)",background:"rgba(0,98,51,.05)"}}>
                <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--green)",marginBottom:6}}>مصادر تؤكده</p>
                {result.confirming_sources.map((s,i) => <p key={i} style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-2)",marginBottom:3}}>• {s}</p>)}
              </div>}
              {result.denying_sources?.length>0 && <div style={{padding:12,borderRadius:12,border:"1px solid rgba(210,16,52,.2)",background:"rgba(210,16,52,.05)"}}>
                <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--red)",marginBottom:6}}>مصادر تنفيه</p>
                {result.denying_sources.map((s,i) => <p key={i} style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-2)",marginBottom:3}}>• {s}</p>)}
              </div>}
            </div>

            {result.spread_date && <p style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-3)",textAlign:"center"}}>
              <Icon.Clock/> تاريخ الانتشار المقدّر: {result.spread_date}
            </p>}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── MARKET TICKER ────────────────────────────────────────────────
function MarketTicker() {
  const items = [...MARKET_DATA, ...MARKET_DATA];
  return (
    <div style={{background:"var(--green)",overflow:"hidden",height:36,display:"flex",alignItems:"center",position:"relative"}}>
      <div style={{flexShrink:0,padding:"0 16px",borderLeft:"1px solid rgba(255,255,255,.2)",height:"100%",display:"flex",alignItems:"center",zIndex:2,background:"rgba(0,77,40,.8)"}}>
        <span style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:800,color:"#fff",whiteSpace:"nowrap",letterSpacing:".05em"}}>📊 السوق الجزائري</span>
      </div>
      <div style={{flex:1,overflow:"hidden",maskImage:"linear-gradient(to right,transparent,black 60px,black calc(100% - 60px),transparent)"}}>
        <div style={{display:"flex",gap:0,animation:"ticker 25s linear infinite",width:"max-content"}}>
          {items.map((m,i) => (
            <div key={i} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"0 20px",borderLeft:"1px solid rgba(255,255,255,.15)",whiteSpace:"nowrap"}}>
              <span style={{fontFamily:"var(--font-ar)",fontSize:12,color:"rgba(255,255,255,.85)"}}>{m.label}</span>
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:"#fff"}}>{m.value}</span>
              <span style={{fontSize:10,color:"rgba(255,255,255,.7)"}}>{m.unit}</span>
              {m.up!==null && <span style={{fontSize:10,fontWeight:700,color:m.up?"#86efac":"#fca5a5",display:"flex",alignItems:"center",gap:2}}>
                {m.up ? <Icon.TrendUp/> : <Icon.TrendDown/>} {m.change}
              </span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ALGERIAN DASHBOARD ───────────────────────────────────────────
function AlgerianDashboard() {
  return (
    <section style={{borderRadius:20,border:"1px solid var(--card-border)",background:"var(--card-bg)",overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
      <div style={{padding:"16px 20px",borderBottom:"1px solid var(--mist-3)",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"var(--green)",animation:"pulse 2s infinite"}}/>
        <h3 style={{fontFamily:"var(--font-ar)",fontSize:15,fontWeight:800,color:"var(--ink)"}}>لوحة الجزائري اليومية</h3>
        <span style={{fontSize:10,color:"var(--ink-3)",fontFamily:"var(--font-body)",marginRight:"auto"}}>يتجدد تلقائياً</span>
      </div>

      {/* Market */}
      <div style={{padding:16}}>
        <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--ink-3)",letterSpacing:".08em",marginBottom:12}}>أسعار الصرف والسلع</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>
          {MARKET_DATA.map((m,i) => (
            <div key={i} style={{padding:"10px 12px",borderRadius:12,background:"var(--mist)",border:"1px solid var(--mist-3)"}}>
              <p style={{fontFamily:"var(--font-body)",fontSize:10,color:"var(--ink-3)",marginBottom:4}}>{m.label}</p>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"var(--ink)"}}>{m.value} <span style={{fontSize:10,color:"var(--ink-3)"}}>{m.unit}</span></p>
              {m.up!==null && <p style={{fontSize:10,fontWeight:700,color:m.up?"var(--green)":"var(--red)",display:"flex",alignItems:"center",gap:3,marginTop:4}}>
                {m.up?<Icon.TrendUp/>:<Icon.TrendDown/>} {m.change}%
              </p>}
            </div>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div style={{padding:"0 16px 16px"}}>
        <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--ink-3)",letterSpacing:".08em",marginBottom:12}}>طقس المدن الكبرى</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
          {WEATHER.map((w,i) => (
            <div key={i} style={{padding:"10px 12px",borderRadius:12,background:"var(--mist)",border:"1px solid var(--mist-3)",textAlign:"center"}}>
              <p style={{fontSize:22,marginBottom:4}}>{w.icon}</p>
              <p style={{fontFamily:"var(--font-ar)",fontSize:12,fontWeight:700,color:"var(--ink)"}}>{w.city}</p>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"var(--green)"}}>{w.temp}°</p>
              <p style={{fontFamily:"var(--font-body)",fontSize:10,color:"var(--ink-3)"}}>{w.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div style={{padding:"12px 16px 16px",borderTop:"1px solid var(--mist-3)"}}>
        <p style={{fontFamily:"var(--font-ar)",fontSize:11,fontWeight:700,color:"var(--ink-3)",letterSpacing:".08em",marginBottom:10}}>روابط مهمة</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {["بوابة التسجيل الجامعي","نتائج المسابقات","نتائج البكالوريا","رزنامة العطل الرسمية","الخدمات الإلكترونية"].map((l,i) => (
            <a key={i} href="#" style={{display:"inline-flex",alignItems:"center",gap:4,padding:"5px 11px",borderRadius:50,fontSize:11,fontWeight:600,fontFamily:"var(--font-ar)",background:"var(--green-pale)",border:"1px solid rgba(0,98,51,.15)",color:"var(--green)",textDecoration:"none",transition:"var(--transition)"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(0,98,51,.2)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--green-pale)"}>
              <Icon.External/>{l}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────
function Header({ dark, toggle, savedCount, onShowSaved, onSearch, onMenu }) {
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");

  return (
    <header style={{position:"sticky",top:0,zIndex:100,background:dark?"rgba(13,17,23,0.96)":"rgba(255,255,255,0.96)",backdropFilter:"blur(24px)",borderBottom:"1px solid var(--card-border)",boxShadow:"var(--shadow-sm)"}}>
      <div style={{maxWidth:1180,margin:"0 auto",padding:"0 20px"}}>
        <div style={{display:"flex",alignItems:"center",height:60,gap:12}} dir="rtl">

          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <button onClick={onMenu} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,color:"var(--ink-3)",transition:"var(--transition)"}} onMouseEnter={e=>e.currentTarget.style.background="var(--mist-2)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <Icon.Menu/>
            </button>
            {/* SVG Logo */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
              <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                <rect width="34" height="34" rx="10" fill="url(#lg)"/>
                <defs><linearGradient id="lg" x1="0" y1="0" x2="34" y2="34"><stop stopColor="#006233"/><stop offset="1" stopColor="#004d28"/></linearGradient></defs>
                <path d="M8 12h4v2H8v4h3v2H8v3h11v-2h-7v-1h5v-2h-5v-2h7V10H8v2zm13 0h2v8h3v2h-5V12z" fill="white" opacity=".95"/>
              </svg>
              <div>
                <div style={{fontFamily:"var(--font-ar)",fontSize:15,fontWeight:900,color:"var(--green)",lineHeight:1.1}}>الخلاصة</div>
                <div style={{fontFamily:"var(--font-body)",fontSize:9,color:"var(--ink-3)",letterSpacing:".06em",lineHeight:1}}>EL-KHOLASA DZ</div>
              </div>
            </div>
          </div>

          {/* Search expanded */}
          {showSearch ? (
            <div style={{flex:1,display:"flex",gap:8,alignItems:"center"}}>
              <div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"var(--mist)",border:"1.5px solid var(--green)",borderRadius:11,padding:"8px 14px"}}>
                <Icon.Search/>
                <input autoFocus value={q} onChange={e=>{setQ(e.target.value);onSearch(e.target.value);}}
                  placeholder="ابحث في الأخبار الجزائرية..."
                  style={{flex:1,background:"none",border:"none",outline:"none",fontFamily:"var(--font-body)",fontSize:13,color:"var(--ink)",direction:"rtl"}}/>
              </div>
              <button onClick={()=>{setShowSearch(false);setQ("");onSearch("");}} style={{fontFamily:"var(--font-ar)",fontSize:12,color:"var(--ink-3)",padding:"6px 10px",borderRadius:8,transition:"var(--transition)"}} onMouseEnter={e=>e.currentTarget.style.color="var(--ink)"} onMouseLeave={e=>e.currentTarget.style.color="var(--ink-3)"}>إلغاء</button>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:6,marginRight:"auto"}}>
              <button onClick={()=>setShowSearch(true)} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,color:"var(--ink-3)",border:"1px solid var(--card-border)",background:"var(--card-bg)",transition:"var(--transition)"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--green)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--card-border)"}><Icon.Search/></button>

              <button onClick={onShowSaved} style={{position:"relative",width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,color:"var(--ink-3)",border:"1px solid var(--card-border)",background:"var(--card-bg)",transition:"var(--transition)"}}>
                <Icon.Bookmark filled={false}/>
                {savedCount>0 && <span style={{position:"absolute",top:-4,left:-4,width:16,height:16,borderRadius:"50%",background:"var(--red)",color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{savedCount}</span>}
              </button>

              <button onClick={toggle} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:9,color:"var(--ink-3)",border:"1px solid var(--card-border)",background:"var(--card-bg)",transition:"var(--transition)"}} onMouseEnter={e=>e.currentTarget.style.borderColor="var(--green)"} onMouseLeave={e=>e.currentTarget.style.borderColor="var(--card-border)"}>
                {dark ? <Icon.Sun/> : <Icon.Moon/>}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────
function Sidebar({ open, onClose, active, onSelect }) {
  return (
    <>
      {open && <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",zIndex:199}}/>}
      <nav style={{position:"fixed",top:0,right:0,height:"100%",width:248,background:"var(--white)",borderLeft:"1px solid var(--card-border)",boxShadow:"var(--shadow-lg)",zIndex:200,transform:open?"translateX(0)":"translateX(100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column",overflowY:"auto"}} dir="rtl">
        <div style={{padding:20,borderBottom:"1px solid var(--mist-3)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="28" height="28" viewBox="0 0 34 34" fill="none"><rect width="34" height="34" rx="10" fill="url(#lg2)"/><defs><linearGradient id="lg2" x1="0" y1="0" x2="34" y2="34"><stop stopColor="#006233"/><stop offset="1" stopColor="#004d28"/></linearGradient></defs><path d="M8 12h4v2H8v4h3v2H8v3h11v-2h-7v-1h5v-2h-5v-2h7V10H8v2zm13 0h2v8h3v2h-5V12z" fill="white" opacity=".95"/></svg>
            <span style={{fontFamily:"var(--font-ar)",fontSize:14,fontWeight:800,color:"var(--green)"}}>الخلاصة DZ</span>
          </div>
          <button onClick={onClose} style={{color:"var(--ink-3)",padding:4}}><Icon.X/></button>
        </div>

        <div style={{padding:12,flex:1}}>
          <p style={{fontFamily:"var(--font-ar)",fontSize:10,fontWeight:700,letterSpacing:".1em",color:"var(--ink-3)",padding:"8px 12px",textTransform:"uppercase"}}>الأقسام</p>
          {CATEGORIES.map(cat => {
            const isActive = (!active && cat.slug==="all") || active===cat.slug;
            return (
              <button key={cat.slug} onClick={()=>{onSelect(cat.slug==="all"?null:cat.slug);onClose();}}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"9px 12px",borderRadius:10,border:"1px solid transparent",background:isActive?"var(--green-pale)":"none",borderColor:isActive?"rgba(0,98,51,.2)":"transparent",transition:"var(--transition)",marginBottom:2}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:isActive?"var(--green)":"var(--ink-3)",display:"flex"}}>{cat.icon}</span>
                  <span style={{fontFamily:"var(--font-ar)",fontSize:13,fontWeight:600,color:isActive?"var(--green)":"var(--ink-2)"}}>{cat.label}</span>
                  {cat.breaking && <span style={{width:6,height:6,borderRadius:"50%",background:"var(--red)",flexShrink:0,animation:"pulse 1.4s infinite"}}/>}
                </div>
                <span style={{fontSize:10,padding:"2px 7px",borderRadius:50,background:isActive?"rgba(0,98,51,.15)":"var(--mist-2)",color:isActive?"var(--green)":"var(--ink-3)",fontFamily:"monospace"}}>{cat.count}</span>
              </button>
            );
          })}
        </div>

        <div style={{padding:16,borderTop:"1px solid var(--mist-3)",textAlign:"center"}}>
          <p style={{fontFamily:"var(--font-body)",fontSize:10,color:"var(--ink-3)"}}>مدعوم بـ Cloudflare Workers AI</p>
          <p style={{fontFamily:"var(--font-body)",fontSize:9,color:"var(--mist-3)",marginTop:3}}>© 2025 الخلاصة الجزائرية</p>
        </div>
      </nav>
    </>
  );
}

// ─── SAVED PANEL ──────────────────────────────────────────────────
function SavedPanel({ open, onClose, saved, onRemove }) {
  return (
    <>
      {open && <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",zIndex:299}}/>}
      <div style={{position:"fixed",left:0,top:0,height:"100%",width:320,maxWidth:"90vw",background:"var(--white)",borderRight:"1px solid var(--card-border)",boxShadow:"var(--shadow-lg)",zIndex:300,transform:open?"translateX(0)":"translateX(-100%)",transition:"transform .3s cubic-bezier(.4,0,.2,1)",display:"flex",flexDirection:"column"}} dir="rtl">
        <div style={{padding:"16px 18px",borderBottom:"1px solid var(--mist-3)",display:"flex",alignItems:"center",gap:8}}>
          <Icon.Bookmark filled={true}/>
          <h2 style={{fontFamily:"var(--font-ar)",fontSize:15,fontWeight:800,color:"var(--gold)",flex:1}}>المحفوظات</h2>
          {saved.length>0 && <span style={{fontSize:11,padding:"2px 7px",borderRadius:50,background:"var(--gold-pale)",color:"var(--gold)",fontFamily:"var(--font-body)"}}>{saved.length}</span>}
          <button onClick={onClose} style={{color:"var(--ink-3)",padding:4}}><Icon.X/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:12}}>
          {saved.length===0
            ? <div style={{textAlign:"center",padding:"60px 20px"}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--mist-3)" strokeWidth="1.5" style={{margin:"0 auto 12px"}}><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                <p style={{fontFamily:"var(--font-ar)",fontSize:14,fontWeight:700,color:"var(--ink-3)"}}>لا توجد مقالات محفوظة</p>
                <p style={{fontFamily:"var(--font-body)",fontSize:12,color:"var(--mist-3)",marginTop:6}}>اضغط أيقونة الحفظ في أي خبر</p>
              </div>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {saved.map(a => (
                  <div key={a.id} style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--mist-3)",background:"var(--mist)"}}>
                    {a.image && <div style={{aspectRatio:"3/2"}}><img src={a.image} alt={a.title} style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/></div>}
                    <div style={{padding:12}}>
                      <p style={{fontFamily:"var(--font-ar)",fontSize:13,fontWeight:700,lineHeight:1.6,color:"var(--ink)",marginBottom:6}}>{a.title}</p>
                      {a.summary?.[0] && <p style={{fontFamily:"var(--font-body)",fontSize:11,lineHeight:1.6,color:"var(--ink-3)",marginBottom:8}}>• {a.summary[0].substring(0,80)}...</p>}
                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button onClick={()=>onRemove(a.id)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:7,color:"var(--ink-3)",fontSize:11,fontFamily:"var(--font-ar)",transition:"color .15s"}} onMouseEnter={e=>e.currentTarget.style.color="var(--red)"} onMouseLeave={e=>e.currentTarget.style.color="var(--ink-3)"}>
                          <Icon.Trash/>حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
        </div>
      </div>
    </>
  );
}

// ─── SKELETON ────────────────────────────────────────────────────
function FeedSkeleton() {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Hero skeleton */}
      <div style={{borderRadius:20,overflow:"hidden",border:"1px solid var(--card-border)",background:"var(--card-bg)"}}>
        <div className="shimmer" style={{aspectRatio:"3/2",width:"100%"}}/>
        <div style={{padding:22,display:"flex",flexDirection:"column",gap:12}}>
          <div className="shimmer" style={{height:12,borderRadius:6,width:"35%"}}/>
          <div className="shimmer" style={{height:24,borderRadius:6,width:"95%"}}/>
          <div className="shimmer" style={{height:24,borderRadius:6,width:"80%"}}/>
          <div className="shimmer" style={{height:6,borderRadius:3,width:"60%",marginTop:4}}/>
          <div style={{display:"flex",gap:8,marginTop:4}}>
            {[80,65,90].map((w,i)=><div key={i} className="shimmer" style={{height:30,borderRadius:50,width:w}}/>)}
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
        {[1,2,3,4].map(i=>(
          <div key={i} style={{borderRadius:16,overflow:"hidden",border:"1px solid var(--card-border)",background:"var(--card-bg)"}}>
            <div className="shimmer" style={{aspectRatio:"3/2"}}/>
            <div style={{padding:14,display:"flex",flexDirection:"column",gap:10}}>
              <div className="shimmer" style={{height:11,borderRadius:5,width:"40%"}}/>
              <div className="shimmer" style={{height:18,borderRadius:5,width:"95%"}}/>
              <div className="shimmer" style={{height:18,borderRadius:5,width:"75%"}}/>
              <div className="shimmer" style={{height:5,borderRadius:2,width:"55%"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  useEffect(() => { injectAssets(); }, []);

  const { dark, toggle } = useTheme();
  const savedFns = useSaved();
  const { st: audio, speak: onAudio, stop: stopAudio } = useAudio();

  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeTab, setActiveTab] = useState("feed"); // feed | radar | dashboard
  const [searchQ, setSearchQ] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setClusters(CLUSTERS);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    let r = clusters;
    if (activeCategory) r = r.filter(c => c.category === activeCategory);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      r = r.filter(c => c.title.includes(q) || c.lead?.includes(q) || c.summary.some(p=>p.includes(q)));
    }
    return r;
  }, [clusters, activeCategory, searchQ]);

  const { heroes, featured, standard } = useMemo(() => {
    const h=[], f=[], s=[];
    filtered.forEach(c => { if(c.is_breaking||c.priority<=1) h.push(c); else if(c.priority<=3) f.push(c); else s.push(c); });
    return { heroes:h, featured:f, standard:s };
  }, [filtered]);

  const Divider = ({label}) => (
    <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
      <div style={{flex:1,height:1,background:"var(--mist-3)"}}/>
      <span style={{fontFamily:"var(--font-ar)",fontSize:10,fontWeight:700,letterSpacing:".12em",color:"var(--ink-3)",padding:"0 4px",textTransform:"uppercase"}}>{label}</span>
      <div style={{flex:1,height:1,background:"var(--mist-3)"}}/>
    </div>
  );

  const TabBtn = ({id, label, icon}) => (
    <button onClick={()=>setActiveTab(id)}
      style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,fontFamily:"var(--font-ar)",fontSize:13,fontWeight:700,color:activeTab===id?"var(--green)":"var(--ink-3)",background:activeTab===id?"var(--green-pale)":"none",border:activeTab===id?"1px solid rgba(0,98,51,.2)":"1px solid transparent",transition:"var(--transition)",cursor:"pointer",flexShrink:0}}>
      {icon}{label}
    </button>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--mist)",direction:"rtl"}}>
      <MarketTicker/>
      <Header dark={dark} toggle={toggle} savedCount={savedFns.saved.length} onShowSaved={()=>setSavedOpen(true)} onSearch={setSearchQ} onMenu={()=>setSidebarOpen(true)}/>
      <Sidebar open={sidebarOpen} onClose={()=>setSidebarOpen(false)} active={activeCategory} onSelect={setActiveCategory}/>
      <SavedPanel open={savedOpen} onClose={()=>setSavedOpen(false)} saved={savedFns.saved} onRemove={savedFns.remove}/>

      <main style={{maxWidth:1180,margin:"0 auto",padding:"20px 16px 60px"}}>

        {/* Tab navigation */}
        <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
          <TabBtn id="feed"      label="الأخبار" icon={<Icon.Newspaper/>}/>
          <TabBtn id="radar"     label="رادار الحقيقة" icon={<Icon.Shield/>}/>
          <TabBtn id="dashboard" label="لوحة الجزائري" icon={<Icon.TrendUp/>}/>
        </div>

        {/* Feed tab */}
        {activeTab==="feed" && (
          <>
            {/* Status bar */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {activeCategory && (
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:50,background:"var(--green-pale)",border:"1px solid rgba(0,98,51,.2)",color:"var(--green)"}}>
                    <span style={{fontFamily:"var(--font-ar)",fontSize:12,fontWeight:600}}>{CATEGORIES.find(c=>c.slug===activeCategory)?.label}</span>
                    <button onClick={()=>setActiveCategory(null)} style={{color:"var(--green)",lineHeight:1}}><Icon.X size={12}/></button>
                  </div>
                )}
                {!loading && <span style={{fontFamily:"var(--font-ar)",fontSize:11,color:"var(--ink-3)"}}>{filtered.length} خبر</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {lastUpdated && <span style={{fontFamily:"var(--font-body)",fontSize:10,color:"var(--mist-3)"}}>آخر تحديث {lastUpdated.toLocaleTimeString("ar-DZ",{hour:"2-digit",minute:"2-digit"})}</span>}
                <button onClick={fetchData} disabled={loading} style={{display:"inline-flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:9,border:"1px solid var(--card-border)",background:"var(--card-bg)",color:"var(--ink-3)",fontFamily:"var(--font-ar)",fontSize:11,fontWeight:600,transition:"var(--transition)"}}>
                  <span style={{display:"inline-block",animation:loading?"spin 1s linear infinite":"none"}}><Icon.Refresh/></span>
                  {loading?"جارٍ...":"تحديث"}
                </button>
              </div>
            </div>

            {loading ? <FeedSkeleton/> : (
              <div style={{display:"flex",flexDirection:"column",gap:22}}>
                {/* Heroes */}
                {heroes.map((c,i) => <div key={c.id} style={{animation:`fadeUp .4s ease ${i*.08}s both`}}>
                  <ClusterCard c={c} hero dark={dark} audio={audio} onAudio={onAudio} isSaved={savedFns.isSaved(c.id)} onSave={savedFns.toggle}/>
                </div>)}

                {/* Featured */}
                {featured.length>0 && <>
                  {heroes.length>0 && <Divider label="أخبار بارزة"/>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:18}}>
                    {featured.map((c,i) => <div key={c.id} style={{animation:`fadeUp .4s ease ${i*.06+.1}s both`}}>
                      <ClusterCard c={c} dark={dark} audio={audio} onAudio={onAudio} isSaved={savedFns.isSaved(c.id)} onSave={savedFns.toggle}/>
                    </div>)}
                  </div>
                </>}

                {/* Standard */}
                {standard.length>0 && <>
                  {(heroes.length>0||featured.length>0) && <Divider label="مزيد من الأخبار"/>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
                    {standard.map((c,i) => <div key={c.id} style={{animation:`fadeUp .4s ease ${i*.05+.15}s both`}}>
                      <ClusterCard c={c} dark={dark} audio={audio} onAudio={onAudio} isSaved={savedFns.isSaved(c.id)} onSave={savedFns.toggle}/>
                    </div>)}
                  </div>
                </>}

                {filtered.length===0 && (
                  <div style={{textAlign:"center",padding:"80px 0"}}>
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--mist-3)" strokeWidth="1.2" style={{margin:"0 auto 16px"}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <p style={{fontFamily:"var(--font-ar)",fontSize:17,fontWeight:700,color:"var(--ink-3)"}}>لا توجد نتائج مطابقة</p>
                    <p style={{fontFamily:"var(--font-body)",fontSize:13,color:"var(--mist-3)",marginTop:6}}>جرّب البحث بكلمات مختلفة</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Radar tab */}
        {activeTab==="radar" && (
          <div style={{animation:"fadeUp .35s ease"}}>
            <div style={{marginBottom:16}}>
              <h2 style={{fontFamily:"var(--font-ar)",fontSize:18,fontWeight:900,color:"var(--green)",marginBottom:4}}>رادار الحقيقة 🛡️</h2>
              <p style={{fontFamily:"var(--font-body)",fontSize:13,color:"var(--ink-3)"}}>الصق أي رابط خبر أو نص للتحقق من مصداقيته تلقائياً بالذكاء الاصطناعي</p>
            </div>
            <FakeNewsDetector dark={dark}/>

            {/* Trust scores of current news */}
            <div style={{marginTop:24}}>
              <h3 style={{fontFamily:"var(--font-ar)",fontSize:15,fontWeight:800,color:"var(--ink)",marginBottom:14}}>تحليل مصداقية الأخبار الحالية</h3>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {CLUSTERS.map(c => (
                  <div key={c.id} style={{padding:"12px 16px",borderRadius:13,background:"var(--card-bg)",border:"1px solid var(--card-border)",display:"flex",alignItems:"center",gap:14,boxShadow:"var(--shadow-sm)"}}>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontFamily:"var(--font-ar)",fontSize:13,fontWeight:700,color:"var(--ink)",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title}</p>
                      <TrustBadge score={c.trust_score}/>
                    </div>
                    <TrustBadge score={c.trust_score} compact/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard tab */}
        {activeTab==="dashboard" && (
          <div style={{animation:"fadeUp .35s ease"}}>
            <div style={{marginBottom:16}}>
              <h2 style={{fontFamily:"var(--font-ar)",fontSize:18,fontWeight:900,color:"var(--green)",marginBottom:4}}>لوحة الجزائري اليومية 🇩🇿</h2>
              <p style={{fontFamily:"var(--font-body)",fontSize:13,color:"var(--ink-3)"}}>كل ما يحتاجه الجزائري يومياً في مكان واحد</p>
            </div>
            <AlgerianDashboard/>
          </div>
        )}
      </main>

      {/* Audio floating stop */}
      {audio.id!==null && (
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:400,animation:"fadeUp .3s ease"}}>
          <button onClick={stopAudio} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",borderRadius:50,background:"var(--white)",border:"1.5px solid var(--green)",boxShadow:"var(--shadow-lg)",color:"var(--green)",fontFamily:"var(--font-ar)",fontSize:13,fontWeight:700,cursor:"pointer",transition:"var(--transition)"}}>
            <Waveform playing={audio.playing} color="var(--green)"/>
            إيقاف القراءة الصوتية
            <Icon.VolumeOff/>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer style={{borderTop:"1px solid var(--mist-3)",padding:"20px 20px",textAlign:"center"}}>
        <p style={{fontFamily:"var(--font-body)",fontSize:11,color:"var(--ink-3)"}}>الخلاصة الجزائرية — مدعوم بـ Cloudflare Workers AI & Anthropic Claude</p>
        <p style={{fontFamily:"var(--font-body)",fontSize:10,color:"var(--mist-3)",marginTop:4}}>© 2025 El-Kholasa DZ — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
