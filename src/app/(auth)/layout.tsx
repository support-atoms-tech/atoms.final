import PublicHeader from '@/components/public/PublicHeader';

export default function AuthLayout({
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
