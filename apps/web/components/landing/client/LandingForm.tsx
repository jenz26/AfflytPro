'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { LandingButton } from './LandingButton';

interface LandingFormProps {
  onSubmit?: (email: string) => Promise<{ success: boolean; message?: string }>;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  className?: string;
}

// Default form handler for beta signup
const defaultFormSubmit = async (email: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const res = await fetch('/api/beta-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message };
  } catch {
    return { success: false, message: 'Errore di connessione. Riprova.' };
  }
};

export function LandingForm({
  onSubmit = defaultFormSubmit,
  placeholder = 'La tua email',
  buttonText = 'Richiedi Accesso',
  successMessage = 'Richiesta inviata! Ti contatteremo presto.',
  className = '',
}: LandingFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Inserisci un indirizzo email valido');
      return;
    }

    setStatus('loading');

    try {
      const result = await onSubmit(email);

      if (result.success) {
        setStatus('success');
        setMessage(result.message || successMessage);
        setEmail('');
      } else {
        setStatus('error');
        setMessage(result.message || 'Si e verificato un errore. Riprova.');
      }
    } catch {
      setStatus('error');
      setMessage('Errore di connessione. Riprova.');
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 ${className}`}
      >
        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <p className="text-emerald-300">{message}</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex gap-3 ${className}`}>
      <div className="relative flex-1">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder={placeholder}
          disabled={status === 'loading'}
          className={`
            w-full px-5 py-4 rounded-xl
            bg-white/5 backdrop-blur-sm
            border transition-colors duration-300
            text-white placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-afflyt-cyan-500/50
            ${status === 'error' ? 'border-red-500/50' : 'border-white/10 hover:border-white/20 focus:border-afflyt-cyan-500/50'}
            ${status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 left-0 flex items-center gap-1.5 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {message}
          </motion.div>
        )}
      </div>

      <LandingButton type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Invio...</span>
          </>
        ) : (
          <>
            <span>{buttonText}</span>
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </LandingButton>
    </form>
  );
}
