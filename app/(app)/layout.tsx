import LayoutMain from '@/components/Layouts/LayoutMain'

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return <LayoutMain>{children}</LayoutMain>
}
