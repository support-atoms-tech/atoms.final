import { signOut } from '@/app/(auth)/actions'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  await signOut()
  return new Response(null, { status: 200 })
} 