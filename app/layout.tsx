// app/layout.tsx
import { ReactNode } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
// import Chatbot from '@/components/Chatbot';
import Chatbot from '@/components/Chatbot';
import { ToastProvider } from '@/components/Toast';




const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'KLH Peer Learning Network',
  description: 'Campus-only educational video platform',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/* Cloudinary Upload Widget */}
        <script 
          src="https://upload-widget.cloudinary.com/global/all.js" 
          type="text/javascript"
        />
      </head>
      <body className={inter.className}>
  <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <div className="animate-fade-in">
          {children}
        </div>
        <Chatbot />
      </AuthProvider>
    </ToastProvider>
  </ThemeProvider>
</body>



    </html>
  )
}
