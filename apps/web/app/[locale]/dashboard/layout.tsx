import { CommandBar } from '@/components/navigation/CommandBar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <CommandBar />
            <main className="pt-16 lg:pt-16">
                {children}
            </main>
        </>
    );
}
