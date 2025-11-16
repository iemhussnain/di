/**
 * Home Page
 * Redirects to login page
 */

import { redirect } from 'next/navigation'

export default async function HomePage() {
  redirect('/login')
}
