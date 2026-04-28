/*
 * ===================================================================
 *  PSR Smart Campus – ESP32 Firmware  (Updated: 2026-04-28)
 * ===================================================================
 *  PIN MAP (matches physical wiring):
 *
 *  D2  → RELAY  (gate / door lock)
 *  D4  → BUZZER
 *  D5  → DHT11  (temperature & humidity)
 *  D12 → LED 1  (Green  – Access Granted)
 *  D13 → LED 2  (Red    – Access Denied)
 *  D14 → LED 3  (Yellow – Alert / Warning)
 *  D15 → RFID SS/CS  (HSPI)
 *  D18 → RFID SCK    (HSPI)
 *  D19 → RFID MISO   (HSPI)
 *  D21 → I2C SDA  (LCD 16×2)
 *  D22 → I2C SCL  (LCD 16×2)
 *  D23 → Switch / Digital Sensor
 *  D25 → Ultrasonic TRIG
 *  D26 → Ultrasonic ECHO
 *  D27 → RFID RST
 *  D33 → RFID MOSI   (HSPI)
 *  D34 → Potentiometer (Analog Input)
 *  D35 → LDR          (Analog Input)
 *
 *  RFID Cards registered:
 *    Piyush Bedekar  → 83F4EE28
 *    Shravani Naik   → 23AED713
 *
 *  Libraries required:
 *    MFRC522, ArduinoJson, LiquidCrystal_I2C,
 *    DHT sensor library (Adafruit)
 * ===================================================================
 */

#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <MFRC522.h>
#include <SPI.h>
#include <WiFi.h>
#include <Wire.h>

// ── WIFI CONFIG ────────────────────────────────────────────────────
const char *WIFI_SSID     = "One";
const char *WIFI_PASSWORD = "12345678";

// ── SERVER CONFIG ──────────────────────────────────────────────────
const char *SERVER_BASE = "https://psr-campus.onrender.com";
const char *API_KEY     = "esp32_secret_2026";

// ── PIN DEFINITIONS ────────────────────────────────────────────────
#define RELAY_PIN       2
#define BUZZER_PIN      4
#define DHT_PIN         5

#define LED_GREEN_PIN  12   // LED 1 – Access Granted
#define LED_RED_PIN    13   // LED 2 – Access Denied
#define LED_ALERT_PIN  14   // LED 3 – Alert / Warning

// RFID – HSPI (avoids conflict with D23 switch & D5 DHT)
#define RFID_SS_PIN    15
#define RFID_RST_PIN   27
#define RFID_SCK_PIN   18
#define RFID_MISO_PIN  19
#define RFID_MOSI_PIN  33

// I2C LCD
#define I2C_SDA_PIN    21
#define I2C_SCL_PIN    22

// Digital Sensor / Switch
#define SWITCH_PIN     23

// Ultrasonic HC-SR04
#define TRIG_PIN       25
#define ECHO_PIN       26

// Analog Inputs
#define POT_PIN        34   // Potentiometer
#define LDR_PIN        35   // LDR

// ── THRESHOLDS ─────────────────────────────────────────────────────
#define PERSON_DIST_CM       100
#define MULTI_PERSON_THRESH  2
#define BUZZER_DURATION_MS   3000
#define RELAY_OPEN_MS        3000
#define SCAN_COOLDOWN_MS     3000
#define SENSOR_REPORT_MS    30000   // Send env sensors every 30 s

// ── OBJECTS ────────────────────────────────────────────────────────
SPIClass hspi(HSPI);
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHT11);

// ── STATE ──────────────────────────────────────────────────────────
unsigned long lastScanTime     = 0;
unsigned long buzzerStartTime  = 0;
unsigned long relayOpenTime    = 0;
unsigned long lastSensorReport = 0;
bool buzzerActive  = false;
bool relayOpen     = false;

// ── FUNCTION PROTOTYPES ────────────────────────────────────────────
String   readRFID();
int      countPersons();
bool     sendRFID(String uid, String gate_id);
void     sendSensorData();
void     activateBuzzer(int durationMs = BUZZER_DURATION_MS);
void     openRelay(int durationMs = RELAY_OPEN_MS);
void     ledGrant();
void     ledDeny();
void     ledAlert();
void     lcdPrint(String l1, String l2 = "");
void     reconnectWiFi();

// ═══════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n[BOOT] PSR Smart Campus ESP32 starting...");

  // ── Output pins ──
  pinMode(RELAY_PIN,     OUTPUT);
  pinMode(BUZZER_PIN,    OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN,   OUTPUT);
  pinMode(LED_ALERT_PIN, OUTPUT);

  digitalWrite(RELAY_PIN,     LOW);
  digitalWrite(BUZZER_PIN,    LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN,   LOW);
  digitalWrite(LED_ALERT_PIN, LOW);

  // ── Input pins ──
  pinMode(SWITCH_PIN, INPUT_PULLUP);
  pinMode(TRIG_PIN,   OUTPUT);
  pinMode(ECHO_PIN,   INPUT);
  // D34, D35 are input-only, no pinMode needed

  // ── LCD ──
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcdPrint("PSR Campus", "Booting...");

  // ── DHT11 ──
  dht.begin();
  Serial.println("[DHT] DHT11 initialized on D5");

  // ── RFID via HSPI ──
  hspi.begin(RFID_SCK_PIN, RFID_MISO_PIN, RFID_MOSI_PIN, RFID_SS_PIN);
  rfid.PCD_Init(&hspi);
  rfid.PCD_DumpVersionToSerial();
  Serial.println("[RFID] MFRC522 initialized (HSPI)");

  // ── WiFi ──
  lcdPrint("Connecting WiFi", "...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (++attempts > 30) {
      Serial.println("\n[WiFi] Timeout – restarting");
      ESP.restart();
    }
  }
  String ip = WiFi.localIP().toString();
  Serial.printf("\n[WiFi] Connected! IP: %s\n", ip.c_str());
  lcdPrint("WiFi OK!", ip.c_str());
  delay(2000);

  // ── Startup LED test ──
  digitalWrite(LED_GREEN_PIN, HIGH); delay(300);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN,   HIGH); delay(300);
  digitalWrite(LED_RED_PIN,   LOW);
  digitalWrite(LED_ALERT_PIN, HIGH); delay(300);
  digitalWrite(LED_ALERT_PIN, LOW);

  lcdPrint("Scan RFID Card", "Ready...");
  Serial.println("[BOOT] Setup complete. Awaiting RFID...");
}

// ═══════════════════════════════════════════════════════════════════
void loop() {
  unsigned long now = millis();

  // ── Buzzer auto-off ──
  if (buzzerActive && (now - buzzerStartTime >= (unsigned long)BUZZER_DURATION_MS)) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerActive = false;
    Serial.println("[BUZZER] Off");
  }

  // ── Relay auto-close ──
  if (relayOpen && (now - relayOpenTime >= (unsigned long)RELAY_OPEN_MS)) {
    digitalWrite(RELAY_PIN, LOW);
    relayOpen = false;
    lcdPrint("Gate Closed", "Scan Card");
    Serial.println("[RELAY] Gate closed");
  }

  // ── WiFi watchdog ──
  if (WiFi.status() != WL_CONNECTED) {
    reconnectWiFi();
    return;
  }

  // ── Periodic env sensor report ──
  if (now - lastSensorReport >= SENSOR_REPORT_MS) {
    sendSensorData();
    lastSensorReport = now;
  }

  // ── Switch / Digital Sensor check ──
  if (digitalRead(SWITCH_PIN) == LOW) {
    Serial.println("[SWITCH] Pressed!");
    // Can be used for manual gate override or alarm reset
    if (buzzerActive) {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerActive = false;
      Serial.println("[SWITCH] Buzzer manually silenced");
    }
    delay(200); // debounce
  }

  // ── Scan cooldown ──
  if (now - lastScanTime < SCAN_COOLDOWN_MS) return;

  // ── RFID scan ──
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial())   return;

  String uid = readRFID();
  Serial.printf("[RFID] Card: %s\n", uid.c_str());
  lastScanTime = now;

  lcdPrint("Card: " + uid, "Checking...");

  // ── Person count via ultrasonic ──
  int persons = countPersons();
  Serial.printf("[ULTRA] Persons detected: %d\n", persons);

  if (persons >= MULTI_PERSON_THRESH) {
    lcdPrint("SECURITY ALERT!", "Multi-Person!");
    ledAlert();
    activateBuzzer();
    Serial.println("[SECURITY] Tailgate alert!");
  }

  // ── Send to server ──
  bool granted = sendRFID(uid, "main_gate");

  if (granted) {
    openRelay();
    ledGrant();
    Serial.println("[GATE] Access granted – relay opened");
  } else {
    ledDeny();
    Serial.println("[GATE] Access denied");
  }

  // ── Stop RFID ──
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
}

// ═══════════════════════════════════════════════════════════════════
//  Read RFID UID as uppercase hex string  e.g. "83F4EE28"
// ═══════════════════════════════════════════════════════════════════
String readRFID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// ═══════════════════════════════════════════════════════════════════
//  Ultrasonic HC-SR04 – returns approx person count
// ═══════════════════════════════════════════════════════════════════
int countPersons() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  float dist = (dur * 0.0343f) / 2.0f;
  Serial.printf("[ULTRA] Distance: %.1f cm\n", dist);

  if (dist > 0 && dist < PERSON_DIST_CM) {
    return (dist < 40) ? 2 : 1;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
//  POST RFID scan → /api/esp32/rfid
//  Sends: { rfid_uid, action, hardware_id }
//  Reads: { success, lcd_line1, lcd_line2 }
//  Piyush: 83F4EE28  |  Shravani: 23AED713
// ═══════════════════════════════════════════════════════════════════
bool sendRFID(String uid, String gate_id) {
  if (WiFi.status() != WL_CONNECTED) {
    lcdPrint("No WiFi!", "Offline");
    return false;
  }

  HTTPClient http;
  String url = String(SERVER_BASE) + "/api/esp32/rfid";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(8000);

  StaticJsonDocument<256> doc;
  doc["rfid_uid"]    = uid;        // e.g. "83F4EE28"
  doc["action"]      = "gate";
  doc["hardware_id"] = gate_id;

  String payload;
  serializeJson(doc, payload);

  Serial.printf("[HTTP] POST %s → %s\n", url.c_str(), payload.c_str());
  int code = http.POST(payload);
  bool granted = false;

  if (code == 200 || code == 201) {
    String resp = http.getString();
    Serial.printf("[HTTP] %d → %s\n", code, resp.c_str());

    StaticJsonDocument<512> res;
    if (!deserializeJson(res, resp)) {
      granted = res["success"].as<bool>();
      String l1 = res["lcd_line1"] | (granted ? "ACCESS GRANTED" : "ACCESS DENIED");
      String l2 = res["lcd_line2"] | "";
      lcdPrint(l1, l2);
      delay(2000);
    }
  } else if (code == 404) {
    Serial.println("[HTTP] Unknown card");
    lcdPrint("UNKNOWN CARD", "Not Registered");
    delay(2000);
  } else {
    Serial.printf("[HTTP] Error: %d\n", code);
    lcdPrint("Server Error", String(code));
    delay(2000);
  }

  http.end();
  lcdPrint("Scan RFID Card", "Ready...");
  return granted;
}

// ═══════════════════════════════════════════════════════════════════
//  POST env sensor data → /api/esp32/sensors
//  DHT11 (temp + humidity), LDR (light), Potentiometer
// ═══════════════════════════════════════════════════════════════════
void sendSensorData() {
  float temp  = dht.readTemperature();
  float humid = dht.readHumidity();
  int   ldr   = analogRead(LDR_PIN);
  int   pot   = analogRead(POT_PIN);

  Serial.printf("[DHT]  Temp: %.1f°C  Humid: %.1f%%\n", temp, humid);
  Serial.printf("[LDR]  Raw: %d\n", ldr);
  Serial.printf("[POT]  Raw: %d\n", pot);

  if (isnan(temp) || isnan(humid)) {
    Serial.println("[DHT] Read failed – skipping HTTP");
    return;
  }

  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE) + "/api/esp32/sensors";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(6000);

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["humidity"]    = humid;
  doc["ldr"]         = ldr;
  doc["pot"]         = pot;
  doc["hardware_id"] = "main_gate";

  String payload;
  serializeJson(doc, payload);

  Serial.printf("[HTTP] POST %s (sensors)\n", url.c_str());
  int code = http.POST(payload);
  Serial.printf("[HTTP] Sensors response: %d\n", code);
  http.end();
}

// ═══════════════════════════════════════════════════════════════════
//  Actuators
// ═══════════════════════════════════════════════════════════════════
void activateBuzzer(int durationMs) {
  Serial.println("[BUZZER] ON");
  digitalWrite(BUZZER_PIN, HIGH);
  buzzerActive     = true;
  buzzerStartTime  = millis();
}

void openRelay(int durationMs) {
  Serial.println("[RELAY] Gate open");
  digitalWrite(RELAY_PIN, HIGH);
  relayOpen     = true;
  relayOpenTime = millis();
}

// ─── LED helpers ───────────────────────────────────────────────────
void ledGrant() {
  // Green ON for 1.5 s (non-blocking handled by state or just blocking here)
  digitalWrite(LED_GREEN_PIN, HIGH);
  delay(1500);
  digitalWrite(LED_GREEN_PIN, LOW);
}

void ledDeny() {
  // Red blink 3×
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED_PIN, HIGH); delay(150);
    digitalWrite(LED_RED_PIN, LOW);  delay(150);
  }
}

void ledAlert() {
  // Yellow/Alert blink 5×
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_ALERT_PIN, HIGH); delay(100);
    digitalWrite(LED_ALERT_PIN, LOW);  delay(100);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  LCD helper (truncates to 16 chars per line)
// ═══════════════════════════════════════════════════════════════════
void lcdPrint(String l1, String l2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(l1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(l2.substring(0, 16));
}

// ═══════════════════════════════════════════════════════════════════
//  WiFi watchdog
// ═══════════════════════════════════════════════════════════════════
void reconnectWiFi() {
  Serial.println("[WiFi] Reconnecting...");
  lcdPrint("WiFi Lost!", "Reconnecting...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int a = 0;
  while (WiFi.status() != WL_CONNECTED && a < 20) {
    delay(500); a++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WiFi] Reconnected!");
    lcdPrint("WiFi Restored!", WiFi.localIP().toString());
    delay(1000);
    lcdPrint("Scan RFID Card", "Ready...");
  }
}

/*
 * ===================================================================
 *  WIRING REFERENCE  (matches users actual breadboard)
 * ===================================================================
 *
 *  MFRC522 RFID (HSPI – avoids D23/D5 conflicts):
 *  ┌──────────┬───────────┐
 *  │ RFID     │ ESP32     │
 *  ├──────────┼───────────┤
 *  │ SDA/CS   │ D15       │
 *  │ SCK      │ D18       │
 *  │ MOSI     │ D33       │
 *  │ MISO     │ D19       │
 *  │ RST      │ D27       │
 *  │ GND      │ GND       │
 *  │ 3.3V     │ 3.3V      │
 *  └──────────┴───────────┘
 *
 *  DHT11:  DATA → D5  | VCC → 3.3V | GND → GND
 *
 *  Ultrasonic HC-SR04:
 *  TRIG → D25 | ECHO → D26 | VCC → 5V | GND → GND
 *
 *  LCD I2C 16x2:
 *  SDA → D21 | SCL → D22 | VCC → 5V | GND → GND
 *
 *  RELAY:      IN → D2  | VCC → 5V | GND → GND
 *  BUZZER:     (+) → D4 | (-) → GND
 *  LED Green:  (+) → D12 → 220Ω → GND
 *  LED Red:    (+) → D13 → 220Ω → GND
 *  LED Yellow: (+) → D14 → 220Ω → GND
 *  Switch:     One leg → D23 | Other → GND  (INPUT_PULLUP)
 *  Pot:        Wiper → D34 | VCC → 3.3V | GND → GND
 *  LDR:        Divider out → D35 | VCC → 3.3V | GND → GND
 *
 * ===================================================================
 *  REGISTERED RFID CARDS
 * ===================================================================
 *  Piyush Bedekar  UID: 83F4EE28   (stored: "83 F4 EE 28")
 *  Shravani Naik   UID: 23AED713   (stored: "23 AE D7 13")
 *
 * ===================================================================
 *  LIBRARIES (Arduino IDE Library Manager)
 * ===================================================================
 *  - MFRC522          (miguelbalboa)
 *  - ArduinoJson      (Benoit Blanchon)
 *  - LiquidCrystal_I2C (Frank de Brabander)
 *  - DHT sensor library (Adafruit)
 *  - Adafruit Unified Sensor (dependency)
 * ===================================================================
 *  UPLOAD SETTINGS
 * ===================================================================
 *  Board  : ESP32 Dev Module
 *  Port   : COMx
 *  Baud   : 115200
 * ===================================================================
 */
