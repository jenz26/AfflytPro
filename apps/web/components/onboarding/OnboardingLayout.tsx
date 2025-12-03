'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, ChevronUp } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface OnboardingLayoutProps {
    children: ReactNode;
    leftSidebar: ReactNode;
    rightPreview: ReactNode;
    currentStep: number;
    totalSteps: number;
    onExit?: () => void;
}

export const OnboardingLayout = ({
    children,
    leftSidebar,
    rightPreview,
    currentStep,
    totalSteps,
    onExit
}: OnboardingLayoutProps) => {
    const t = useTranslations('onboarding.layout');
    const progressPercentage = Math.round((currentStep / totalSteps) * 100);
    const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

    return (
        <div className="min-h-screen bg-afflyt-dark-100 flex flex-col">
            {/* Fixed Header - Slim */}
            <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-afflyt-dark-50/95 backdrop-blur-sm border-b border-afflyt-glass-border z-50">
                <div className="h-full px-4 md:px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-afflyt-cyan-400 to-afflyt-cyan-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-sm font-bold text-white">Afflyt Pro</h1>
                            <p className="text-xs text-gray-500">{t('initialSetup')}</p>
                        </div>
                    </div>

                    {/* Progress Bar Horizontal - Hidden on very small screens */}
                    <div className="flex-1 max-w-xs md:max-w-md mx-4 md:mx-8">
                        <div className="hidden sm:flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{t('step', { current: currentStep, total: totalSteps })}</span>
                            <span className="text-xs font-mono text-afflyt-cyan-400">{progressPercentage}%</span>
                        </div>
                        <div className="h-1 md:h-1.5 bg-afflyt-dark-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-afflyt-cyan-500 to-afflyt-cyan-400"
                                initial={{ width: '0%' }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                        </div>
                    </div>

                    {/* Mobile: Bottom Sheet Toggle + Language + Exit */}
                    <div className="flex items-center gap-2">
                        {/* Language Switcher */}
                        <LanguageSwitcher />

                        <button
                            onClick={() => setIsBottomSheetOpen(!isBottomSheetOpen)}
                            className="lg:hidden text-xs text-afflyt-cyan-400 hover:text-afflyt-cyan-300 transition-colors px-2 py-1 border border-afflyt-cyan-500/30 rounded"
                        >
                            {currentStep}/{totalSteps}
                        </button>

                        {/* Exit Button */}
                        {onExit && (
                            <button
                                onClick={onExit}
                                className="text-xs md:text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                <span className="hidden sm:inline">{t('completeLater')}</span>
                                <span className="sm:hidden">{t('exit')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content - 3 Column Layout */}
            <div className="flex-1 pt-14 md:pt-16">
                <div className="h-full flex">
                    {/* Left Sidebar - 30% - Progress Tracker - Desktop Only */}
                    <aside className="hidden lg:block w-[30%] border-r border-afflyt-glass-border bg-afflyt-dark-50/50">
                        <div className="h-full overflow-y-auto p-6">
                            {leftSidebar}
                        </div>
                    </aside>

                    {/* Center Content - 40% on desktop, 100% on mobile */}
                    <main className="flex-1 lg:w-[40%] overflow-y-auto">
                        <div className="h-full flex items-center justify-center p-4 md:p-6">
                            <div className="w-full max-w-2xl">
                                {children}
                            </div>
                        </div>
                    </main>

                    {/* Right Sidebar - 30% - Preview - Desktop Only - Hidden when no preview */}
                    {rightPreview && (
                        <aside className="hidden xl:block w-[30%] border-l border-afflyt-glass-border bg-afflyt-dark-50/50">
                            <div className="h-full overflow-y-auto p-6">
                                {rightPreview}
                            </div>
                        </aside>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Sheet - Progress Tracker */}
            <AnimatePresence>
                {isBottomSheetOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsBottomSheetOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Bottom Sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            drag="y"
                            dragConstraints={{ top: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, info) => {
                                if (info.offset.y > 100) {
                                    setIsBottomSheetOpen(false);
                                }
                            }}
                            className="lg:hidden fixed bottom-0 left-0 right-0 bg-afflyt-dark-50 border-t border-afflyt-glass-border rounded-t-2xl z-50 max-h-[70vh] overflow-hidden"
                        >
                            {/* Drag Handle */}
                            <div className="sticky top-0 bg-afflyt-dark-50 p-4 border-b border-afflyt-glass-border">
                                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-white">{t('yourJourney')}</h3>
                                    <button
                                        onClick={() => setIsBottomSheetOpen(false)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <ChevronUp className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto p-4">
                                {leftSidebar}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
