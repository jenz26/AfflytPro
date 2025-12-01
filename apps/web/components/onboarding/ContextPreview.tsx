'use client';

import { motion } from 'framer-motion';
import { Send, Mail, MessageSquare, Zap, Info, Rocket, Crown, Users, Target } from 'lucide-react';
import { ReactNode } from 'react';

type PersonaType = 'beginner' | 'creator' | 'power_user' | 'monetizer';

interface ContextPreviewProps {
    context: 'welcome' | 'telegram' | 'email' | 'discord' | 'automation';
    data?: any;
    personaType?: PersonaType | null;
}

export const ContextPreview = ({ context, data, personaType }: ContextPreviewProps) => {
    const renderPreview = () => {
        switch (context) {
            case 'welcome':
                return <WelcomePreview personaType={personaType} />;
            case 'telegram':
                return <TelegramPreview data={data} personaType={personaType} />;
            case 'email':
                return <EmailPreview data={data} personaType={personaType} />;
            case 'automation':
                return <AutomationPreview data={data} personaType={personaType} />;
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

const WelcomePreview = ({ personaType }: { personaType?: PersonaType | null }) => {
    // Personalized content based on persona
    const getPersonaContent = () => {
        switch (personaType) {
            case 'power_user':
                return {
                    icon: Crown,
                    iconColor: 'bg-amber-500/20',
                    iconTextColor: 'text-amber-400',
                    title: 'Modalità Esperto',
                    description: 'Configurazione veloce per chi già conosce il settore. Skip delle guide base, accesso diretto alle funzionalità avanzate.',
                    benefits: [
                        'Setup accelerato in 2 minuti',
                        'Importa le tue configurazioni esistenti',
                        'Filtri avanzati multi-parametro',
                        'API access per automazioni custom'
                    ]
                };
            case 'monetizer':
                return {
                    icon: Target,
                    iconColor: 'bg-afflyt-profit-500/20',
                    iconTextColor: 'text-afflyt-profit-400',
                    title: 'Focus Monetizzazione',
                    description: 'Hai già un\'audience, ora è il momento di monetizzarla. Ti mostreremo le strategie più efficaci.',
                    benefits: [
                        'Strategie di monetizzazione testate',
                        'Segmentazione avanzata audience',
                        'A/B testing per massimizzare CTR',
                        'Report ROI in tempo reale'
                    ]
                };
            case 'creator':
                return {
                    icon: Users,
                    iconColor: 'bg-afflyt-plasma-500/20',
                    iconTextColor: 'text-afflyt-plasma-400',
                    title: 'Crescita + Revenue',
                    description: 'Bilancia la crescita della tua audience con le opportunità di monetizzazione.',
                    benefits: [
                        'Template ottimizzati per engagement',
                        'Calendario editoriale automatico',
                        'Mix di contenuti value/promo',
                        'Analytics crescita audience'
                    ]
                };
            default: // beginner
                return {
                    icon: Rocket,
                    iconColor: 'bg-afflyt-cyan-500/20',
                    iconTextColor: 'text-afflyt-cyan-400',
                    title: 'Guida Step-by-Step',
                    description: 'Ti guideremo in ogni passaggio per configurare la tua prima automazione di successo.',
                    benefits: [
                        'Setup guidato in 5 minuti',
                        'Template pronti all\'uso',
                        'Filtri pre-configurati',
                        'Supporto prioritario 30 giorni'
                    ]
                };
        }
    };

    const content = getPersonaContent();
    const IconComponent = content.icon;

    return (
        <div className="space-y-4">
            <PreviewCard>
                <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg ${content.iconColor} flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${content.iconTextColor}`} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-base font-semibold text-white mb-1">{content.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {content.description}
                        </p>
                    </div>
                </div>
            </PreviewCard>

            <PreviewCard>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Il tuo percorso</h4>
                <div className="space-y-2">
                    {content.benefits.map((benefit, index) => (
                        <PreviewItem key={index} icon="✓" text={benefit} />
                    ))}
                </div>
            </PreviewCard>

            {personaType && (
                <PreviewCard>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 rounded-full bg-afflyt-cyan-500 animate-pulse" />
                        <span>Percorso personalizzato: <strong className="text-gray-400 capitalize">{personaType.replace('_', ' ')}</strong></span>
                    </div>
                </PreviewCard>
            )}
        </div>
    );
};

const TelegramPreview = ({ data, personaType }: { data?: any; personaType?: PersonaType | null }) => (
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

const EmailPreview = ({ data, personaType }: { data?: any; personaType?: PersonaType | null }) => (
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

const AutomationPreview = ({ data, personaType }: { data?: any; personaType?: PersonaType | null }) => (
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
