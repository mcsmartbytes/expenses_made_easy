import Link from 'next/link';

export default function Navigation({ variant = 'expenses' }: { variant?: string }) {
  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-100 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-slate-700 flex items-center justify-center text-slate-50 text-sm font-bold border border-slate-600">
            EM
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Expenses Made Easy
            </span>
            <span className="text-[11px] text-slate-300">
              Expenses · Budgets · Receipts
            </span>
          </div>
        </div>

        {/* Main nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/expenses/dashboard" className="text-slate-200 hover:text-blue-400 transition-colors">
            Dashboard
          </Link>
          <Link href="/expenses" className="text-slate-200 hover:text-blue-400 transition-colors">
            Expenses
          </Link>
          <Link href="/projects" className="text-slate-200 hover:text-blue-400 transition-colors">
            Projects
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
          <Link href="/reports" className="text-slate-200 hover:text-blue-400 transition-colors">
            Reports
          </Link>
          <Link href="/settings" className="text-slate-200 hover:text-blue-400 transition-colors">
            Settings
          </Link>
        </div>

        {/* Right side: placeholder for user stuff */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[11px] text-slate-300">
            Track smarter. Save more.
          </span>
          <div className="h-8 w-8 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center text-[10px] font-semibold text-slate-200">
            ME
          </div>
        </div>
      </div>
    </nav>
  );
}
