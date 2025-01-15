import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/private/sidebar/AppSidebar';
import VerticalToolbar from '@/components/private/VerticalToolbar';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div className="relative flex-1 p-16">
                {children}
                <VerticalToolbar />
            </div>
        </SidebarProvider>
    );
}
