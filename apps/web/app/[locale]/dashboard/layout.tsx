import { CommandBar } from '@/components/navigation/CommandBar';
import { NotificationWrapper } from '@/components/notifications';
import { BetaSurveyProvider } from '@/components/feedback/BetaSurveyProvider';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <NotificationWrapper>
            <BetaSurveyProvider>
                <CommandBar />
                <main className="pt-16 lg:pt-16 px-4 md:px-6 lg:px-8 pb-8">
                    {children}
                </main>
            </BetaSurveyProvider>
        </NotificationWrapper>
    );
}
