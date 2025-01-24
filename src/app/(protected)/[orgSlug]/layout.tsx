import { createClient } from '@/lib/supabase/supabaseServer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DashboardSidebar } from './components/DashboardSidebar.client';
import VerticalToolbar from '@/components/custom/VerticalToolbar';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    return (
        <SidebarProvider>
            <DashboardSidebar user={user} profile={profile} />
            <div className="relative flex-1 p-16">
                {children}
                <VerticalToolbar />
            </div>
        </SidebarProvider>
    );
}
