import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* App title – You can rename this later */}
        <Link href="/expense-dashboard" className="text-lg font-bold text-gray-900">
          SiteSense
        </Link>

        <div className="flex gap-6 text-sm font-medium">
          <Link href="/expense-dashboard" className="text-gray-700 hover:text-blue-600">
            Dashboard
          </Link>

          <Link href="/jobs" className="text-gray-700 hover:text-blue-600">
            Jobs
          </Link>

          <Link href="/expenses" className="text-gray-700 hover:text-blue-600">
            Expenses
          </Link>

          <Link href="/time-tracking" className="text-gray-700 hover:text-blue-600">
            Time Tracking
          </Link>
        </div>
      </div>
    </nav>
  );
}

