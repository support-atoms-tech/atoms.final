import PublicHeader from '@/components/public/PublicHeader';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <PublicHeader />
            {children}
        </div>
    );
}
