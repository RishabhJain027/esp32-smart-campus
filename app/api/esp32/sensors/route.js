// app/api/esp32/sensors/route.js
// Receives periodic sensor data from ESP32:
//   temperature, humidity (DHT11), ldr, pot, hardware_id
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SENSOR_LOG = path.join(process.cwd(), 'data', 'sensor_log.json');

function readLog() {
  try {
    if (!fs.existsSync(SENSOR_LOG)) return [];
    return JSON.parse(fs.readFileSync(SENSOR_LOG, 'utf8'));
  } catch {
    return [];
  }
}

function writeLog(data) {
  fs.writeFileSync(SENSOR_LOG, JSON.stringify(data, null, 2));
}

export async function POST(req) {
  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (apiKey !== process.env.ESP32_API_KEY && apiKey !== 'esp32_secret_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { temperature, humidity, ldr, pot, hardware_id } = body;

    if (temperature === undefined || humidity === undefined) {
      return NextResponse.json({ error: 'Missing sensor data' }, { status: 400 });
    }

    const entry = {
      id: `sensor_${Date.now()}`,
      hardware_id: hardware_id || 'main_gate',
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      ldr: parseInt(ldr ?? 0),
      pot: parseInt(pot ?? 0),
      timestamp: new Date().toISOString(),
    };

    // Keep last 500 readings
    const log = readLog();
    log.unshift(entry);
    if (log.length > 500) log.length = 500;
    writeLog(log);

    console.log('[SENSOR]', JSON.stringify(entry));

    return NextResponse.json({
      success: true,
      message: 'Sensor data recorded',
      entry,
    });
  } catch (err) {
    console.error('[SENSOR] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET – return latest readings (for dashboard)
export async function GET(req) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const log = readLog();
    return NextResponse.json({ success: true, data: log.slice(0, 50) });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
