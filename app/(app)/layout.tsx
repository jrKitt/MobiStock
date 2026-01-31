import LayoutMain from '@/components/Layouts/LayoutMain'
import { getSession } from '@/lib/auth'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getSession()

    // Optional: Redirect if no session, though middleware might handle this
    // if (!session) redirect('/auth/login')

    return <LayoutMain user={session}>{children}</LayoutMain>
}
