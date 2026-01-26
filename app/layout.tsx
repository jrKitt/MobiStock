import type { Metadata } from 'next'
import { Prompt } from 'next/font/google'
import './globals.css'

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
        <html lang="th">
            <body className={`${prompt.className} antialiased`}>
                {children}
            </body>
        </html>
    )
}
