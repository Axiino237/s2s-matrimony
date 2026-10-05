import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../../store/settings.store';

const FacebookIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YoutubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
  </svg>
);

const Footer = () => {
  const year = new Date().getFullYear();
  const logoUrl = useSettingsStore((s) => s.logoUrl);
  const { facebookUrl, instagramUrl, twitterUrl, youtubeUrl, fetchSettings, contact } = useSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const socialChannels = [
    {
      name: 'Facebook',
      url: facebookUrl || 'https://www.facebook.com/s2smatrimony',
      icon: <FacebookIcon className="w-4 h-4 fill-current" />,
      hoverClass: 'hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/40',
    },
    {
      name: 'Instagram',
      url: instagramUrl || 'https://www.instagram.com/s2smatrimony',
      icon: <InstagramIcon className="w-4 h-4 fill-current" />,
      hoverClass: 'hover:bg-[#E4405F]/10 hover:text-[#E4405F] hover:border-[#E4405F]/40',
    },
    {
      name: 'X (Twitter)',
      url: twitterUrl || 'https://x.com/s2smatrimony',
      icon: <XIcon className="w-3.5 h-3.5 fill-current" />,
      hoverClass: 'hover:bg-slate-900/10 hover:text-slate-900 hover:border-slate-900/40',
    },
    {
      name: 'YouTube',
      url: youtubeUrl || 'https://www.youtube.com/@s2smatrimony',
      icon: <YoutubeIcon className="w-4 h-4 fill-current" />,
      hoverClass: 'hover:bg-[#FF0000]/10 hover:text-[#FF0000] hover:border-[#FF0000]/40',
    },
  ];

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
              {socialChannels.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  title={s.name}
                  className={`w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-text-secondary transition-all duration-200 border border-slate-200/50 shadow-sm ${s.hoverClass}`}
                >
                  {s.icon}
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
              <li className="text-sm text-text-secondary">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-primary transition-colors group cursor-pointer"
                  title="View on Google Maps"
                >
                  <span className="mt-0.5 group-hover:scale-110 transition-transform">📍</span>
                  <span className="whitespace-pre-line leading-relaxed">{contact.fullAddress}</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <span>📞</span>
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                  className="hover:text-primary transition-colors"
                >
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-text-secondary">
                <span>✉️</span>
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {contact.email}
                </a>
              </li>
              <li className="text-sm text-text-secondary">
                <span>🕐</span> {contact.officeHours}
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
