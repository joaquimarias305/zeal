import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import Logo from '../components/common/Logo';

const features = [
  { icon: '⚡', titleKey: 'land.f1_title', descKey: 'land.f1_desc' },
  { icon: '💳', titleKey: 'land.f2_title', descKey: 'land.f2_desc' },
  { icon: '⭐', titleKey: 'land.f3_title', descKey: 'land.f3_desc' },
  { icon: '🌎', titleKey: 'land.f4_title', descKey: 'land.f4_desc' },
  { icon: '✅', titleKey: 'land.f5_title', descKey: 'land.f5_desc' },
  { icon: '📅', titleKey: 'land.f6_title', descKey: 'land.f6_desc' },
];

const steps = [
  { n: '1', icon: '📋', titleKey: 'land.s1_title', descKey: 'land.s1_desc' },
  { n: '2', icon: '🔍', titleKey: 'land.s2_title', descKey: 'land.s2_desc' },
  { n: '3', icon: '✅', titleKey: 'land.s3_title', descKey: 'land.s3_desc' },
  { n: '4', icon: '💰', titleKey: 'land.s4_title', descKey: 'land.s4_desc' },
];

const testimonials = [
  {
    name: 'Carlos M.',
    role: 'Server · Miami Beach',
    avatar: 'C',
    color: 'bg-brand-100 text-brand-600',
    quote: {
      es: '"Antes tardaba dias en encontrar trabajo. Con ZEAL tengo turno en minutos y el pago me llega el mismo dia."',
      en: '"Before it took days to find work. With ZEAL I get a shift in minutes and get paid the same day."',
    },
    rating: 5,
  },
  {
    name: 'Ocean Drive Bistro',
    role: 'Restaurant · South Beach',
    avatar: 'O',
    color: 'bg-miami-teal/20 text-miami-teal',
    quote: {
      es: '"Publicamos un turno y en 30 minutos teniamos 8 candidatos verificados. El proceso de pago es automatico."',
      en: '"We posted a shift and in 30 minutes had 8 verified candidates. The payment process is automatic."',
    },
    rating: 5,
  },
  {
    name: 'Maria G.',
    role: 'Housekeeping · Doral',
    avatar: 'M',
    color: 'bg-pink-100 text-pink-600',
    quote: {
      es: '"Me encanta que todo esta en espanol. Finalmente una app que entiende nuestra comunidad."',
      en: '"I love that everything is in Spanish. Finally an app that understands our community."',
    },
    rating: 5,
  },
];

const plans = [
  {
    nameKey: 'land.plan_worker',
    price: '0',
    period: '',
    color: 'border-gray-200',
    badge: null,
    features: ['land.pw1','land.pw2','land.pw3','land.pw4','land.pw5'],
    cta: 'auth.register_btn',
    ctaLink: '/register',
    ctaStyle: 'btn-secondary w-full py-3',
  },
  {
    nameKey: 'land.plan_business',
    price: '15',
    period: 'land.per_shift',
    color: 'border-brand-500 ring-2 ring-brand-500',
    badge: 'land.popular',
    features: ['land.pb1','land.pb2','land.pb3','land.pb4','land.pb5'],
    cta: 'land.start_free',
    ctaLink: '/register',
    ctaStyle: 'btn-primary w-full py-3',
  },
];

const zones = ['Miami Beach','Brickell','Wynwood','Doral','Coral Gables','Little Havana','Hialeah','Aventura'];

const Stars = ({ n = 5 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: n }).map((_, i) => (
      <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    ))}
  </div>
);

export default function LandingPage() {
  const { t } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="overflow-x-hidden">

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-gray-900 via-miami-navy to-gray-900 text-white overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-miami-teal/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              {t('land.badge')}
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              {t('land.hero_title_1')}{' '}
              <span className="text-brand-400">{t('land.hero_title_2')}</span>{' '}
              {t('land.hero_title_3')}
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl leading-relaxed">
              {t('land.hero_sub')}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary px-8 py-4 text-base">
                {t('land.cta_worker')} &rarr;
              </Link>
              <Link to="/register?type=business"
                className="px-8 py-4 text-base font-semibold rounded-lg border border-white/30 text-white hover:bg-white/10 transition-colors">
                {t('land.cta_business')}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Stars />
                <span>4.9 &middot; 500+ workers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-miami-teal">&#10003;</span>
                <span>Miami Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-brand-400">&#9889;</span>
                <span>{t('land.instant_pay_badge')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone pills */}
        <div className="relative pb-8 overflow-hidden">
          <div className="flex gap-2 px-4 overflow-x-auto pb-2
            [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            {zones.map(z => (
              <span key={z} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-sm">
                &#128205; {z}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-brand-500 text-white py-6">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { v: '500+', l: t('land.stat1') },
            { v: '120+', l: t('land.stat2') },
            { v: '$2M+', l: t('land.stat3') },
            { v: '4.9 ⭐', l: t('land.stat4') },
          ].map(s => (
            <div key={s.l}>
              <p className="text-2xl sm:text-3xl font-extrabold">{s.v}</p>
              <p className="text-brand-100 text-sm mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOR WORKERS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-500 font-semibold text-sm uppercase tracking-wide mb-3">
                {t('land.for_workers')}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                {t('land.worker_title')}
              </h2>
              <p className="text-gray-500 mt-4 text-lg leading-relaxed">
                {t('land.worker_desc')}
              </p>
              <ul className="mt-6 space-y-3">
                {['land.wl1','land.wl2','land.wl3','land.wl4'].map(k => (
                  <li key={k} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">&#10003;</span>
                    <span className="text-gray-700">{t(k)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="inline-block mt-8 btn-primary px-8 py-3">
                {t('land.cta_worker')} &rarr;
              </Link>
            </div>

            {/* Mock worker card */}
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-50 to-orange-50 rounded-3xl p-6 space-y-4">
                <div className="card flex items-center gap-4 shadow-sm">
                  <div className="w-14 h-14 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-xl">C</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">Carlos M.</p>
                      <span className="badge bg-miami-teal/10 text-miami-teal text-xs">&#10003; Verified</span>
                      <span className="badge bg-amber-100 text-amber-700 text-xs">&#11088; Top</span>
                    </div>
                    <Stars />
                    <p className="text-xs text-gray-500 mt-0.5">Server &middot; Bartender &middot; 5 yrs exp.</p>
                  </div>
                </div>
                <div className="card border-l-4 border-brand-500 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Upcoming shift</p>
                  <p className="font-semibold text-gray-900">Ocean Drive Bistro</p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-500">Sat Jun 15 &middot; 10:00&ndash;16:00</span>
                    <span className="font-bold text-miami-teal">$108</span>
                  </div>
                </div>
                <div className="card shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">This month</p>
                    <span className="badge bg-green-100 text-green-700">+18%</span>
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">$1,240</p>
                  <div className="mt-3 flex gap-1 h-8 items-end">
                    {[40,65,50,80,60,90,75].map((h, i) => (
                      <div key={i} className="flex-1 bg-brand-500 rounded-t opacity-80"
                        style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2 border border-gray-100">
                <span className="text-2xl">&#9889;</span>
                <div>
                  <p className="text-xs text-gray-500">{t('land.instant_pay_badge')}</p>
                  <p className="font-bold text-gray-900 text-sm">$91.80</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR BUSINESSES */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Mock business dashboard */}
            <div className="order-2 lg:order-1 relative">
              <div className="bg-gradient-to-br from-miami-teal/5 to-teal-50 rounded-3xl p-6 space-y-4">
                <div className="card shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-gray-900">Ocean Drive Bistro</p>
                    <span className="badge bg-miami-teal/10 text-miami-teal">&#10003; Verified</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[{v:'3',l:'Active'},{v:'12',l:'Pending'},{v:'$4,200',l:'This month'}].map(s => (
                      <div key={s.l} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-lg font-bold text-gray-900">{s.v}</p>
                        <p className="text-xs text-gray-400">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card shadow-sm">
                  <p className="text-xs text-gray-400 mb-3">Candidates &middot; Saturday Brunch</p>
                  {[
                    { name:'Carlos M.', rating:4.9, verified:true, top:true },
                    { name:'Ana R.',    rating:4.7, verified:true, top:false },
                  ].map(w => (
                    <div key={w.name} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
                          {w.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium">{w.name}</p>
                            {w.verified && <span className="text-miami-teal text-xs">&#10003;</span>}
                            {w.top && <span className="text-xs">&#11088;</span>}
                          </div>
                          <Stars n={w.rating >= 4.8 ? 5 : 4} />
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 rounded-lg text-xs font-medium bg-brand-500 text-white">&#10003;</button>
                        <button className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">&#10005;</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-miami-teal font-semibold text-sm uppercase tracking-wide mb-3">
                {t('land.for_businesses')}
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                {t('land.business_title')}
              </h2>
              <p className="text-gray-500 mt-4 text-lg leading-relaxed">
                {t('land.business_desc')}
              </p>
              <ul className="mt-6 space-y-3">
                {['land.bl1','land.bl2','land.bl3','land.bl4'].map(k => (
                  <li key={k} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-miami-teal/10 text-miami-teal flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">&#10003;</span>
                    <span className="text-gray-700">{t(k)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register?type=business" className="inline-block mt-8 px-8 py-3 rounded-lg font-semibold bg-miami-teal text-white hover:bg-teal-600 transition-colors">
                {t('land.cta_business')} &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-brand-500 font-semibold text-sm uppercase tracking-wide mb-2">{t('land.how_label')}</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('land.how_title')}</h2>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-brand-200 to-transparent -translate-x-4 z-0" />
                )}
                <div className="relative z-10 card text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center text-3xl mx-auto mb-4">
                    {s.icon}
                  </div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shadow">
                    {s.n}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{t(s.titleKey)}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{t(s.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-12">{t('land.features_title')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card text-left hover:shadow-md transition-shadow">
                <span className="text-3xl">{f.icon}</span>
                <h3 className="mt-3 font-bold text-gray-900">{t(f.titleKey)}</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-12">{t('land.testimonials_title')}</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map((tm, i) => (
              <div key={i} className="card text-left hover:shadow-md transition-shadow">
                <Stars n={tm.rating} />
                <p className="mt-3 text-gray-700 text-sm leading-relaxed italic">
                  {tm.quote[lang] || tm.quote.en}
                </p>
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-xl ${tm.color} flex items-center justify-center font-bold`}>
                    {tm.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{tm.name}</p>
                    <p className="text-xs text-gray-400">{tm.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-brand-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{t('land.pricing_title')}</h2>
          <p className="text-gray-500 mt-3 text-lg">{t('land.pricing_sub')}</p>

          <div className="mt-10 grid sm:grid-cols-2 gap-6">
            {plans.map((p, i) => (
              <div key={i} className={`card relative border-2 ${p.color} text-left`}>
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-brand-500 text-white text-xs font-bold shadow">
                    {t(p.badge)}
                  </span>
                )}
                <h3 className="font-extrabold text-xl text-gray-900">{t(p.nameKey)}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-4xl font-extrabold text-gray-900">{p.price === '0' ? t('land.free') : `${p.price}%`}</span>
                  {p.period && <span className="text-gray-500 ml-1 text-sm">{t(p.period)}</span>}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {p.features.map(fk => (
                    <li key={fk} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-brand-500 mt-0.5 flex-shrink-0">&#10003;</span>
                      {t(fk)}
                    </li>
                  ))}
                </ul>
                <Link to={p.ctaLink} className={p.ctaStyle}>
                  {t(p.cta)}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold">{t('land.final_title')}</h2>
          <p className="mt-4 text-brand-100 text-lg">{t('land.final_sub')}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 rounded-xl bg-white text-brand-600 font-bold hover:bg-brand-50 transition-colors">
              {t('land.cta_worker')} &#128640;
            </Link>
            <Link to="/register?type=business" className="px-8 py-4 rounded-xl border-2 border-white/50 text-white font-bold hover:bg-white/10 transition-colors">
              {t('land.cta_business')}
            </Link>
          </div>
          <p className="mt-6 text-brand-200 text-sm">{t('land.final_note')}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-gray-600">&copy; 2026</span>
          </div>
          <div className="flex gap-6">
            <Link to="/shifts" className="hover:text-white transition-colors">{t('nav.shifts')}</Link>
            <Link to="/register" className="hover:text-white transition-colors">{t('nav.register')}</Link>
            <Link to="/login" className="hover:text-white transition-colors">{t('nav.login')}</Link>
          </div>
          <p>Made with &#10084; for Miami's hospitality community</p>
        </div>
      </footer>
    </div>
  );
}
