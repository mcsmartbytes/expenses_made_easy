'use client';

import { useRouter } from 'next/navigation';
import { useMileageTracking } from '@/contexts/MileageTrackingContext';

export default function MileageTrackingIndicator() {
  const { isTracking, distance, currentSpeed, idleTime, stopTracking } = useMileageTracking();
  const router = useRouter();

  if (!isTracking) return null;

  const formatIdleTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 bg-white border border-green-300 shadow-lg rounded-full px-4 py-2 flex items-center gap-3 cursor-pointer"
      onClick={() => router.push('/mileage')}
    >
      {/* Pulsing green dot */}
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>

      <span className="text-sm font-semibold text-gray-900">{distance.toFixed(2)} mi</span>
      <span className="text-xs text-gray-500">{currentSpeed.toFixed(0)} mph</span>

      {idleTime > 60 && (
        <span className="text-xs text-amber-600">idle {formatIdleTime(idleTime)}</span>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); stopTracking(false); }}
        className="ml-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full hover:bg-red-200"
      >
        Stop
      </button>
    </div>
  );
}
