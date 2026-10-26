import { useMemo } from 'react';

/**
 * AboutPage
 * - Product-focused (no tech stack talk)
 * - Short, friendly, useful
 * - Supports PL / EN / UA / ZH
 */

export default function AboutPage({ lang = 'pl' }) {
  const t = useMemo(() => getLabels(lang), [lang]);

  return (
    <div style={wrap}>
      <section style={card} aria-label="About PeakGuide">
        <div style={kicker}>{t.kicker}</div>
        <h1 style={title}>{t.title}</h1>

        <p style={lead}>{t.lead}</p>

        <div style={grid}>
          <div style={box}>
            <div style={boxTitle}>{t.b1Title}</div>
            <p style={p}>{t.b1Body}</p>
          </div>

          <div style={box}>
            <div style={boxTitle}>{t.b2Title}</div>
            <p style={p}>{t.b2Body}</p>
          </div>

          <div style={box}>
            <div style={boxTitle}>{t.b3Title}</div>
            <p style={p}>{t.b3Body}</p>
          </div>
        </div>

        <div style={note}>
          <div style={noteTitle}>{t.noteTitle}</div>
          <div style={noteBody}>{t.noteBody}</div>
        </div>
      </section>
    </div>
  );
}

/* ----------------------------- labels ----------------------------- */

function getLabels(lang) {
  const dict = {
    pl: {
      kicker: 'O projekcie',
      title: 'PeakGuide',
      lead: 'PeakGuide to międzynarodowy przewodnik górski, który pomaga odkrywać szczyty, poznawać trasy i znaleźć praktyczne informacje potrzebne do zaplanowania wyjścia w góry.',
      b1Title: 'Odkrywaj góry',
      b1Body:
        'Przeglądaj szczyty z różnych krajów, regionów i pasm górskich. Korzystaj z wyszukiwania i filtrów, aby szybko znaleźć interesujące Cię miejsce.',
      b2Title: 'Planuj trasę',
      b2Body:
        'Sprawdzaj przebieg tras, dystans, przewyższenie, orientacyjny czas przejścia, poziom trudności oraz praktyczne informacje o dojeździe i parkingu.',
      b3Title: 'Sprawdzaj źródła',
      b3Body:
        'Tam, gdzie to możliwe, informacje są powiązane ze źródłami i datą ich weryfikacji. Dzięki temu możesz sprawdzić, skąd pochodzą dane i kiedy zostały potwierdzone.',
      noteTitle: 'PeakGuide ciągle się rozwija',
      noteBody:
        'Dodajemy kolejne góry, kraje, trasy i praktyczne informacje. Dane terenowe, zasady dostępu, ceny i warunki mogą się zmieniać, dlatego przed wyjściem zawsze sprawdź aktualne informacje w oficjalnych źródłach.',
    },

    en: {
      kicker: 'About',
      title: 'PeakGuide',
      lead: 'PeakGuide is an international mountain guide designed to help you discover peaks, explore hiking routes and find practical information for planning a mountain trip.',
      b1Title: 'Discover mountains',
      b1Body:
        'Explore peaks across different countries, regions and mountain ranges. Use search and filters to quickly find the places you are interested in.',
      b2Title: 'Plan your route',
      b2Body:
        'Check routes, distance, elevation gain, estimated hiking time, difficulty and practical information about access and parking.',
      b3Title: 'Check the sources',
      b3Body:
        'Where possible, information is linked to its source and verification date, so you can see where the data comes from and when it was last checked.',
      noteTitle: 'PeakGuide is continuously growing',
      noteBody:
        'More mountains, countries, routes and practical information are being added. Access rules, prices and mountain conditions can change, so always check current information from official sources before your trip.',
    },

    ua: {
      kicker: 'Про проєкт',
      title: 'PeakGuide',
      lead: 'PeakGuide — це міжнародний гірський путівник, який допомагає відкривати вершини, знаходити туристичні маршрути та практичну інформацію для планування походу.',
      b1Title: 'Відкривайте гори',
      b1Body:
        'Переглядайте вершини різних країн, регіонів і гірських хребтів. Використовуйте пошук і фільтри, щоб швидко знайти потрібне місце.',
      b2Title: 'Плануйте маршрут',
      b2Body:
        'Перевіряйте маршрути, відстань, набір висоти, орієнтовний час проходження, складність, а також інформацію про доїзд і паркування.',
      b3Title: 'Перевіряйте джерела',
      b3Body:
        'Де це можливо, інформація містить посилання на джерело та дату перевірки, щоб можна було побачити походження даних і коли їх востаннє перевіряли.',
      noteTitle: 'PeakGuide постійно розвивається',
      noteBody:
        'Ми додаємо нові гори, країни, маршрути та практичну інформацію. Правила доступу, ціни й умови в горах можуть змінюватися, тому перед походом завжди перевіряйте актуальну інформацію в офіційних джерелах.',
    },

    zh: {
      kicker: '关于',
      title: 'PeakGuide',
      lead: 'PeakGuide 是一个国际山地指南，帮助你探索不同的山峰和徒步路线，并查找规划登山行程所需的实用信息。',
      b1Title: '探索山峰',
      b1Body: '浏览不同国家、地区和山脉的山峰，并通过搜索和筛选快速找到你感兴趣的地点。',
      b2Title: '规划路线',
      b2Body: '查看路线、距离、累计爬升、预计徒步时间、难度，以及交通和停车等实用信息。',
      b3Title: '查看信息来源',
      b3Body:
        '在条件允许的情况下，信息会附带来源和验证日期，让你了解数据来自哪里以及最近一次核实的时间。',
      noteTitle: 'PeakGuide 正在持续发展',
      noteBody:
        '我们正在不断增加新的山峰、国家、路线和实用信息。通行规定、价格和山区条件可能发生变化，因此出发前请务必查看官方来源中的最新信息。',
    },
  };

  return dict[lang] || dict.pl;
}

/* ----------------------------- styles ----------------------------- */

const wrap = {
  display: 'grid',
  gap: 14,
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
};

const card = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflow: 'hidden',
  border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
  borderRadius: 22,
  padding: 16,
  background:
    'radial-gradient(900px 340px at 20% 0%, color-mix(in srgb, var(--primary) 10%, transparent), transparent 60%), radial-gradient(700px 340px at 90% 20%, rgba(217,119,6,0.08), transparent 55%), var(--surface)',
  boxShadow: 'var(--shadow-soft)',
  color: 'var(--text)',
};

const kicker = {
  fontSize: 12,
  fontWeight: 950,
  opacity: 0.8,
  letterSpacing: '0.2px',
  textTransform: 'uppercase',
};

const title = {
  margin: '6px 0 0',
  fontSize: 26,
  letterSpacing: '-0.7px',
  lineHeight: 1.1,
};

const lead = {
  margin: '10px 0 0',
  color: 'var(--muted)',
  lineHeight: 1.7,
  maxWidth: 940,
};

const grid = {
  marginTop: 14,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
  gap: 12,
  width: '100%',
  minWidth: 0,
};

const box = {
  minWidth: 0,
  border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
  borderRadius: 18,
  padding: 14,
  background: 'var(--surface-2)',
  boxShadow: 'var(--shadow-soft)',
};

const boxTitle = {
  fontWeight: 1100,
  letterSpacing: '-0.2px',
};

const p = {
  margin: '8px 0 0',
  color: 'var(--muted)',
  lineHeight: 1.65,
};

const note = {
  marginTop: 14,
  border: '1px solid color-mix(in srgb, var(--primary) 22%, var(--border))',
  borderRadius: 18,
  padding: 14,
  background: 'color-mix(in srgb, var(--primary) 8%, var(--surface-2))',
};

const noteTitle = {
  fontWeight: 1100,
  letterSpacing: '-0.2px',
};

const noteBody = {
  marginTop: 6,
  color: 'var(--muted)',
  lineHeight: 1.6,
};
