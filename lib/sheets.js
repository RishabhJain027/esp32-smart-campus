import { google } from 'googleapis';

/**
 * Google Sheets API Integration.
 * Note: Requires GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID in your .env.local
 */

let auth;
let sheets;

try {
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        sheets = google.sheets({ version: 'v4', auth });
    }
} catch (error) {
    console.warn('Google Sheets Auth Error:', error.message);
}

export async function appendToSheet(data) {
    if (!sheets || !process.env.GOOGLE_SHEET_ID) {
        console.warn('Google Sheets is not configured. (Missing Env Vars). Mocking successful append:', data);
        return { success: true, mocked: true };
    }

    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        // Default range, assumes Sheet1 is named 'Sheet1' and we append to columns A-E
        const range = 'Sheet1!A:E';

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [data],
            },
        });

        return { success: true, data: response.data };
    } catch (error) {
        console.error('Error appending to Google Sheet:', error);
        return { success: false, error: error.message };
    }
}
