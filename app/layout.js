// app/layout.js
import './globals.css';

export const metadata = {
    title: 'PSR Campus – AI-Powered Entry & Attendance System',
    description: 'IoT, RFID, Face Recognition, Cloud & WhatsApp Attendance Monitoring for PSR Campus',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
