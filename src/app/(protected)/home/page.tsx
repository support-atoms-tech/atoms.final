import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabaseServer'
import HomeDashboard from './components/HomeDashboard.client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <HomeDashboard userId={user.id} />
}
