import { useState } from "react";
import Icon from "@/components/ui/icon";
import { LOGO, SOCIALS } from "./constants";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-background/80 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="Пенная вечеринка в Новосибирске — логотип Пена-НСК" title="Пена-НСК — пенная вечеринка в Новосибирске" className="w-10 h-10 rounded-full object-cover" />
          <span className="font-display text-xl font-black tracking-tight text-white">
            ПЕНА-<span className="text-accent">НСК</span>
          </span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <a href="#services" className="text-white/60 hover:text-white transition-colors">Услуги</a>
          <a href="#about" className="text-white/60 hover:text-white transition-colors">О нас</a>
          <a href="#faq" className="text-white/60 hover:text-white transition-colors">FAQ</a>
          <a href="#contacts" className="text-white/60 hover:text-white transition-colors">Контакты</a>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all hover:scale-110"
              style={{ color: s.color }}
            >
              {s.icon}
            </a>
          ))}
        </div>
        <a
          href="tel:+79537755111"
          className="hidden md:flex px-5 py-2.5 bg-accent text-black font-semibold text-sm rounded-full hover:shadow-lg hover:shadow-accent/40 transition-all"
        >
          +7-953-775-51-11
        </a>
        <button
          className="md:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "X" : "Menu"} size={24} />
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex flex-col gap-4">
          <a href="#services" className="text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>Услуги</a>
          <a href="#about" className="text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>О нас</a>
          <a href="#faq" className="text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a href="#contacts" className="text-white/70 hover:text-white" onClick={() => setMenuOpen(false)}>Контакты</a>
          <a href="tel:+79537755111" className="text-accent font-bold">+7-953-775-51-11</a>
          <div className="flex items-center gap-3 pt-1">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 hover:border-white/30 transition-all"
                style={{ color: s.color }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;