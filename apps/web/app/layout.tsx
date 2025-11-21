import './globals.css';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk'
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains'
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it" className="dark">
      <body className={`
        ${spaceGrotesk.variable} 
        ${inter.variable} 
        ${jetbrainsMono.variable} 
        font-sans bg-afflyt-dark-100 text-white
      `}>
        {children}
      </body>
    </html>
  );
}
