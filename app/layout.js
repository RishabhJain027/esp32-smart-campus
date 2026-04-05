// app/layout.js
import './globals.css';

export const metadata = {
    title: 'SAKEC Autonomous Campus – AI-Powered IoT Command Center',
    description: 'Enterprise AIoT Smart Campus System with ESP32 edge nodes, real-time facial recognition, RFID access control, and a bioluminescent command center dashboard.',
    keywords: 'smart campus, IoT, ESP32, RFID, face recognition, attendance, SAKEC',
    openGraph: {
        title: 'SAKEC Autonomous Campus',
        description: 'Enterprise-grade AI + IoT campus management system',
        type: 'website',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&family=Poppins:wght@400;500;600;700;800&family=Sora:wght@400;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
