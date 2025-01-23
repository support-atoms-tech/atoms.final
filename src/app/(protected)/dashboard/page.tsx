// app/(protected)/dashboard/page.tsx
'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/supabaseServer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <p>Hello {user.email}</p>
}