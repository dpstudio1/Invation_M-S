/* =====================================================================
   WEDDING INVITATION — CONFIG FILE
   غيّر بياناتك في هذا الملف فقط، وسيتم تحديث الدعوة بالكامل تلقائيًا.
   ===================================================================== */
window.WEDDING_CONFIG = {

  /* ---- الزوجان / The Couple ---- */
  couple: {
    groom: {
      ar: "العريس محمد",
      en: "The Groom",
      firstName: "M",
      lastName: "A"
    },
    bride: {
      ar: "العروس سارة",
      en: "The Bride",
      firstName: "S",
      lastName: "A"
    },
    // الأحرف المستخدمة في الشعار الزخرفي (حرفا العريس والعروس)
    monogramArabic: "م & س",
    // الصيغة الإنجليزية المعروضة فوق العبارة العربية
    headlineEn: "TOGETHER WITH THEIR FAMILIES",
    welcomeAr: "بكل الحب، ندعوكم لمشاركتنا أجمل لحظات العمر",
    namesDateLabel: "نبارك زواجنا بحضوركم ودعواتكم الطيبة"
  },

  /* ---- موعد الزفاف / Wedding Date ----
     الصيغة: سنة-شهر-يومTساعة:دقيقة
     يتحكم في العد التنازلي وفي العبارة اللطيفة فوقه. */
  wedding: {
    // التاريخ الكامل لعرضه في الدعوة
    dateLabelAr: "الجمعة — ٢٥ ديسمبر ٢٠٢٦",
    dateLabelEn: "FRIDAY · DECEMBER 25, 2026",
    ceremonyTime: "الساعة 7:00 مساءً",
    // تاريخ ووقت العد التنازلي البرمجي (بتوقيت جهاز الزائر)
    countdownDateTime: "2026-12-25T19:00:00",
    countdownTitleEn: "THE COUNTDOWN TO FOREVER",
    countdownSubtitleAr: "«لم يتبقَّ سوى القليل لنحتفل معًا ببداية حكاية جديدة»",
    countdownDoneTitleEn: "TODAY IS THE DAY",
    countdownDoneAr: "لقد حان الموعد… ننتظركم لنبدأ معًا بدايةً لا تنتهي"
  },

  /* ---- القاعة والموقع / Venue ---- */
  venue: {
    nameAr: "قاعة الليالي الملكية",
    nameEn: "ROYAL NIGHTS HALL",
    cityAr: "القاهرة — مصر",
    cityEn: "CAIRO · EGYPT",
    addressAr: "شارع المتحف، أمام حديقة الأطفال، الزمالك",
    // وقت استقبال الضيوف
    guestsReception: "بدء استقبال الضيوف: 6:30 مساءً",
    // رابط فتح الموقع في خرائط جوجل (عدّله إلى الإحداثيات/الرابط الصحيح)
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cairo+Egypt",
    mapsButtonAr: "عرض موقع القاعة",
    mapsButtonEn: "VIEW LOCATION ON MAP"
  },

  /* ---- الصور / Images ----
     استبدل الملفات داخل مجلد assets/images أو غيّر المسارات هنا.
     الصور الحالية صور تجريبية واضحة الاستبدال. */
  images: {
    coupleMain: "assets/images/couple-main.svg",
    groom: "assets/images/groom.svg",
    bride: "assets/images/bride.svg",
    gallery: [
      "assets/images/gallery/photo-1.svg",
      "assets/images/gallery/photo-2.svg",
      "assets/images/gallery/photo-3.svg",
      "assets/images/gallery/photo-4.svg"
    ]
  },

  /* ---- الموسيقى / Music ---- */
  audio: {
    // ضع ملف الموسيقى الفعلي في assets/audio/wedding-music.mp3 أو غيّر المسار هنا
    src: "assets/audio/wedding-music1.mp3",
    volume: 0.55,
    title: "Wedding Waltz"
  },

/* ---- مشهد القاعة / Hall ---- */
  hall: {
    image: "assets/images/hall.svg",
    // عبارة تظهر لحظيًا عند دخول القاعة
    arrivalLineEn: "A LOVE STORY BEGINS",
    arrivalLineAr: "حكاية حبّ تبدأ"
  },

  /* ---- إعدادات عامة ---- */
  effects: {
    // جسيمات ذهبية: عددها (0 لإيقافها)
    particles: 90,
    // مؤشر تمرير مخصص على الأجهزة المزودة بفأرة
    customCursor: true,
    // مدة تقديم شاشة البداية بالمللي ثانية
    introDuration: 2600
  }
};