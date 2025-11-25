'use client';

import { motion } from 'framer-motion';
import { Send, Mail, MessageSquare, Zap, Info } from 'lucide-react';
import { ReactNode } from 'react';

interface ContextPreviewProps {
    context: 'welcome' | 'telegram' | 'email' | 'discord' | 'automation';
    data?: any;
}

export const ContextPreview = ({ context, data }: ContextPreviewProps) => {
    const renderPreview = () => {
        switch (context) {
            case 'welcome':
                return <WelcomePreview />;
            case 'telegram':
                return <TelegramPreview data={data} />;
            case 'email':
                return <EmailPreview data={data} />;
            case 'automation':
                return <AutomationPreview data={data} />;
            default:
                return <DefaultPreview />;
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Anteprima
            </h3>
            <motion.div
                key={context}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {renderPreview()}
            </motion.div>
        </div>
    );
};

const PreviewCard = ({ children }: { children: ReactNode }) => (
    <div className="bg-afflyt-dark-100 border border-afflyt-glass-border rounded-xl p-4">
        {children}
    </div>
);

const WelcomePreview = () => (
    <div className="space-y-4">
        <PreviewCard>
            <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-afflyt-cyan-500/20 flex items-center justify-center">
                    <Info className="w-5 h-5 text-afflyt-cyan-400" />
                </div>
                <div className="flex-1">
                    <h4 className="text-base font-semibold text-white mb-1">Perché queste domande?</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Le tue risposte ci aiutano a personalizzare l'esperienza, suggerire le automazioni migliori per te e configurare i filtri più adatti al tuo pubblico.
                    </p>
                </div>
            </div>
        </PreviewCard>

        <PreviewCard>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cosa otterrai</h4>
            <div className="space-y-2">
                <PreviewItem icon="✓" text="Automazione configurata in 5 minuti" />
                <PreviewItem icon="✓" text="Filtri personalizzati per la tua nicchia" />
                <PreviewItem icon="✓" text="Analytics e A/B testing integrati" />
                <PreviewItem icon="✓" text="Supporto prioritario per 30 giorni" />
            </div>
        </PreviewCard>
    </div>
);

const TelegramPreview = ({ data }: { data?: any }) => (
    <div className="space-y-4">
        <PreviewCard>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-afflyt-cyan-500 flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-white">Anteprima Telegram</h4>
            </div>

            <div className="bg-afflyt-dark-50 rounded-lg p-3 space-y-2">
                <div className="text-xs text-gray-400">Esempio di messaggio automatico:</div>
                <div className="bg-[#2B5278] text-white text-sm p-3 rounded-lg rounded-tl-none">
                    <div className="font-semibold mb-1">🔥 Hot Deal - 50% OFF</div>
                    <div className="text-xs opacity-90 mb-2">
                        Sconto incredibile su prodotto tech
                    </div>
                    <a href="#" className="text-xs text-afflyt-cyan-300 underline">
                        👉 Scopri l'offerta
                    </a>
                </div>
                <div className="text-xs text-gray-500 text-right">Ora · 👁 124</div>
            </div>
        </PreviewCard>

        <PreviewCard>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Tip</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
                Aggiungi il bot come admin del canale per permettergli di postare automaticamente. Non preoccuparti, puoi sempre rimuoverlo.
            </p>
        </PreviewCard>
    </div>
);

const EmailPreview = ({ data }: { data?: any }) => (
    <div className="space-y-4">
        <PreviewCard>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-afflyt-profit-500 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-white">Anteprima Email</h4>
            </div>

            <div className="bg-white text-gray-900 text-xs p-4 rounded-lg space-y-2">
                <div className="font-bold text-sm">Le migliori offerte della settimana 🎯</div>
                <div className="text-gray-600 text-xs leading-relaxed">
                    Ciao! Abbiamo selezionato per te 5 deal imperdibili...
                </div>
                <div className="border-t pt-2 mt-2">
                    <div className="bg-afflyt-cyan-500 text-white text-center py-2 rounded">
                        Scopri le offerte →
                    </div>
                </div>
            </div>
        </PreviewCard>

        <PreviewCard>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Best Practice</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
                Le email vengono inviate automaticamente quando troviamo deal che matchano i tuoi filtri. Puoi impostare una frequenza massima per non spammare.
            </p>
        </PreviewCard>
    </div>
);

const AutomationPreview = ({ data }: { data?: any }) => (
    <div className="space-y-4">
        <PreviewCard>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-afflyt-plasma-500 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                </div>
                <h4 className="text-sm font-semibold text-white">Come funziona</h4>
            </div>

            <div className="space-y-3">
                <FlowStep number={1} text="Monitoriamo migliaia di deal 24/7" />
                <FlowStep number={2} text="Filtriamo in base alle tue preferenze" />
                <FlowStep number={3} text="Pubblichiamo automaticamente sui tuoi canali" />
                <FlowStep number={4} text="Tracciamo click e conversioni" />
            </div>
        </PreviewCard>
    </div>
);

const DefaultPreview = () => (
    <PreviewCard>
        <p className="text-sm text-gray-400">Preview non disponibile per questo step</p>
    </PreviewCard>
);

const PreviewItem = ({ icon, text }: { icon: string; text: string }) => (
    <div className="flex items-center gap-2">
        <span className="text-afflyt-profit-400">{icon}</span>
        <span className="text-sm text-gray-300">{text}</span>
    </div>
);

const FlowStep = ({ number, text }: { number: number; text: string }) => (
    <div className="flex items-start gap-3">
        <div className="w-6 h-6 rounded-full bg-afflyt-cyan-500/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-afflyt-cyan-400">{number}</span>
        </div>
        <p className="text-xs text-gray-300 pt-0.5">{text}</p>
    </div>
);
