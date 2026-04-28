// app/api/esp32/rfid/route.js
import { NextResponse } from 'next/server';
import { localDB } from '@/lib/localDB';
import { appendToSheet } from '@/lib/sheets';

// POST /api/esp32/rfid
// Called by ESP32 when an RFID card is scanned.
// Body: { rfid_uid, action, hardware_id, amount? }
//   rfid_uid   – hex UID from card e.g. "83F4EE28"
//   action     – "gate" | "attendance" | "canteen"  (default "gate")
//   hardware_id– e.g. "main_gate"
//
// Registered cards:
//   Piyush Bedekar  → "83 F4 EE 28"  (stored with spaces in users.json)
//   Shravani Naik   → "23 AE D7 13"
export async function POST(req) {
    try {
        const body = await req.json();
        const { hardware_id, rfid_uid, action } = body;

        // action can be "attendance" or "canteen" or "gate"
        const mode = action || 'gate';

        if (!rfid_uid) {
            return NextResponse.json({ error: 'Missing RFID UID' }, { status: 400 });
        }

        // Normalize incoming UID: strip spaces, uppercase  → "83F4EE28"
        const normalizedUID = rfid_uid.replace(/\s/g, '').toUpperCase();
        console.log(`[RFID] Received UID: ${normalizedUID} | mode: ${mode}`);

        // 1. Find user by RFID UID (compare both sides normalized)
        const users = localDB.getStudents();
        let student = null;

        if (normalizedUID === 'AUTO_EXIT_IR') {
            student = { id: 'anonymous', name: 'Auto Exit (IR Sensor)', wallet_balance: 0 };
        } else if (body.student_id) {
            student = users.find(u => u.id === body.student_id);
        } else {
            student = users.find(u =>
                u.rfid_uid &&
                u.rfid_uid.replace(/\s/g, '').toUpperCase() === normalizedUID
            );
        }

        if (!student) {
            console.log(`[RFID] Unknown card: ${normalizedUID}`);
            return NextResponse.json({
                success: false,
                message: 'UNKNOWN CARD',
                lcd_line1: 'UNKNOWN CARD',
                lcd_line2: 'Not Registered',
                status_code: 404
            });
        }

        console.log(`[RFID] Matched student: ${student.name} (${student.id})`);
        const now = new Date().toISOString();

        // ── 2. Gate / Attendance ─────────────────────────────────────
        if (mode === 'gate' || mode === 'attendance') {
            const entry = {
                id: `ent_esp_${Date.now()}`,
                student_id: student.id,
                name: student.name,
                gate: hardware_id || 'Main Campus Gate',
                method: 'RFID',
                status: 'granted',
                time: now
            };

            localDB.addEntry(entry);

            // Sync to Google Sheets (best-effort)
            try {
                await appendToSheet([
                    entry.id, entry.student_id, entry.name,
                    'Campus Entry', now.split('T')[0],
                    entry.status, entry.method, entry.time
                ]);
            } catch (e) { /* non-fatal */ }

            // WhatsApp notification (best-effort)
            try {
                if (student.phone) {
                    const { sendWhatsAppMessage, buildGateEntryMessage } = await import('@/lib/whatsapp');
                    const msg = buildGateEntryMessage(
                        student.name,
                        hardware_id || 'Main Campus Gate',
                        new Date().toLocaleTimeString('en-IN'),
                        'RFID'
                    );
                    await sendWhatsAppMessage(student.phone, msg);
                }
            } catch (e) { /* non-fatal */ }

            return NextResponse.json({
                success: true,
                message: `ACCESS GRANTED: ${student.name.split(' ')[0]}`,
                lcd_line1: 'ACCESS GRANTED',
                lcd_line2: student.name.substring(0, 16)
            });
        }

        // ── 3. Canteen Payment ───────────────────────────────────────
        if (mode === 'canteen') {
            const amount = parseFloat(body.amount || 0);

            if (student.wallet_balance < amount) {
                return NextResponse.json({
                    success: false,
                    message: 'INSUFFICIENT FUNDS',
                    lcd_line1: 'TXN FAILED',
                    lcd_line2: 'Low Balance'
                });
            }

            const newBalance = student.wallet_balance - amount;
            localDB.updateUser(student.id, { wallet_balance: newBalance });

            try {
                await appendToSheet([
                    `txn_${Date.now()}`,
                    student.id,
                    student.name,
                    `Payment: Rs.${amount}`,
                    now.split('T')[0],
                    'SUCCESS',
                    'RFID',
                    now
                ]);
            } catch (e) { /* non-fatal */ }

            return NextResponse.json({
                success: true,
                message: `PAID Rs.${amount} | Bal Rs.${newBalance}`,
                lcd_line1: `PAID Rs.${amount}`,
                lcd_line2: `BAL Rs.${newBalance}`
            });
        }

        return NextResponse.json({ success: false, message: 'Invalid action mode' });

    } catch (err) {
        console.error('[RFID] Error:', err);
        return NextResponse.json({ error: 'Internal Hardware Server Error' }, { status: 500 });
    }
}
