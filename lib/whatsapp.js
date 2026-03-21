// lib/whatsapp.js
export async function sendWhatsAppMessage(to, message) {
    if (!to) return { success: false, error: 'No phone number provided' };

    try {
        // Forward the request to our local whatsapp-server.js microservice running on port 3001
        const response = await fetch('http://localhost:3001/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: to, message }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to send WhatsApp message via local service');
        }

        console.log(`[Next.js] Successfully queued WhatsApp message to ${to}`);
        return { success: true };
    } catch (error) {
        console.error('[Next.js] WhatsApp Service Error:', error.message);
        console.warn('NOTE: Ensure you are running `npm run whatsapp` in a separate terminal and have scanned the QR code with your 7208416569 number.');
        return { success: false, error: error.message };
    }
}

export function buildAttendanceMessage(studentName, subject, time, status) {
    return `🎓 *PSR Campus System*\n\nHello *${studentName}*,\n\nYour attendance has been recorded.\n\n📚 *Subject:* ${subject}\n📅 *Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}\n🕐 *Time:* ${time}\n✅ *Status:* ${status}\n\n_PSR Campus Entry & Attendance System_`;
}

export function buildMonthlyReport(studentName, month, total, present, absent) {
    const percentage = Math.round((present / total) * 100);
    return `📊 *Monthly Attendance Report*\n\n👤 *Student:* ${studentName}\n📅 *Month:* ${month}\n\n📋 Total Lectures: ${total}\n✅ Present: ${present}\n❌ Absent: ${absent}\n📈 Attendance: *${percentage}%*\n\n${percentage < 75 ? '⚠️ *Low attendance warning! Please improve.*' : '🌟 Great attendance this month!'}\n\n_PSR Campus System_`;
}
