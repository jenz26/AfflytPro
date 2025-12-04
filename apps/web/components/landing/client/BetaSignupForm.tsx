'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Rocket } from 'lucide-react';

const subscriberOptions = [
  { value: '', label: 'Quanti iscritti hai? (opzionale)' },
  { value: 'under_1k', label: 'Meno di 1.000' },
  { value: '1k_5k', label: '1.000 - 5.000' },
  { value: '5k_20k', label: '5.000 - 20.000' },
  { value: 'over_20k', label: 'Più di 20.000' },
];

interface BetaSignupFormProps {
  spotsRemaining?: number;
}

export function BetaSignupForm({ spotsRemaining = 7 }: BetaSignupFormProps) {
  const [email, setEmail] = useState('');
  const [telegramChannel, setTelegramChannel] = useState('');
  const [subscriberCount, setSubscriberCount] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!email || !email.includes('@')) {
      setStatus('error');
      setErrorMessage('Inserisci un indirizzo email valido');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          telegramChannel: telegramChannel || undefined,
          subscriberCount: subscriberCount || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.message || 'Si è verificato un errore. Riprova.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Errore di connessione. Riprova.');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Perfetto!</h3>
        <p className="text-gray-400">
          Ti contatteremo presto per attivare il tuo accesso.
        </p>
      </motion.div>
    );
  }

  const inputClasses = `
    w-full px-4 py-3 rounded-xl
    bg-afflyt-dark-900/50
    border border-white/10
    text-white placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-afflyt-cyan-500/50 focus:border-afflyt-cyan-500/50
    transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email - required */}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="La tua email *"
          disabled={status === 'loading'}
          required
          className={inputClasses}
        />
      </div>

      {/* Telegram Channel - optional */}
      <div>
        <input
          type="text"
          value={telegramChannel}
          onChange={(e) => setTelegramChannel(e.target.value)}
          placeholder="t.me/tuocanale (opzionale)"
          disabled={status === 'loading'}
          className={inputClasses}
        />
      </div>

      {/* Subscriber Count - optional dropdown */}
      <div>
        <select
          value={subscriberCount}
          onChange={(e) => setSubscriberCount(e.target.value)}
          disabled={status === 'loading'}
          className={`${inputClasses} appearance-none cursor-pointer`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            backgroundSize: '1.25rem',
          }}
        >
          {subscriberOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
              style={{ backgroundColor: '#0a0a0f', color: '#ffffff' }}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-400 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          {errorMessage}
        </motion.div>
      )}

      {/* Submit button */}
      <motion.button
        type="submit"
        disabled={status === 'loading'}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl bg-afflyt-cyan-500 hover:bg-afflyt-cyan-400 text-black font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Rocket className="w-5 h-5" />
            Richiedi Accesso — {spotsRemaining} posti rimasti
          </>
        )}
      </motion.button>

      {/* Note */}
      <p className="text-center text-gray-500 text-xs">
        In cambio chiediamo solo feedback onesto per migliorare la piattaforma.
      </p>
    </form>
  );
}
