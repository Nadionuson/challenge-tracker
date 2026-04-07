'use server'

import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'
import { SessionData, sessionOptions } from '@/lib/session'

export async function loginAction(formData: FormData) {
  const password = formData.get('password') as string

  if (password !== process.env.APP_PASSWORD) {
    // Redirect back to login with error in query string
    redirect('/login?error=Incorrect+password.')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getIronSession<SessionData>(await cookies() as any, sessionOptions)
  session.authenticated = true
  await session.save()

  redirect('/')
}
