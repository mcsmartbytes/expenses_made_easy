'use client';
import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <button onClick={() => setShowPrompt(false)} className="absolute top-2 right-2 text-white">✕</button>
      <h3 className="font-bold mb-2">Install App</h3>
      <p className="text-sm mb-3">Get quick access from your home screen!</p>
      <button className="bg-white text-blue-600 px-4 py-2 rounded font-semibold text-sm">
        Install
      </button>
    </div>
  );
}
