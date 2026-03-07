import { LOGO, SOCIALS } from "./constants";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="Пена-НСК" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-display font-bold text-white">ПЕНА-<span className="text-accent">НСК</span></span>
        </div>
        <div className="text-white/40 text-sm text-center">
          © 2025 ИП Сухинина Т.С. · Пенные вечеринки в Новосибирске
        </div>
        <div className="flex items-center gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all hover:scale-110"
              style={{ color: s.color }}
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
