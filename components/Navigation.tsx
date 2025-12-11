import Link from 'next/link';

type Variant = 'expenses' | 'sitesense';

export default function Navigation({ variant = 'sitesense' }: { variant?: Variant }) {
  const isExpense = variant === 'expenses';

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-100 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-700 flex items-center justify-center text-slate-50 text-sm font-bold border border-slate-600">
            {isExpense ? 'EM' : 'SS'}
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              {isExpense ? 'Expenses Made Easy' : 'SiteSense'}
            </span>
            <span className="text-[11px] text-slate-300">
              {isExpense ? 'Expenses · Budgets · Receipts' : 'Jobs · Time · Costs'}
            </span>
          </div>
        </div>

        {/* Main nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {isExpense ? (
            <>
              <Link href="/expenses/dashboard" className="text-slate-200 hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link href="/expenses" className="text-slate-200 hover:text-blue-400 transition-colors">
                Expenses
              </Link>
              <Link href="/budgets" className="text-slate-200 hover:text-blue-400 transition-colors">
                Budgets
              </Link>
              <Link href="/receipts" className="text-slate-200 hover:text-blue-400 transition-colors">
                Receipts
              </Link>
              <Link href="/mileage" className="text-slate-200 hover:text-blue-400 transition-colors">
                Mileage
              </Link>
              <Link href="/profile" className="text-slate-200 hover:text-blue-400 transition-colors">
                Profile
              </Link>
              <Link href="/settings" className="text-slate-200 hover:text-blue-400 transition-colors">
                Settings
              </Link>
            </>
          ) : (
            <>
              <Link href="/expense-dashboard" className="text-slate-200 hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <Link href="/jobs" className="text-slate-200 hover:text-blue-400 transition-colors">
                Jobs
              </Link>
              <Link href="/estimates" className="text-slate-200 hover:text-blue-400 transition-colors">
                Estimates
              </Link>
              <Link href="/expenses" className="text-slate-200 hover:text-blue-400 transition-colors">
                Expenses
              </Link>
              <Link href="/time-tracking" className="text-slate-200 hover:text-blue-400 transition-colors">
                Time
              </Link>
              <Link href="/settings" className="text-slate-200 hover:text-blue-400 transition-colors">
                Settings
              </Link>
            </>
          )}
        </div>

        {/* Right side: placeholder for user stuff */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-slate-300">
            {isExpense ? 'Track smarter. Save more.' : 'Built for contractors'}
          </span>
          <div className="h-8 w-8 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center text-[10px] font-semibold text-slate-200">
            ME
          </div>
        </div>
      </div>
    </nav>
  );
}
