import { Link } from 'react-router-dom';

const plans = [
  { n: 'Free', p: '₹0', period: '', f: ['5 Interests/day', 'Basic Search', '5 Contact Views'], pop: false },
  { n: 'Silver', p: '₹599', period: '/month', f: ['50 Interests/day', 'Advanced Search', '50 Contacts', 'Chat Access'], pop: false },
  { n: 'Elite', p: '₹999', period: '/3 months', f: ['Unlimited Interests', 'All Features', '100 Contacts', 'Priority Listing', 'AI Match'], pop: true },
  { n: 'Platinum', p: '₹1,799', period: '/6 months', f: ['Everything+', 'Unlimited Contacts', 'Video Profile', 'Dedicated Manager'], pop: false },
];

const PremiumPage = () => (
  <div className="animate-fade-in">
    <div className="text-center mb-10">
      <h1 className="font-display text-3xl font-bold text-white mb-2">
        Upgrade to <span className="text-gradient-gold">Premium</span>
      </h1>
      <p className="text-text-secondary">Get unlimited access and find your match faster</p>
    </div>
    <div className="flex flex-wrap justify-center items-stretch gap-6 max-w-6xl mx-auto">
      {plans.map((plan, i) => (
        <div key={i} className={`plan-card w-full sm:w-[270px] lg:w-[290px] max-w-[320px] flex-1 ${plan.pop ? 'plan-card-popular border-2 border-primary shadow-xl scale-[1.02] z-10' : ''}`}>
          {plan.pop && (
            <div className="absolute top-0 inset-x-0 flex justify-center">
              <span className="bg-gradient-primary text-white text-xs font-bold px-4 py-1 rounded-b-xl">Popular</span>
            </div>
          )}
          <div className={plan.pop ? 'pt-6' : ''}>
            <h3 className="text-white font-bold text-lg mb-1">{plan.n}</h3>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-2xl font-bold text-gradient">{plan.p}</span>
              {plan.period && <span className="text-text-muted text-xs mb-1">{plan.period}</span>}
            </div>
            <ul className="space-y-2 mb-5">
              {plan.f.map((f, j) => (
                <li key={j} className="text-sm text-text-secondary flex gap-2">
                  <span className="text-success">✓</span>{f}
                </li>
              ))}
            </ul>
            <button className={`btn w-full ${plan.pop ? 'btn-primary' : 'btn-secondary'}`}>
              Choose {plan.n}
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PremiumPage;
