import { Link } from 'react-router-dom';
import { useSettingsStore } from '../../store/settings.store';

const Footer = () => {
  const year = new Date().getFullYear();
  const logoUrl = useSettingsStore((s) => s.logoUrl);

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={logoUrl || "/images/logo.png"} alt="S2S Matrimony Logo" className="w-14 h-14 object-contain rounded-xl shadow-sm" />
              <span className="font-display font-bold text-xl text-text-primary">S2S <span className="text-primary">Matrimony</span></span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Connecting hearts within communities. Find your perfect life partner with trust and tradition.
            </p>
            <div className="flex gap-3">
              {['Facebook', 'Instagram', 'Twitter', 'YouTube'].map((s) => (
                <a key={s} href="#" aria-label={s}
                  className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-primary/10 hover:text-primary flex items-center justify-center text-text-secondary transition-all duration-200 border border-slate-200/50">
                  <span className="text-xs font-bold">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                ['Home', '/'],
                ['Success Stories', '/success-stories'],
                ['Membership Plans', '/membership'],
                ['Blog', '/blog'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-text-secondary hover:text-primary transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>


          {/* Company */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5">
              {[
                ['About Us', '/about'],
                ['Contact', '/contact'],
                ['Privacy Policy', '/privacy'],
                ['Terms of Service', '/terms'],
                ['FAQ', '/faq'],
                ['Sitemap', '/sitemap'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-text-secondary hover:text-primary transition-colors text-sm">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-text-primary font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="mt-0.5">📍</span>
                <span>No. 123, Anna Nagar,<br />Chennai - 600 040, Tamil Nadu</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <span>📞</span>
                <a href="tel:+914412345678" className="hover:text-primary transition-colors">+91 44 1234 5678</a>
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <span>✉️</span>
                <a href="mailto:support@s2smatrimony.com" className="hover:text-primary transition-colors">support@s2smatrimony.com</a>
              </li>
              <li className="text-sm text-text-secondary">
                <span>🕐</span> Mon–Sat: 9 AM – 6 PM
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm text-center md:text-left">
            © {year} S2S Matrimony. All rights reserved. Built with ❤️ for our community.
          </p>
          <div className="flex items-center gap-6">
            <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-5 opacity-50" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="text-text-muted text-xs">Secure Payments by Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
