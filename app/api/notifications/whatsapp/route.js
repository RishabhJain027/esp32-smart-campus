import { NextResponse } from 'next/server';
import { buildAttendanceMessage } from '@/lib/whatsapp';

export async function POST(req) {
    try {
        const body = await req.json();
        const { phone, studentName, subject, time, status } = body;

        if (!phone || !studentName) {
            return NextResponse.json({ error: 'Missing phone number or student name' }, { status: 400 });
        }

        const message = buildAttendanceMessage(studentName, subject, time, status || 'Present');

        // Logic to send message via Twilio SDK goes here.
        // For the purpose of this project demo, we will log it successfully without requiring real credits.
        console.log(`[WHATSAPP API MOCK] Sending to ${phone}:\n${message}`);

        return NextResponse.json({ success: true, message: 'WhatsApp notification queued successfully', preview: message });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
    }
}
