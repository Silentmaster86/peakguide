import { Link, NavLink, useLocation } from "react-router-dom";
import DesktopThemeSwitcher from "./DesktopThemeSwitcher";
import LanguageSwitcherDropdown from "./LanguageSwitcherDropdown";
import NavDropdown from "./NavDropdown";
import { useMedia } from "../hooks/useMedia";
import { useAuth } from "../auth/AuthContext";

  export default function Navbar({ lang = "pl", uiLang, setUiLang }) {
  const t = getLabels(lang);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  const isCompact = useMedia("(max-width: 959px)");
  const isMobile = useMedia("(max-width: 759px)");

  const { status, logout } = useAuth();
  const authed = status === "authed";
  const busy = status === "loading";

  const homeSections = [
    { to: "/#why", label: t.why },
    { to: "/#how", label: t.how },
    { to: "/#featured", label: t.featured },
    { to: "/#faq", label: t.faq },
  ];

  const moreItems = [
    ...(isHome && isCompact
      ? [
          { key: "s1", href: "/#why", label: t.why, sub: t.moreHome },
          { key: "s2", href: "/#how", label: t.how, sub: t.moreHome },
          { key: "s3", href: "/#featured", label: t.featured, sub: t.moreHome },
          { key: "s4", href: "/#faq", label: t.faq, sub: t.moreHome },
          { key: "sep-home", type: "sep" },
        ]
      : []),

    {
      key: "routes",
      label: t.routes,
      disabled: true,
      pill: t.soon,
      tip: t.soonTip,
    },
    {
      key: "trailheads",
      label: t.trailheads,
      disabled: true,
      pill: t.soon,
      tip: t.soonTip,
    },
  ];

  return (
    <nav
      id="main-nav"
      aria-label="Primary"
      style={{
        ...styles.nav,
        ...(isMobile
          ? {
              gridTemplateColumns: "1fr auto",
              gridTemplateAreas: `
                "left right"
                "center center"
              `,
              gap: 8,
              padding: 10,
              alignItems: "center",
            }
          : null),
      }}
    >
      {/* LEFT */}
      <div
        style={{
          ...styles.left,
          gridArea: isMobile ? "left" : undefined,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <NavLink
          to="/"
          style={{
            ...styles.homeLink,
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <span style={styles.brandBadge}>⛰️</span>

          {/* brand text wrapper */}
          <div style={{ marginLeft: 8, minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                ...styles.brandTitle,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: isMobile ? 140 : "none",
              }}
            >
              PeakGuide
            </div>

            {/* tagline hidden on mobile (żeby nie walczyło o miejsce) */}
            {!isMobile ? <div style={styles.brandSub}>{t.tagline}</div> : null}
          </div>
        </NavLink>
      </div>

      {/* RIGHT */}
      <div
        style={{
          ...styles.right,
          gridArea: isMobile ? "right" : undefined,
          flexWrap: "nowrap",
          gap: 8,
          justifyContent: "flex-end",
        }}
      >
        {busy ? (
          <span style={styles.authPillMuted}>{isMobile ? "⏳" : t.sessionLoading}</span>
        ) : authed ? (
          <>
            <NavLink to="/panel" style={styles.authLink}>
              {isMobile ? "👤" : t.panel}
            </NavLink>

            <button type="button" onClick={logout} style={styles.logoutBtn}>
              {isMobile ? "⎋" : t.logout}
            </button>
          </>
        ) : (
          <NavLink to="/login" style={styles.authLink}>
            {isMobile ? "🔐" : t.login}
          </NavLink>
        )}

        <DesktopThemeSwitcher lang={uiLang} compact={isMobile} />
        <LanguageSwitcherDropdown lang={uiLang} setLang={setUiLang} compact={isMobile} />
      </div>

      {/* CENTER */}
      <div
        style={{
          ...styles.center,
          gridArea: isMobile ? "center" : undefined,
          minWidth: 0,
          ...(isMobile
            ? {
                justifyContent: "flex-start",
                flexWrap: "nowrap",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                paddingTop: 6,
                paddingBottom: 2,
                maxWidth: "100%",
              }
            : null),
        }}
      >
        <NavLink to="/peaks" style={styles.navLink}>
          {t.peaks}
        </NavLink>

        <NavLink to="/ranges" style={styles.navLink}>
          {t.ranges}
        </NavLink>

        {isHome && !isCompact && (
          <>
            <span style={styles.sep} aria-hidden="true" />
            {homeSections.map((i) => (
              <Link key={i.to} to={i.to} style={styles.hashLink}>
                {i.label}
              </Link>
            ))}
          </>
        )}

        <NavDropdown label={t.more} items={moreItems} />
      </div>
    </nav>
  );
  }      

/* ---------------- labels ---------------- */

function getLabels(lang) {
  const dict = {
    pl: {
      tagline: "Korona Gór Polski i nie tylko",
      peaks: "Szczyty",
      ranges: "Pasma",
      routes: "Trasy",
      trailheads: "Punkty startowe",
      soon: "wkrótce",
      soonTip: "Ta sekcja będzie dostępna wkrótce.",
      more: "Więcej",

      why: "Dlaczego",
      how: "Jak działa",
      featured: "Polecane",
      faq: "FAQ",
      moreHome: "Sekcja na stronie głównej",

      login: "Zaloguj",
      logout: "Wyloguj",
      panel: "Panel",
      sessionLoading: "Ładowanie sesji...",
    },
    en: {
      tagline: "Crown of Polish Mountains & more",
      peaks: "Peaks",
      ranges: "Ranges",
      routes: "Routes",
      trailheads: "Trailheads",
      soon: "soon",
      soonTip: "This section is coming soon.",
      more: "More",

      why: "Why",
      how: "How it works",
      featured: "Featured",
      faq: "FAQ",
      moreHome: "Home section",

      login: "Login",
      logout: "Logout",
      panel: "Panel",
      sessionLoading: "Loading session..",
    },
    ua: {
      tagline: "Корона польських гір і не тільки",
      peaks: "Вершини",
      ranges: "Хребти",
      routes: "Маршрути",
      trailheads: "Стартові точки",
      soon: "скоро",
      soonTip: "Цей розділ скоро буде доступний.",
      more: "Більше",

      why: "Чому",
      how: "Як працює",
      featured: "Вибране",
      faq: "FAQ",
      moreHome: "Розділ головної",

      login: "Увійти",
      logout: "Вийти",
      panel: "Панель",
      sessionLoading: "Завантаження сесії…",
    },
    zh: {
      tagline: "波兰山冠及更多",
      peaks: "山峰",
      ranges: "山脉",
      routes: "路线",
      trailheads: "起点",
      soon: "即将",
      soonTip: "该功能即将上线。",
      more: "更多",

      why: "为什么",
      how: "如何使用",
      featured: "精选",
      faq: "FAQ",
      moreHome: "主页区块",

      login: "登录",
      logout: "退出",
      panel: "面板",
      sessionLoading: "正在加载会话…",
    },
  };

  return dict[lang] || dict.pl;
}

/* ---------------- styles ---------------- */

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 12,
    background: "var(--btn-bg)",
    boxShadow: "var(--shadow-soft)",
    border: "1px solid var(--border)",
    marginBottom: 14,
  },

  left: { display: "flex", alignItems: "center", gap: 10 },

  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--nav-gap)",
    flexWrap: "wrap",
    maxWidth: 860,
    overflow: "visible",
    minWidth: 0,
  },

  right: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    alignItems: "center",
  },

  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    border: "1px solid rgba(31,122,79,0.28)",
    background: "var(--primary)",
    fontWeight: 1000,
    flex: "0 0 auto",
  },

  brandTitle: { fontWeight: 1000, letterSpacing: "-0.3px" },
  brandSub: { fontSize: 12, color: "var(--muted)", marginTop: 2 },

  homeLink: {
    textDecoration: "none",
    fontWeight: 700,
    color: "var(--text)",
    height: "var(--nav-pill-h)",
    padding: `0 var(--nav-pill-px)`,
    display: "inline-flex",
    alignItems: "center",
    minWidth: 0,
  },

  navLink: ({ isActive }) => ({
    textDecoration: "none",
    fontWeight: 700,
    height: "var(--nav-pill-h)",
    padding: `0 var(--nav-pill-px)`,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid var(--border)",
    fontSize: "var(--nav-pill-fs)",
    background: isActive ? "var(--ink)" : "var(--btn-bg)",
    color: isActive ? "var(--btn-bg)" : "var(--text)",
    boxShadow: "var(--shadow-soft)",
    whiteSpace: "nowrap",
  }),

  hashLink: {
    textDecoration: "none",
    fontWeight: 700,
    height: "var(--nav-pill-h)",
    fontSize: "var(--nav-pill-fs)",
    padding: `0 var(--nav-pill-px)`,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.55)",
    color: "var(--text)",
    boxShadow: "var(--shadow-soft)",
    whiteSpace: "nowrap",
  },

  sep: {
    width: 1,
    height: 26,
    borderRadius: 99,
    background: "rgba(15,23,42,0.14)",
    margin: "0 2px",
  },

  authLink: ({ isActive }) => ({
    textDecoration: "none",
    fontWeight: 900,
    height: "var(--nav-pill-h)",
    padding: `0 var(--nav-pill-px)`,
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    border: "1px solid var(--border)",
    fontSize: "var(--nav-pill-fs)",
    background: isActive ? "var(--ink)" : "var(--btn-bg)",
    color: isActive ? "var(--btn-bg)" : "var(--text)",
    boxShadow: "var(--shadow-soft)",
    whiteSpace: "nowrap",
  }),

  logoutBtn: {
    height: "var(--nav-pill-h)",
    padding: `0 var(--nav-pill-px)`,
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--btn-bg)",
    color: "var(--text)",
    fontWeight: 900,
    fontSize: "var(--nav-pill-fs)",
    cursor: "pointer",
    boxShadow: "var(--shadow-soft)",
    whiteSpace: "nowrap",
  },

  authPillMuted: {
    height: "var(--nav-pill-h)",
    padding: `0 var(--nav-pill-px)`,
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "rgba(255,255,255,0.35)",
    color: "var(--muted)",
    fontWeight: 900,
    fontSize: "var(--nav-pill-fs)",
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
};
