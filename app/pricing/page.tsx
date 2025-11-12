'use client';
import Link from 'next/link';

export default function PricingPage() {
  const plans = [
    {
      name: 'Free', price: '$0', period: 'forever',
      features: ['50 expenses per month', 'Basic dashboard', '5 categories'],
      cta: 'Get Started Free', ctaLink: '/auth/signup', popular: false
    },
    {
      name: 'Premium', price: '$9.99', period: 'per month', yearlyPrice: '$79.99',
      features: ['Unlimited expenses', 'Budget tracking', 'Receipt attachments', 'Export CSV/PDF'],
      cta: 'Start 14-Day Trial', ctaLink: '/checkout?plan=premium&interval=month', popular: true
    },
    {
      name: 'Pro', price: '$19.99', period: 'per month', yearlyPrice: '$159.99',
      features: ['Everything in Premium', 'Advanced reports', 'Family sharing', 'API access'],
      cta: 'Start 14-Day Trial', ctaLink: '/checkout?plan=pro&interval=month', popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16 px-4">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-xl text-center text-gray-600 mb-16">Start free, upgrade anytime</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-2xl shadow-lg p-8 ${plan.popular ? 'border-4 border-blue-600' : 'border border-gray-200'}`}>
              {plan.popular && <div className="text-blue-600 font-semibold mb-2">Most Popular</div>}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
                {plan.yearlyPrice && <p className="text-sm text-gray-600 mt-2">or {plan.yearlyPrice}/year (save 33%)</p>}
              </div>
              <Link href={plan.ctaLink} className={`block w-full text-center py-3 rounded-lg font-semibold ${plan.popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                {plan.cta}
              </Link>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
