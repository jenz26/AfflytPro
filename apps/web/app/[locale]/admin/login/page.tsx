'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { API_BASE } from '@/lib/api/config';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Errore');
        return;
      }

      setSent(true);

    } catch (err) {
      setError('Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-white text-xl font-mono tracking-wider">AFFLYT ADMIN</h1>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border border-zinc-700 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <p className="text-zinc-400 font-mono text-sm">
              Link inviato a {email}
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-zinc-600 font-mono text-xs hover:text-zinc-400"
            >
              Riprova
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              autoFocus
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 font-mono text-sm focus:outline-none focus:border-zinc-600"
            />

            {error && (
              <p className="text-red-500 text-sm font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black font-mono text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  INVIO...
                </>
              ) : (
                'INVIA MAGIC LINK'
              )}
            </button>
          </form>
        )}

        <p className="text-zinc-700 text-xs font-mono text-center mt-8">
          Accesso riservato
        </p>
      </div>
    </div>
  );
}
