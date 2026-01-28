import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const prompt = Prompt({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['latin', 'thai'],
    variable: '--font-prompt',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'MobiStock',
    description: 'MobiStock',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="th" className="light">
            <body className={`${prompt.className} antialiased`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
