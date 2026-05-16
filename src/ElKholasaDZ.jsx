/**
 * ═══════════════════════════════════════════════════════════════════
 * الخلاصة الجزائرية — El-Kholasa DZ
 * Production-grade PWA Artifact — Self-contained single file
 * Architecture: Cloudflare Workers + D1 + Workers AI (mock data layer)
 * ═══════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ─── Google Fonts Loader ────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── CSS Injection ──────────────────────────────────────────────────────────
const GlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes breaking-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      @keyframes waveform-1 { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
      @keyframes waveform-2 { 0%,100%{transform:scaleY(0.7)} 50%{transform:scaleY(0.2)} }
      @keyframes waveform-3 { 0%,100%{transform:scaleY(1)}   50%{transform:scaleY(0.4)} }
      @keyframes waveform-4 { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(0.9)} }
      @keyframes waveform-5 { 0%,100%{transform:scaleY(0.6)} 50%{transform:scaleY(0.3)} }
      @keyframes slideInRight { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes slideInLeft  { from{transform:translateX(-100%);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes glow-pulse {
        0%,100%{box-shadow:0 0 20px rgba(52,211,153,0.15)}
        50%{box-shadow:0 0 40px rgba(52,211,153,0.3)}
      }
      .skeleton-line {
        background: linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.10) 50%,rgba(255,255,255,0.04) 100%);
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.6s ease-in-out infinite;
        border-radius: 6px;
      }
      .dark .skeleton-line {
        background: linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.03) 100%);
        background-size: 200% 100%;
      }
      .light .skeleton-line {
        background: linear-gradient(90deg,rgba(0,0,0,0.04) 0%,rgba(0,0,0,0.08) 50%,rgba(0,0,0,0.04) 100%);
        background-size: 200% 100%;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
      ::selection { background: rgba(52,211,153,0.25); }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};

// ─── MOCK DATA ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 1, slug: "all",       name_ar: "كل الأخبار",  icon: "🗞️", count: 87 },
  { id: 2, slug: "breaking",  name_ar: "عاجل",         icon: "🔴", count: 3  },
  { id: 3, slug: "politics",  name_ar: "سياسة",        icon: "🏛️", count: 12 },
  { id: 4, slug: "economy",   name_ar: "اقتصاد",       icon: "📈", count: 8  },
  { id: 5, slug: "society",   name_ar: "مجتمع",        icon: "👥", count: 15 },
  { id: 6, slug: "security",  name_ar: "أمن وقضاء",   icon: "🛡️", count: 6  },
  { id: 7, slug: "sports",    name_ar: "رياضة",        icon: "⚽", count: 10 },
  { id: 8, slug: "energy",    name_ar: "طاقة",         icon: "⚡", count: 5  },
  { id: 9, slug: "health",    name_ar: "صحة",          icon: "🏥", count: 7  },
  { id: 10, slug: "world",    name_ar: "دولي",         icon: "🌍", count: 9  },
  { id: 11, slug: "tech",     name_ar: "تكنولوجيا",   icon: "💻", count: 5  },
  { id: 12, slug: "culture",  name_ar: "ثقافة وفنون", icon: "🎭", count: 4  },
];

const CLUSTERS = [
  {
    id: 1,
    slug: "tebboune-sommet-arabe-2025",
    category: "politics",
    title_ar: "الرئيس تبون يترأس وفداً رفيع المستوى في قمة جامعة الدول العربية بالقاهرة",
    lead_ar: "شارك الرئيس عبد المجيد تبون في أشغال القمة العربية بالقاهرة، حيث طرح مبادرات جزائرية لتعزيز التضامن العربي وإنشاء صندوق مشترك للأمن الغذائي.",
    summary_points: [
      { order: 1, point: "ترأس الرئيس تبون الوفد الجزائري في القمة العربية بالقاهرة، داعياً إلى توحيد الصف العربي وتجاوز الخلافات في مواجهة التحديات الإقليمية المتصاعدة." },
      { order: 2, point: "قدّمت الجزائر مبادرة لإنشاء صندوق عربي مشترك لدعم الأمن الغذائي بتمويل مبدئي قُدِّر بثلاثة مليارات دولار من دول الخليج ودول المغرب العربي." },
      { order: 3, point: "أكدت وزارة الخارجية أن المحادثات الثنائية على هامش القمة تناولت ملف إعادة فتح الحدود البرية مع المغرب بعد سنوات من الإغلاق." },
    ],
    seo_description: "تبون في القمة العربية بالقاهرة: مبادرة صندوق الأمن الغذائي ومباحثات إعادة فتح الحدود مع المغرب.",
    image_url: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=900&h=600&fit=crop&q=80",
    image_alt: "قاعة القمة العربية بالقاهرة",
    is_breaking: true,
    is_developing: true,
    priority: 1,
    sources: [
      { slug: "el-khabar",   name: "الخبر",        url: "https://elkhabar.com",           color: "#c0392b", time: "منذ ساعتين" },
      { slug: "echourouk",   name: "الشروق",       url: "https://echoroukonline.com",      color: "#e74c3c", time: "منذ ساعة" },
      { slug: "aps",         name: "وأج",          url: "https://aps.dz/ar",              color: "#1abc9c", time: "منذ 3 ساعات" },
      { slug: "ennahar",     name: "النهار",       url: "https://ennaharonline.com",       color: "#16a085", time: "منذ ساعة" },
      { slug: "tsa-algerie", name: "TSA الجزائر", url: "https://tsa-algerie.com",         color: "#27ae60", time: "منذ 30 د" },
    ],
    timeline: [
      { id: 1, text: "أعلنت رئاسة الجمهورية مشاركة الرئيس تبون في القمة العربية بالقاهرة", time: "أمس 14:00" },
      { id: 2, text: "توجّه الرئيس تبون على رأس وفد رفيع إلى القاهرة", time: "اليوم 07:00" },
      { id: 3, text: "ألقى الرئيس كلمة الجزائر مؤكداً الثوابت الجزائرية في القضايا العربية", time: "اليوم 11:00" },
    ],
    updated: "منذ 30 دقيقة",
    views: 24531,
  },
  {
    id: 2,
    slug: "baisse-carburant-fevrier-2025",
    category: "economy",
    title_ar: "الحكومة تُقرّ تخفيضاً ملموساً في أسعار الوقود ابتداءً من مطلع فبراير",
    lead_ar: "أعلنت وزارة الطاقة والمناجم عن تخفيض سعر البنزين بنوعيه وزيت الغاز ضمن إجراءات دعم القدرة الشرائية للمواطنين.",
    summary_points: [
      { order: 1, point: "أقرّت الحكومة تخفيض سعر البنزين بنسبة 12% وزيت الغاز بنسبة 8%، ليبدأ التطبيق مطلع فبراير في جميع المحطات عبر التراب الوطني." },
      { order: 2, point: "أوضح وزير الطاقة أن القرار يأتي في إطار توجيهات رئاسية لتعزيز القدرة الشرائية واستيعاب تداعيات التضخم العالمي." },
      { order: 3, point: "رصد اقتصاديون أن التخفيض سيُلقي بظلاله إيجاباً على النقل العام والشحن، مع توقعات بانخفاض السلع الأساسية خلال ستة أسابيع." },
    ],
    seo_description: "الجزائر تخفض أسعار الوقود 12% اعتباراً من فبراير 2025 دعماً للقدرة الشرائية.",
    image_url: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=900&h=600&fit=crop&q=80",
    image_alt: "محطة وقود في الجزائر",
    is_breaking: false,
    is_developing: false,
    priority: 2,
    sources: [
      { slug: "el-khabar",    name: "الخبر",       url: "https://elkhabar.com",      color: "#c0392b", time: "أمس 16:00" },
      { slug: "echourouk",    name: "الشروق",      url: "https://echoroukonline.com", color: "#e74c3c", time: "أمس 16:30" },
      { slug: "algerie360",   name: "الجزائر 360", url: "https://algerie360.com",    color: "#f39c12", time: "أمس 17:30" },
    ],
    timeline: [],
    updated: "منذ 8 ساعات",
    views: 18244,
  },
  {
    id: 3,
    slug: "can-2025-algerie",
    category: "sports",
    title_ar: "المنتخب الوطني يُتوَّج بكأس أمم أفريقيا بعد انتصار تاريخي في النهائي",
    lead_ar: "كتب الخضر صفحة ذهبية جديدة في تاريخ كرة القدم الجزائرية بعد فوزهم الدرامي في ركلات الترجيح.",
    summary_points: [
      { order: 1, point: "توّج المنتخب الجزائري بلقب كأس أمم أفريقيا 2025 بعد مباراة نهائية متوترة، انتهت 1-1 قبل أن يُحسم الأمر في ركلات الترجيح." },
      { order: 2, point: "سجّل رياض محرز الهدف الوحيد في الدقيقة 78، فيما أبدع الحارس مبولحي بصده لركلتين حاسمتين خلال ضربات الترجيح." },
      { order: 3, point: "أعلنت رئاسة الجمهورية يوم الثلاثاء عطلة وطنية استثنائية واستقبالاً شعبياً رسمياً للبعثة في قصر الأمم بالعاصمة." },
    ],
    seo_description: "الجزائر تتوج بكأس أمم أفريقيا 2025 بعد فوز تاريخي في النهائي — عطلة وطنية الثلاثاء.",
    image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&h=600&fit=crop&q=80",
    image_alt: "احتفالات تتويج المنتخب الجزائري",
    is_breaking: true,
    is_developing: false,
    priority: 1,
    sources: [
      { slug: "el-khabar",  name: "الخبر",       url: "https://elkhabar.com",      color: "#c0392b", time: "أمس 23:30" },
      { slug: "echourouk",  name: "الشروق",      url: "https://echoroukonline.com", color: "#e74c3c", time: "أمس 23:45" },
      { slug: "ennahar",    name: "النهار",      url: "https://ennaharonline.com",  color: "#16a085", time: "منذ ساعة" },
      { slug: "dzfoot",     name: "DZfoot",      url: "https://dzfoot.com",         color: "#3498db", time: "منذ ساعتين" },
    ],
    timeline: [],
    updated: "منذ ساعة",
    views: 89120,
  },
  {
    id: 4,
    slug: "bac-2025-resultats",
    category: "society",
    title_ar: "نتائج البكالوريا 2025: نسبة النجاح تُسجِّل ارتفاعاً ملحوظاً على المستوى الوطني",
    lead_ar: "كشفت وزارة التربية الوطنية عن نتائج امتحانات شهادة البكالوريا دورة 2025 مع تسجيل أعلى نسبة نجاح منذ خمس سنوات.",
    summary_points: [
      { order: 1, point: "أعلنت وزارة التربية نسبة نجاح إجمالية بلغت 63.8% في امتحانات البكالوريا 2025، بارتفاع 4.2 نقطة مقارنة بالسنة الماضية." },
      { order: 2, point: "تصدّرت ولاية تيزي وزو قائمة الولايات بأعلى نسبة نجاح 72.1%، في حين سجّلت شعبة الرياضيات أعلى معدل وطني." },
      { order: 3, point: "تنطلق عملية التسجيل الجامعي عبر البوابة الإلكترونية مباشرة بعد الإعلان الرسمي، مع تمديد المهلة 10 أيام للمترشحين من ذوي الاحتياجات." },
    ],
    seo_description: "بكالوريا 2025: نسبة نجاح 63.8% وطنياً — تيزي وزو في المرتبة الأولى.",
    image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&h=600&fit=crop&q=80",
    image_alt: "طلاب الباكالوريا",
    is_breaking: false,
    is_developing: false,
    priority: 3,
    sources: [
      { slug: "el-khabar",  name: "الخبر",   url: "https://elkhabar.com",      color: "#c0392b", time: "اليوم 06:00" },
      { slug: "echourouk",  name: "الشروق",  url: "https://echoroukonline.com", color: "#e74c3c", time: "اليوم 06:15" },
      { slug: "aps",        name: "وأج",     url: "https://aps.dz/ar",         color: "#1abc9c", time: "اليوم 05:30" },
    ],
    timeline: [],
    updated: "منذ 4 ساعات",
    views: 41200,
  },
  {
    id: 5,
    slug: "sonatrach-contrat-gaz-europe",
    category: "energy",
    title_ar: "سوناطراك توقّع عقوداً جديدة لتوريد الغاز الطبيعي لإيطاليا وإسبانيا بقيمة 8 مليارات دولار",
    lead_ar: "وقّعت المجموعة الجزائرية للمحروقات سوناطراك على حزمة عقود استراتيجية لتعزيز إمدادات الغاز نحو جنوب أوروبا لمدة عشر سنوات.",
    summary_points: [
      { order: 1, point: "أبرمت سوناطراك عقوداً مع ENI الإيطالية وRepsol الإسبانية بإجمالي 8 مليارات دولار لتوريد 15 مليار متر مكعب سنوياً لمدة 10 سنوات." },
      { order: 2, point: "تعزّز هذه العقود مكانة الجزائر كمورد غاز رئيسي لأوروبا في سياق التحولات الطاقوية العالمية وتراجع الاعتماد على الغاز الروسي." },
      { order: 3, point: "أعلن الرئيس التنفيذي لسوناطراك أن المجموعة ستضخّ 5 مليارات دولار في تطوير حقول جديدة خلال السنوات الثلاث المقبلة." },
    ],
    seo_description: "سوناطراك تبرم عقوداً بـ8 مليارات دولار لتوريد الغاز لإيطاليا وإسبانيا لعشر سنوات.",
    image_url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=900&h=600&fit=crop&q=80",
    image_alt: "منشأة غاز سوناطراك",
    is_breaking: false,
    is_developing: false,
    priority: 3,
    sources: [
      { slug: "el-khabar",  name: "الخبر",        url: "https://elkhabar.com",      color: "#c0392b", time: "أمس 14:00" },
      { slug: "tsa-algerie",name: "TSA الجزائر",  url: "https://tsa-algerie.com",   color: "#27ae60", time: "أمس 14:30" },
      { slug: "aps",        name: "وأج",          url: "https://aps.dz/ar",         color: "#1abc9c", time: "أمس 13:00" },
    ],
    timeline: [],
    updated: "منذ يوم",
    views: 12800,
  },
  {
    id: 6,
    slug: "securite-alger-centre",
    category: "security",
    title_ar: "توقيف شبكة إجرامية من 14 عنصراً متخصصة في سرقة السيارات بالعاصمة",
    lead_ar: "نجحت مصالح الشرطة القضائية بمديرية أمن الجزائر في تفكيك شبكة إجرامية منظمة عملت لأكثر من ثلاثة أشهر.",
    summary_points: [
      { order: 1, point: "أعلنت الشرطة القضائية تفكيك شبكة مؤلفة من 14 مشتبهاً بهم متخصصين في سرقة السيارات وإعادة بيعها بوثائق مزورة بمختلف ولايات الوطن." },
      { order: 2, point: "جرى ضبط أكثر من 23 مركبة مسروقة، وحجز معدات تقنية للاختراق الإلكتروني لأنظمة تشغيل السيارات الحديثة." },
      { order: 3, point: "المشتبه بهم موضوعون تحت الحراسة النظرية، على ذمة التحقيق القضائي الجاري بإشراف وكيل الجمهورية المختص." },
    ],
    seo_description: "شرطة الجزائر تفكك شبكة سرقة سيارات من 14 عنصراً وتحجز 23 مركبة بوثائق مزورة.",
    image_url: "https://images.unsplash.com/photo-1517026575980-3e1e2dedeab4?w=900&h=600&fit=crop&q=80",
    image_alt: "عملية أمنية في الجزائر",
    is_breaking: false,
    is_developing: false,
    priority: 4,
    sources: [
      { slug: "ennahar",  name: "النهار",  url: "https://ennaharonline.com", color: "#16a085", time: "اليوم 08:00" },
      { slug: "echourouk",name: "الشروق", url: "https://echoroukonline.com", color: "#e74c3c", time: "اليوم 09:00" },
    ],
    timeline: [],
    updated: "منذ 3 ساعات",
    views: 8900,
  },
  {
    id: 7,
    slug: "sante-vaccin-grippe-2025",
    category: "health",
    title_ar: "وزارة الصحة تُطلق الحملة الوطنية للتلقيح ضد الأنفلونزا الموسمية في 48 ولاية",
    lead_ar: "انطلقت الحملة الوطنية للتلقيح ضد الأنفلونزا في ظرف أسبوعين من بداية الموسم وسط إقبال واسع من المواطنين.",
    summary_points: [
      { order: 1, point: "أطلقت وزارة الصحة الحملة الوطنية للتلقيح ضد الأنفلونزا الموسمية بتوفير 3 ملايين جرعة موزّعة على المراكز الصحية في 48 ولاية." },
      { order: 2, point: "يستهدف البرنامج بالأولوية كبار السن فوق 60 عاماً والحوامل وأصحاب الأمراض المزمنة والأطفال دون السادسة من العمر." },
      { order: 3, point: "أكدت الوزارة توفّر اللقاح مجاناً في جميع المستشفيات العمومية والمراكز الصحية الجوارية حتى نهاية موسم الشتاء." },
    ],
    seo_description: "الجزائر تطلق حملة تلقيح شاملة ضد الأنفلونزا الموسمية بـ3 ملايين جرعة في 48 ولاية.",
    image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&h=600&fit=crop&q=80",
    image_alt: "حملة تلقيح في الجزائر",
    is_breaking: false,
    is_developing: false,
    priority: 5,
    sources: [
      { slug: "el-khabar", name: "الخبر",  url: "https://elkhabar.com",     color: "#c0392b", time: "أمس 10:00" },
      { slug: "aps",       name: "وأج",    url: "https://aps.dz/ar",        color: "#1abc9c", time: "أمس 09:30" },
      { slug: "ennahar",   name: "النهار", url: "https://ennaharonline.com", color: "#16a085", time: "أمس 11:00" },
    ],
    timeline: [],
    updated: "منذ يوم",
    views: 6700,
  },
  {
    id: 8,
    slug: "alger-metro-extension-2025",
    category: "society",
    title_ar: "تمديد شبكة مترو الجزائر بمحطتين جديدتين يخدمان أكثر من 400 ألف مسافر يومياً",
    lead_ar: "تعزيز هام للبنية التحتية للنقل الحضري بالعاصمة مع افتتاح المقطع الجديد الذي يربط باب الزوار بحيدرة.",
    summary_points: [
      { order: 1, point: "افتُتح المقطع الجديد للمترو الذي يمتد من باب الزوار إلى حيدرة بمحطتين تخدمان نحو 400 ألف راكب يومياً وفق توقعات الشركة المستغِلة." },
      { order: 2, point: "استُثمر في هذا المشروع ما يزيد على 85 مليار دينار جزائري، وهو امتداد للمرحلة الثانية من مخطط توسعة مترو العاصمة 2020-2030." },
      { order: 3, point: "أعلنت الشركة الجزائرية للمترو إطلاق تعرفة تشاركية مخفّضة لأصحاب بطاقات الطلب للتخفيف من ضغط الازدحام المروري." },
    ],
    seo_description: "مترو الجزائر يمتد بمحطتين جديدتين تخدمان 400 ألف مسافر يومياً على محور باب الزوار-حيدرة.",
    image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=900&h=600&fit=crop&q=80",
    image_alt: "مترو الجزائر",
    is_breaking: false,
    is_developing: false,
    priority: 5,
    sources: [
      { slug: "el-khabar",  name: "الخبر",       url: "https://elkhabar.com",     color: "#c0392b", time: "أمس 12:00" },
      { slug: "algerie360", name: "الجزائر 360", url: "https://algerie360.com",   color: "#f39c12", time: "أمس 13:00" },
    ],
    timeline: [],
    updated: "منذ يومين",
    views: 9400,
  },
];

// ─── CATEGORY COLORS ────────────────────────────────────────────────────────
const CAT_LABELS = {
  breaking: "عاجل", politics: "سياسة", economy: "اقتصاد",
  society: "مجتمع", security: "أمن", sports: "رياضة",
  culture: "ثقافة", tech: "تقنية", health: "صحة",
  world: "دولي", energy: "طاقة",
};

const CAT_DARK = {
  breaking: "rgba(239,68,68,0.2) #ef4444 rgba(239,68,68,0.3)",
  politics:  "rgba(59,130,246,0.2) #60a5fa rgba(59,130,246,0.3)",
  economy:   "rgba(16,185,129,0.2) #34d399 rgba(16,185,129,0.3)",
  society:   "rgba(168,85,247,0.2) #c084fc rgba(168,85,247,0.3)",
  security:  "rgba(249,115,22,0.2) #fb923c rgba(249,115,22,0.3)",
  sports:    "rgba(234,179,8,0.2) #facc15 rgba(234,179,8,0.3)",
  culture:   "rgba(236,72,153,0.2) #f472b6 rgba(236,72,153,0.3)",
  tech:      "rgba(6,182,212,0.2) #22d3ee rgba(6,182,212,0.3)",
  health:    "rgba(20,184,166,0.2) #2dd4bf rgba(20,184,166,0.3)",
  world:     "rgba(99,102,241,0.2) #818cf8 rgba(99,102,241,0.3)",
  energy:    "rgba(245,158,11,0.2) #fbbf24 rgba(245,158,11,0.3)",
};

const CAT_LIGHT = {
  breaking: "#fef2f2 #dc2626 #fecaca",
  politics:  "#eff6ff #1d4ed8 #bfdbfe",
  economy:   "#ecfdf5 #059669 #a7f3d0",
  society:   "#faf5ff #7c3aed #ddd6fe",
  security:  "#fff7ed #ea580c #fed7aa",
  sports:    "#fefce8 #ca8a04 #fef08a",
  culture:   "#fdf2f8 #be185d #fbcfe8",
  tech:      "#ecfeff #0e7490 #a5f3fc",
  health:    "#f0fdfa #0f766e #99f6e4",
  world:     "#eef2ff #4338ca #c7d2fe",
  energy:    "#fffbeb #b45309 #fde68a",
};

function getCatStyle(cat, isDark) {
  const palette = isDark ? CAT_DARK[cat] : CAT_LIGHT[cat];
  if (!palette) return isDark
    ? { background: "rgba(100,116,139,0.2)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.3)" }
    : { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0" };
  const [bg, text, border] = palette.split(" ");
  return { background: bg, color: text, border: `1px solid ${border}` };
}

// ─── HOOKS ──────────────────────────────────────────────────────────────────
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("elkholasa-theme") !== "light"; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem("elkholasa-theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);
  return { isDark, toggle: () => setIsDark(v => !v) };
}

function useSaved() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("elkholasa-saved") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("elkholasa-saved", JSON.stringify(saved)); } catch {}
  }, [saved]);
  const toggle = useCallback((cluster) => {
    setSaved(prev => prev.some(s => s.id === cluster.id)
      ? prev.filter(s => s.id !== cluster.id)
      : [{ id: cluster.id, title_ar: cluster.title_ar, image_url: cluster.image_url,
           summary_points: cluster.summary_points, savedAt: new Date().toISOString() }, ...prev]
    );
  }, []);
  const isSaved = useCallback((id) => saved.some(s => s.id === id), [saved]);
  return { saved, toggle, isSaved, remove: (id) => setSaved(prev => prev.filter(s => s.id !== id)) };
}

function useAudio() {
  const [state, setState] = useState({ clusterId: null, playing: false, paused: false });
  const ref = useRef(null);

  const speak = useCallback((cluster) => {
    if (!window.speechSynthesis) return;
    if (state.clusterId === cluster.id) {
      if (state.playing) { window.speechSynthesis.pause(); setState(s => ({ ...s, playing: false, paused: true })); return; }
      if (state.paused)  { window.speechSynthesis.resume(); setState(s => ({ ...s, playing: true, paused: false })); return; }
    }
    window.speechSynthesis.cancel();
    const text = `${cluster.title_ar}. الملخص: ${cluster.summary_points.map((p, i) => `النقطة ${i+1}: ${p.point}`).join(". ")}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA"; u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const arVoice = voices.find(v => v.lang.startsWith("ar"));
    if (arVoice) u.voice = arVoice;
    u.onstart  = () => setState({ clusterId: cluster.id, playing: true,  paused: false });
    u.onpause  = () => setState(s => ({ ...s, playing: false, paused: true  }));
    u.onresume = () => setState(s => ({ ...s, playing: true,  paused: false }));
    u.onend = u.onerror = () => setState({ clusterId: null, playing: false, paused: false });
    ref.current = u;
    window.speechSynthesis.speak(u);
  }, [state]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState({ clusterId: null, playing: false, paused: false });
  }, []);

  return { state, speak, stop };
}

// ─── SVG WAVEFORM ───────────────────────────────────────────────────────────
function Waveform({ playing, isDark }) {
  const color = isDark
    ? (playing ? "#34d399" : "#6b7280")
    : (playing ? "#059669" : "#9ca3af");
  const bars = [0.4, 0.8, 1.0, 0.7, 0.5];
  return (
    <svg width={28} height={14} viewBox="0 0 28 14" style={{ display: "inline-block", verticalAlign: "middle" }}>
      {bars.map((h, i) => {
        const bh = 14 * h, y = (14 - bh) / 2, x = 1 + i * 5.5;
        return (
          <rect key={i} x={x} y={y} width={3} height={bh} rx={1.5} fill={color}
            style={{
              transformOrigin: `${x + 1.5}px 7px`,
              animation: playing ? `waveform-${(i % 5) + 1} ${0.6 + i * 0.1}s ease-in-out ${i * 0.1}s infinite` : "none",
              transition: "fill 0.3s ease",
            }}
          />
        );
      })}
    </svg>
  );
}

// ─── SKELETON ───────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 6, style = {} }) {
  return (
    <div className="skeleton-line"
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }} />
  );
}

function SkeletonCard({ hero, isDark }) {
  const bg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  return (
    <div style={{
      background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)",
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
      borderRadius: 20, overflow: "hidden",
    }}>
      <div style={{ aspectRatio: "3/2", background: bg }} className="skeleton-line" />
      <div style={{ padding: hero ? 24 : 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton w="40%" h={12} />
        <Skeleton w="100%" h={hero ? 28 : 20} />
        <Skeleton w="85%" h={hero ? 28 : 20} />
        {hero && <Skeleton w="70%" h={20} />}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <Skeleton w={70} h={28} r={50} />
          <Skeleton w={60} h={28} r={50} />
          <Skeleton w={80} h={28} r={50} />
        </div>
      </div>
    </div>
  );
}

// ─── SOURCE DOCK ────────────────────────────────────────────────────────────
function SourceDock({ sources, isDark }) {
  return (
    <div>
      <p style={{
        fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
        color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af",
        fontFamily: "'Cairo', sans-serif", marginBottom: 8,
      }}>اقرأ التغطية الكاملة</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {sources.map(s => (
          <a key={s.slug} href={s.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 50, fontSize: 12, fontWeight: 600,
              fontFamily: "'Cairo', sans-serif",
              background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e5e7eb",
              color: isDark ? "rgba(255,255,255,0.8)" : "#374151",
              textDecoration: "none", cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.04)";
              e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.25)" : "#d1d5db";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb";
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
            {s.name}
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
              style={{ opacity: 0.4 }}>
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── CLUSTER CARD ───────────────────────────────────────────────────────────
function ClusterCard({ cluster, hero, isDark, audioState, onAudio, savedState, onSave }) {
  const [expanded, setExpanded] = useState(hero);
  const [imgErr, setImgErr] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const isPlaying = audioState.clusterId === cluster.id && audioState.playing;
  const isPaused  = audioState.clusterId === cluster.id && audioState.paused;
  const isActive  = audioState.clusterId === cluster.id;

  const catStyle = getCatStyle(cluster.category, isDark);

  const T = { fontFamily: "'Cairo', sans-serif" };
  const TB = { fontFamily: "'IBM Plex Sans Arabic', sans-serif" };
  const titleColor = isDark ? "#F5F5F7" : "#111827";
  const leadColor  = isDark ? "rgba(229,229,234,0.75)" : "#4b5563";
  const metaColor  = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";

  return (
    <article
      style={{
        background: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.82)",
        border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(0,0,0,0.09)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 20, overflow: "hidden",
        boxShadow: isDark ? "0 4px 32px rgba(0,0,0,0.6)" : "0 4px 24px rgba(0,0,0,0.08)",
        transition: "all 0.25s ease", cursor: "pointer",
        animation: "fadeIn 0.4s ease forwards",
      }}
      dir="rtl"
      onClick={() => setExpanded(v => !v)}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = isDark ? "0 8px 48px rgba(0,0,0,0.8)" : "0 8px 40px rgba(0,0,0,0.14)";
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = isDark ? "0 4px 32px rgba(0,0,0,0.6)" : "0 4px 24px rgba(0,0,0,0.08)";
        e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.09)";
      }}
    >
      {/* Breaking bar */}
      {cluster.is_breaking && (
        <div style={{
          height: 3, background: "linear-gradient(90deg,#ef4444,#f97316,#ef4444)",
          animation: "breaking-pulse 1.5s ease-in-out infinite",
        }} />
      )}

      {/* Image — Strict 3:2 */}
      <div style={{ aspectRatio: "3/2", overflow: "hidden", position: "relative" }}>
        {!imgErr && cluster.image_url ? (
          <img
            src={cluster.image_url} alt={cluster.image_alt}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "transform 0.6s ease" }}
            loading={hero ? "eager" : "lazy"}
            onError={() => setImgErr(true)}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: isDark ? "rgba(255,255,255,0.04)" : "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: 40, opacity: 0.2 }}>📰</span>
            <span style={{ ...T, fontSize: 12, color: isDark ? "rgba(255,255,255,0.2)" : "#d1d5db" }}>الخلاصة الجزائرية</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.1) 50%,transparent 100%)" }} />

        {/* Badges */}
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
          <span style={{
            ...T, padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700,
            backdropFilter: "blur(10px)", ...catStyle,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            {cluster.is_breaking && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444",
                animation: "breaking-pulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            )}
            {CAT_LABELS[cluster.category] || cluster.category}
          </span>
          {cluster.is_developing && (
            <span style={{
              ...T, padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700,
              backdropFilter: "blur(10px)", background: "rgba(245,158,11,0.2)", color: "#fbbf24",
              border: "1px solid rgba(245,158,11,0.3)", display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ animation: "breaking-pulse 1s infinite", display: "inline-block" }}>📡</span>
              متطور
            </span>
          )}
        </div>

        {cluster.sources.length > 1 && (
          <div style={{ position: "absolute", bottom: 12, left: 12 }}>
            <span style={{
              ...T, padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600,
              backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.5)",
              color: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.12)",
            }}>
              {cluster.sources.length} مصادر
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: hero ? "20px 24px 24px" : 16, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ ...TB, fontSize: 11, color: metaColor }}>🕐 {cluster.updated}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Audio btn */}
            <button
              onClick={e => { e.stopPropagation(); onAudio(cluster); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 10px", borderRadius: 50, fontSize: 11, fontWeight: 600,
                fontFamily: "'Cairo', sans-serif",
                background: isActive ? (isDark ? "rgba(52,211,153,0.12)" : "rgba(5,150,105,0.08)") : (isDark ? "rgba(255,255,255,0.05)" : "#ffffff"),
                border: isActive ? (isDark ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(5,150,105,0.3)") : (isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e5e7eb"),
                color: isPlaying ? (isDark ? "#34d399" : "#059669") : (isDark ? "rgba(255,255,255,0.55)" : "#6b7280"),
                cursor: "pointer", transition: "all 0.15s ease",
              }}
              title={isPlaying ? "إيقاف" : "استمع للملخص"}
            >
              {isActive ? <Waveform playing={isPlaying} isDark={isDark} /> : (
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
                  <path d="M19.07 4.93a10 10 0 010 14.14"/>
                </svg>
              )}
            </button>

            {/* Save btn */}
            <button
              onClick={e => { e.stopPropagation(); onSave(cluster); }}
              style={{
                padding: 5, borderRadius: "50%", background: "transparent", border: "none",
                color: savedState ? (isDark ? "#fbbf24" : "#f59e0b") : (isDark ? "rgba(255,255,255,0.28)" : "#d1d5db"),
                cursor: "pointer", transition: "all 0.2s ease", fontSize: 16,
              }}
              title={savedState ? "إزالة من المحفوظات" : "حفظ للقراءة لاحقاً"}
            >
              {savedState ? "🔖" : "🏷️"}
            </button>
          </div>
        </div>

        {/* Title */}
        <h2 style={{
          ...T, fontWeight: 800, color: titleColor,
          fontSize: hero ? 22 : 15, lineHeight: 1.7,
        }}>
          {cluster.is_breaking && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 900,
              background: "#ef4444", color: "#fff", marginLeft: 8, verticalAlign: "middle",
            }}>⚡ عاجل</span>
          )}
          {cluster.title_ar}
        </h2>

        {/* Lead (hero only) */}
        {hero && cluster.lead_ar && (
          <p style={{ ...TB, fontSize: 13, lineHeight: 1.8, color: leadColor }}>{cluster.lead_ar}</p>
        )}

        {/* Summary toggle */}
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none",
            color: isDark ? "rgba(255,255,255,0.38)" : "#9ca3af",
            fontSize: 11, fontWeight: 600, cursor: "pointer", ...T,
            padding: 0, transition: "color 0.2s",
          }}
        >
          <span>الجوهر الرئيسي</span>
          <span style={{ fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
        </button>

        {/* AI Summary */}
        {expanded && (
          <div style={{
            borderRadius: 14, padding: 16,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
            animation: "fadeIn 0.25s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: "linear-gradient(#34d399,#2dd4bf)", flexShrink: 0 }} />
              <span style={{
                ...T, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                color: isDark ? "rgba(52,211,153,0.8)" : "#059669",
              }}>الخلاصة الذكية • ٣ نقاط</span>
            </div>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none", margin: 0, padding: 0 }} dir="rtl">
              {cluster.summary_points.slice(0, 3).map((p, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800,
                    background: isDark ? "rgba(52,211,153,0.18)" : "rgba(5,150,105,0.12)",
                    color: isDark ? "#34d399" : "#059669", marginTop: 2,
                  }}>{i + 1}</span>
                  <p style={{ ...TB, fontSize: 13, lineHeight: 1.75, flex: 1,
                    color: isDark ? "rgba(229,229,234,0.85)" : "#374151" }}>{p.point}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Developing Timeline */}
        {cluster.is_developing && cluster.timeline.length > 0 && (
          <div>
            <button
              onClick={e => { e.stopPropagation(); setShowTimeline(v => !v); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: isDark ? "rgba(251,191,36,0.7)" : "#d97706",
                fontSize: 11, fontWeight: 600, ...T, padding: 0, marginBottom: 8,
              }}
            >
              <span style={{ animation: "breaking-pulse 1s infinite", display: "inline-block" }}>📡</span>
              التطورات ({cluster.timeline.length})
              <span>{showTimeline ? "▲" : "▼"}</span>
            </button>
            {showTimeline && (
              <div style={{
                borderRight: `2px solid rgba(245,158,11,0.35)`,
                paddingRight: 16, display: "flex", flexDirection: "column", gap: 12,
                animation: "fadeIn 0.25s ease",
              }}>
                {cluster.timeline.map(t => (
                  <div key={t.id} style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", right: -24, top: 4,
                      width: 12, height: 12, borderRadius: "50%",
                      background: "rgba(245,158,11,0.6)", border: "2px solid #fbbf24",
                    }} />
                    <p style={{ ...TB, fontSize: 12, lineHeight: 1.7,
                      color: isDark ? "rgba(229,229,234,0.7)" : "#4b5563" }}>{t.text}</p>
                    <span style={{ fontSize: 11, color: metaColor }}>{t.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Source Dock */}
        {expanded && <div onClick={e => e.stopPropagation()}><SourceDock sources={cluster.sources} isDark={isDark} /></div>}
      </div>
    </article>
  );
}

// ─── NEWS FEED ──────────────────────────────────────────────────────────────
function NewsFeed({ clusters, loading, isDark, audioState, onAudio, savedFns }) {
  const { isSaved, toggle: toggleSave } = savedFns;

  const { heroes, featured, standard } = useMemo(() => {
    const heroes = [], featured = [], standard = [];
    clusters.forEach(c => {
      if (c.is_breaking || c.priority <= 2) heroes.push(c);
      else if (c.priority <= 4)             featured.push(c);
      else                                   standard.push(c);
    });
    return { heroes, featured, standard };
  }, [clusters]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SkeletonCard hero isDark={isDark} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} isDark={isDark} />)}
      </div>
    </div>
  );

  if (!clusters.length) return (
    <div style={{ textAlign: "center", padding: "80px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <span style={{ fontSize: 60, opacity: 0.18 }}>📰</span>
      <p style={{ fontFamily: "'Cairo', sans-serif", fontSize: 18, fontWeight: 700,
        color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af" }}>لا توجد نتائج مطابقة</p>
    </div>
  );

  const Divider = ({ label }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0" }}>
      <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb" }} />
      <span style={{ fontFamily: "'Cairo', sans-serif", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.12em", color: isDark ? "rgba(255,255,255,0.25)" : "#9ca3af" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "#e5e7eb" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }} dir="rtl">
      {heroes.map(c => (
        <ClusterCard key={c.id} cluster={c} hero isDark={isDark}
          audioState={audioState} onAudio={onAudio}
          savedState={isSaved(c.id)} onSave={toggleSave} />
      ))}

      {featured.length > 0 && (
        <>
          {heroes.length > 0 && <Divider label="أخبار بارزة" />}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
            {featured.map(c => (
              <ClusterCard key={c.id} cluster={c} isDark={isDark}
                audioState={audioState} onAudio={onAudio}
                savedState={isSaved(c.id)} onSave={toggleSave} />
            ))}
          </div>
        </>
      )}

      {standard.length > 0 && (
        <>
          {(heroes.length > 0 || featured.length > 0) && <Divider label="مزيد من الأخبار" />}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {standard.map(c => (
              <ClusterCard key={c.id} cluster={c} isDark={isDark}
                audioState={audioState} onAudio={onAudio}
                savedState={isSaved(c.id)} onSave={toggleSave} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── HEADER ─────────────────────────────────────────────────────────────────
function Header({ isDark, toggle, savedCount, onShowSaved, onSearch, onToggleSidebar, isOnline }) {
  const [showSearch, setShowSearch] = useState(false);
  const [q, setQ] = useState("");

  const bg = isDark
    ? "rgba(0,0,0,0.85)"
    : "rgba(255,255,255,0.85)";
  const T = { fontFamily: "'Cairo', sans-serif" };
  const textColor = isDark ? "#F5F5F7" : "#111827";
  const metaColor = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 100,
      background: bg, backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
      transition: "all 0.3s ease",
    }} dir="rtl">
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, gap: 12 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button onClick={onToggleSidebar} style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 8, border: "none", background: "none",
              color: metaColor, cursor: "pointer", fontSize: 18,
            }}>☰</button>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg,#059669,#0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "#fff", ...T,
              boxShadow: "0 2px 12px rgba(5,150,105,0.35)",
            }}>خ</div>
            <div>
              <p style={{ ...T, fontSize: 15, fontWeight: 800, color: textColor, lineHeight: 1.2 }}>الخلاصة الجزائرية</p>
              <p style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 9, color: metaColor, lineHeight: 1 }}>
                {isOnline ? "🟢 متصل" : "🔴 غير متصل"}
              </p>
            </div>
          </div>

          {/* Search */}
          {showSearch ? (
            <div style={{ flex: 1, display: "flex", gap: 8 }}>
              <input
                autoFocus
                value={q}
                onChange={e => { setQ(e.target.value); onSearch(e.target.value); }}
                placeholder="ابحث في الأخبار..."
                style={{
                  flex: 1, padding: "8px 14px", borderRadius: 12,
                  background: isDark ? "rgba(255,255,255,0.06)" : "#f9fafb",
                  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e5e7eb",
                  color: textColor, fontSize: 13, outline: "none",
                  fontFamily: "'IBM Plex Sans Arabic', sans-serif",
                }}
              />
              <button onClick={() => { setShowSearch(false); setQ(""); onSearch(""); }}
                style={{ padding: "8px 12px", borderRadius: 10, border: "none", background: "none",
                  color: metaColor, cursor: "pointer", fontSize: 13, ...T }}>إلغاء</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setShowSearch(true)} style={{
                width: 34, height: 34, borderRadius: 10, border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                color: metaColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>🔍</button>

              <button onClick={onShowSaved} style={{
                position: "relative", width: 34, height: 34, borderRadius: 10,
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                color: metaColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>
                🔖
                {savedCount > 0 && (
                  <span style={{
                    position: "absolute", top: -4, left: -4, width: 16, height: 16,
                    borderRadius: "50%", background: "#ef4444", color: "#fff",
                    fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{savedCount}</span>
                )}
              </button>

              <button onClick={toggle} style={{
                width: 34, height: 34, borderRadius: 10,
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                background: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                color: textColor, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s",
              }}>
                {isDark ? "☀️" : "🌙"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── CATEGORY SIDEBAR ────────────────────────────────────────────────────────
function Sidebar({ isDark, active, onSelect, isOpen, onClose }) {
  const T = { fontFamily: "'Cairo', sans-serif" };
  const textColor = isDark ? "#F5F5F7" : "#111827";
  const metaColor = isDark ? "rgba(255,255,255,0.35)" : "#9ca3af";

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)", zIndex: 49, display: "block",
          }}
        />
      )}
      <nav style={{
        position: "fixed", top: 60, right: 0,
        width: 220, height: "calc(100vh - 60px)",
        background: isDark ? "rgba(0,0,0,0.92)" : "rgba(255,255,255,0.96)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderLeft: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
        zIndex: 50,
        transform: isOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflowY: "auto", display: "flex", flexDirection: "column",
      }} dir="rtl">
        <div style={{ padding: "16px 12px", flex: 1 }}>
          {CATEGORIES.map(cat => {
            const isActive = (active === null && cat.slug === "all") || active === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => { onSelect(cat.slug === "all" ? null : cat.slug); onClose(); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 10, padding: "9px 12px", borderRadius: 12, border: "1px solid transparent",
                  background: isActive
                    ? (isDark ? "rgba(52,211,153,0.15)" : "rgba(5,150,105,0.08)")
                    : "none",
                  borderColor: isActive
                    ? (isDark ? "rgba(52,211,153,0.25)" : "rgba(5,150,105,0.2)")
                    : "transparent",
                  cursor: "pointer", transition: "all 0.15s ease", marginBottom: 2,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{cat.icon}</span>
                  <span style={{
                    ...T, fontSize: 13, fontWeight: 600,
                    color: isActive ? (isDark ? "#34d399" : "#059669") : (isDark ? "rgba(255,255,255,0.65)" : "#374151"),
                  }}>{cat.name_ar}</span>
                  {cat.slug === "breaking" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "breaking-pulse 1.5s infinite" }} />}
                </div>
                <span style={{
                  fontSize: 10, padding: "2px 6px", borderRadius: 8,
                  background: isActive ? (isDark ? "rgba(52,211,153,0.2)" : "rgba(5,150,105,0.12)") : (isDark ? "rgba(255,255,255,0.07)" : "#f3f4f6"),
                  color: isActive ? (isDark ? "#34d399" : "#059669") : metaColor,
                  fontFamily: "monospace",
                }}>{cat.count}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: "12px 16px", borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f3f4f6" }}>
          <p style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 10, textAlign: "center",
            color: isDark ? "rgba(255,255,255,0.18)" : "#d1d5db" }}>
            مدعوم بـ Cloudflare Workers AI
          </p>
        </div>
      </nav>
    </>
  );
}

// ─── SAVED PANEL ─────────────────────────────────────────────────────────────
function SavedPanel({ isDark, isOpen, onClose, saved, onRemove }) {
  const T = { fontFamily: "'Cairo', sans-serif" };
  const TB = { fontFamily: "'IBM Plex Sans Arabic', sans-serif" };
  const textColor = isDark ? "#F5F5F7" : "#111827";
  const metaColor = isDark ? "rgba(255,255,255,0.3)" : "#9ca3af";

  return (
    <>
      {isOpen && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(4px)", zIndex: 200,
        }} />
      )}
      <div style={{
        position: "fixed", left: 0, top: 0, height: "100%", width: 320, maxWidth: "90vw",
        background: isDark ? "rgba(0,0,0,0.95)" : "#ffffff",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        borderRight: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
        zIndex: 201,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
      }} role="dialog" dir="rtl">
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 18px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f3f4f6",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>🔖</span>
            <h2 style={{ ...T, fontSize: 16, fontWeight: 700, color: textColor }}>المحفوظات</h2>
            {saved.length > 0 && (
              <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 8,
                background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
                color: metaColor }}>{saved.length}</span>
            )}
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: "none", background: "none",
            color: metaColor, cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>

        <div style={{ padding: "8px 12px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "#f9fafb" }}>
          <p style={{ ...TB, fontSize: 11, color: metaColor, display: "flex", alignItems: "center", gap: 5 }}>
            📡 متاح للقراءة بدون إنترنت
          </p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {saved.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <p style={{ fontSize: 50, opacity: 0.15 }}>🔖</p>
              <p style={{ ...T, fontSize: 15, fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "#9ca3af", marginTop: 12 }}>لا توجد مقالات محفوظة</p>
              <p style={{ ...TB, fontSize: 12, color: metaColor, marginTop: 6 }}>اضغط 🏷️ لحفظ أي خبر</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {saved.map(a => (
                <div key={a.id} style={{
                  borderRadius: 14, overflow: "hidden",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e5e7eb",
                  background: isDark ? "rgba(255,255,255,0.03)" : "#f9fafb",
                }}>
                  {a.image_url && (
                    <div style={{ aspectRatio: "3/2" }}>
                      <img src={a.image_url} alt={a.title_ar}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        loading="lazy" />
                    </div>
                  )}
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ ...T, fontSize: 13, fontWeight: 700, lineHeight: 1.6, color: textColor }}>{a.title_ar}</p>
                    {a.summary_points?.[0] && (
                      <p style={{ ...TB, fontSize: 11, lineHeight: 1.6,
                        color: isDark ? "rgba(229,229,234,0.55)" : "#6b7280" }}>
                        • {a.summary_points[0].point.substring(0, 90)}...
                      </p>
                    )}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button onClick={() => onRemove(a.id)} style={{
                        padding: "4px 8px", borderRadius: 8, border: "none", background: "none",
                        color: isDark ? "rgba(255,255,255,0.25)" : "#d1d5db",
                        cursor: "pointer", fontSize: 12, ...T, transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={e => e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.25)" : "#d1d5db"}
                      >🗑️ حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const { isDark, toggle } = useTheme();
  const savedFns = useSaved();
  const { state: audioState, speak: onAudio, stop: stopAudio } = useAudio();

  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedPanelOpen, setSavedPanelOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1100));
    setClusters(CLUSTERS);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  const filtered = useMemo(() => {
    let r = clusters;
    if (activeCategory) r = r.filter(c => c.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(c =>
        c.title_ar.includes(q) ||
        c.lead_ar?.includes(q) ||
        c.summary_points.some(p => p.point.includes(q)) ||
        c.sources.some(s => s.name.includes(q))
      );
    }
    return r;
  }, [clusters, activeCategory, searchQuery]);

  const bgStyle = isDark
    ? { background: "#000000" }
    : { background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8f4f0 100%)" };

  const T = { fontFamily: "'Cairo', sans-serif" };
  const metaColor = isDark ? "rgba(255,255,255,0.28)" : "#9ca3af";

  return (
    <div style={{ minHeight: "100vh", ...bgStyle, direction: "rtl", position: "relative", overflowX: "hidden" }}>
      <FontLoader />
      <GlobalStyles />

      {/* OLED ambient glow */}
      {isDark && (
        <>
          <div style={{
            position: "fixed", top: 0, left: "20%", width: 400, height: 400,
            background: "radial-gradient(circle, rgba(5,150,105,0.07) 0%, transparent 70%)",
            filter: "blur(80px)", pointerEvents: "none", zIndex: 0,
          }} />
          <div style={{
            position: "fixed", bottom: "20%", right: "15%", width: 320, height: 320,
            background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
            filter: "blur(100px)", pointerEvents: "none", zIndex: 0,
          }} />
        </>
      )}

      {/* Header */}
      <Header
        isDark={isDark} toggle={toggle}
        savedCount={savedFns.saved.length}
        onShowSaved={() => setSavedPanelOpen(true)}
        onSearch={setSearchQuery}
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        isOnline={isOnline}
      />

      {/* Sidebar */}
      <Sidebar
        isDark={isDark} active={activeCategory}
        onSelect={setActiveCategory}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Saved Panel */}
      <SavedPanel
        isDark={isDark} isOpen={savedPanelOpen}
        onClose={() => setSavedPanelOpen(false)}
        saved={savedFns.saved}
        onRemove={savedFns.remove}
      />

      {/* Main */}
      <main style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Status bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeCategory && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px", borderRadius: 50, fontSize: 12,
                background: isDark ? "rgba(255,255,255,0.06)" : "#fff",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280",
              }}>
                <span style={{ ...T }}>
                  {CATEGORIES.find(c => c.slug === activeCategory)?.icon}{" "}
                  {CATEGORIES.find(c => c.slug === activeCategory)?.name_ar}
                </span>
                <button onClick={() => setActiveCategory(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "inherit", lineHeight: 1 }}>✕</button>
              </div>
            )}
            {!loading && (
              <span style={{ ...T, fontSize: 11, color: metaColor }}>{filtered.length} خبر</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastUpdated && (
              <span style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 11, color: isDark ? "rgba(255,255,255,0.18)" : "#d1d5db" }}>
                آخر تحديث: {lastUpdated.toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button onClick={fetchClusters} disabled={loading} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, ...T,
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
              background: isDark ? "rgba(255,255,255,0.05)" : "#fff",
              color: isDark ? "rgba(255,255,255,0.4)" : "#9ca3af",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
            }}>
              <span style={{ display: "inline-block", animation: loading ? "breaking-pulse 0.8s infinite" : "none" }}>🔄</span>
              {loading ? "جارٍ التحديث..." : "تحديث"}
            </button>
          </div>
        </div>

        {/* Offline notice */}
        {!isOnline && (
          <div style={{
            marginBottom: 16, padding: "10px 16px", borderRadius: 12,
            background: isDark ? "rgba(245,158,11,0.08)" : "#fffbeb",
            border: isDark ? "1px solid rgba(245,158,11,0.2)" : "1px solid #fde68a",
            color: isDark ? "rgba(251,191,36,0.8)" : "#d97706",
            fontFamily: "'Cairo', sans-serif", fontSize: 13,
          }}>
            📡 وضع عدم الاتصال — يتم عرض المحتوى المخزن مؤقتاً
          </div>
        )}

        {/* News Feed */}
        <NewsFeed
          clusters={filtered} loading={loading} isDark={isDark}
          audioState={audioState} onAudio={onAudio}
          savedFns={savedFns}
        />
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 10,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e5e7eb",
        padding: "28px 20px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: "linear-gradient(135deg,#059669,#0d9488)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 900, color: "#fff", ...T,
            }}>خ</div>
            <div>
              <p style={{ ...T, fontSize: 13, fontWeight: 700, color: isDark ? "rgba(245,245,247,0.6)" : "#6b7280" }}>الخلاصة الجزائرية</p>
              <p style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 10, color: isDark ? "rgba(255,255,255,0.22)" : "#d1d5db" }}>مُجمِّع الأخبار بالذكاء الاصطناعي</p>
            </div>
          </div>
          <p style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif", fontSize: 10, color: isDark ? "rgba(255,255,255,0.15)" : "#d1d5db", textAlign: "center" }}>
            مدعوم بـ Cloudflare Workers AI • D1 • Pages<br />
            © 2025 El-Kholasa DZ
          </p>
        </div>
      </footer>

      {/* Audio stop btn (floating) */}
      {audioState.clusterId !== null && (
        <button
          onClick={stopAudio}
          style={{
            position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
            zIndex: 300, display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 50,
            background: isDark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(16px)", border: isDark ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(5,150,105,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            cursor: "pointer", animation: "glow-pulse 2s infinite",
            fontFamily: "'Cairo', sans-serif", fontSize: 13, fontWeight: 600,
            color: isDark ? "#34d399" : "#059669",
          }}
        >
          <Waveform playing={audioState.playing} isDark={isDark} />
          <span>إيقاف القراءة الصوتية</span>
        </button>
      )}
    </div>
  );
}
