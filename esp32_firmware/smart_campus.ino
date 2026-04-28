/*
 * ===================================================================
 *  PSR Smart Campus – ESP32 Firmware  v3.0  (Updated: 2026-04-28)
 * ===================================================================
 *
 *  ── DUAL MODE OPERATION ──────────────────────────────────────────
 *  Press D23 Switch to toggle between:
 *    [GATE MODE]    → RFID scans log attendance + Servo opens gate
 *    [CANTEEN MODE] → RFID scans deduct wallet payment
 *
 *  In CANTEEN mode, Potentiometer (D34) adjusts payment amount:
 *    Pot raw 0–4095 maps to Rs.10 – Rs.500 (nearest Rs.10 step)
 *
 *  ── SERVO MOTOR (D32) ────────────────────────────────────────────
 *  Opens gate bar to 90° on RFID grant. Auto-closes to 0° after
 *  3 seconds. Works alongside RELAY (D2) — both activate together.
 *
 *  ── IR SENSOR (D16) ──────────────────────────────────────────────
 *  Detects person without RFID card. LOW = object detected.
 *  Auto-opens gate (servo + relay) and logs AUTO_ENTRY to server.
 *  3 s cooldown between IR triggers.
 *
 *  LCD shows current mode on idle screen.
 *  LED Green  (D12) = Gate Mode active indicator (solid)
 *  LED Yellow (D14) = Canteen Mode active indicator (solid)
 *  LED Red    (D13) = Blinks on access denied / low balance
 *
 * ───────────────────────────────────────────────────────────────────
 *  PIN MAP (matches physical wiring)
 * ───────────────────────────────────────────────────────────────────
 *  D2  → RELAY         (gate / door lock)
 *  D4  → BUZZER
 *  D5  → DHT11         (temperature & humidity)
 *  D12 → LED Green     (Access Granted / Gate Mode)
 *  D13 → LED Red       (Denied / Error)
 *  D14 → LED Yellow    (Alert / Canteen Mode)
 *  D15 → RFID SS/CS    (HSPI)
 *  D16 → IR SENSOR     (LOW = person detected → auto open gate)
 *  D18 → RFID SCK      (HSPI)
 *  D19 → RFID MISO     (HSPI)
 *  D21 → I2C SDA       (LCD 16×2)
 *  D22 → I2C SCL       (LCD 16×2)
 *  D23 → Switch        (MODE TOGGLE – Gate / Canteen)
 *  D25 → Ultrasonic TRIG
 *  D26 → Ultrasonic ECHO
 *  D27 → RFID RST      (HSPI)
 *  D32 → SERVO MOTOR   (PWM – gate bar 0°=closed, 90°=open)
 *  D33 → RFID MOSI     (HSPI)
 *  D34 → Potentiometer (sets canteen payment amount)
 *  D35 → LDR           (Analog – light level)
 *
 *  RFID Cards registered:
 *    Piyush Bedekar  → 83F4EE28
 *    Shravani Naik   → 23AED713
 *
 *  Libraries required:
 *    MFRC522, ArduinoJson, LiquidCrystal_I2C,
 *    DHT sensor library (Adafruit), ESP32Servo
 * ===================================================================
 */

#include <ArduinoJson.h>
#include <DHT.h>
#include <ESP32Servo.h>       // Servo motor support
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

#define LED_GREEN_PIN  12   // Gate Mode / Access Granted
#define LED_RED_PIN    13   // Access Denied / Error
#define LED_ALERT_PIN  14   // Canteen Mode / Alert

// RFID – HSPI (avoids conflict with D23 switch & D5 DHT)
#define RFID_SS_PIN    15
#define RFID_RST_PIN   27
#define RFID_SCK_PIN   18
#define RFID_MISO_PIN  19
#define RFID_MOSI_PIN  33

// I2C LCD
#define I2C_SDA_PIN    21
#define I2C_SCL_PIN    22

// Mode Toggle Switch
#define SWITCH_PIN     23

// Ultrasonic HC-SR04
#define TRIG_PIN       25
#define ECHO_PIN       26

// Servo Motor – gate bar
#define SERVO_PIN      32   // PWM-capable pin
#define SERVO_CLOSED    0   // degrees – gate closed
#define SERVO_OPEN     90   // degrees – gate open

// IR Sensor (FC-51 / TCRT5000)
#define IR_PIN         16   // LOW = object/person detected
#define IR_COOLDOWN_MS 3000 // min gap between IR triggers

// Analog Inputs
#define POT_PIN        34   // Potentiometer – canteen amount control
#define LDR_PIN        35   // LDR – light level

// ── THRESHOLDS / TIMING ────────────────────────────────────────────
#define PERSON_DIST_CM       100
#define MULTI_PERSON_THRESH  2
#define BUZZER_DURATION_MS   3000
#define RELAY_OPEN_MS        3000
#define SCAN_COOLDOWN_MS     3000
#define SWITCH_DEBOUNCE_MS   400
#define SENSOR_REPORT_MS    30000  // env data every 30 s

// Canteen amount: pot 0–4095 → Rs.10–Rs.500 in steps of Rs.10
#define CANTEEN_AMOUNT_MIN   10
#define CANTEEN_AMOUNT_MAX   500
#define CANTEEN_AMOUNT_STEP  10

// ── MODE ENUM ─────────────────────────────────────────────────────
enum Mode { GATE_MODE, CANTEEN_MODE };

// ── OBJECTS ────────────────────────────────────────────────────────
SPIClass hspi(HSPI);
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);
DHT dht(DHT_PIN, DHT11);
Servo gateServo;              // Servo motor on D32

// ── STATE ──────────────────────────────────────────────────────────
Mode          currentMode      = GATE_MODE;
unsigned long lastScanTime     = 0;
unsigned long buzzerStartTime  = 0;
unsigned long relayOpenTime    = 0;
unsigned long lastSensorReport = 0;
unsigned long lastSwitchPress  = 0;
unsigned long lastIRTrigger    = 0;  // IR cooldown
bool          buzzerActive     = false;
bool          relayOpen        = false;
bool          gateOpen         = false; // tracks servo state

// ── FUNCTION PROTOTYPES ───────────────────────────────────────────
String  readRFID();
int     countPersons();
bool    sendRFID(String uid, String gate_id, Mode mode, int amount);
void    sendSensorData();
void    activateBuzzer(int durationMs = BUZZER_DURATION_MS);
void    openRelay(int durationMs = RELAY_OPEN_MS);
void    openGate();           // servo + relay together
void    closeGate();          // servo close
void    sendIREntry();        // auto-log IR detection to server
void    ledGrant();
void    ledDeny();
void    ledAlert();
void    setModeIndicator(Mode m);
void    showIdleScreen();
void    lcdPrint(String l1, String l2 = "");
void    reconnectWiFi();
int     getCanteenAmount();

// ═══════════════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  Serial.println("\n[BOOT] PSR Smart Campus ESP32 v3.0 (Servo + IR + Dual-Mode)");

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
  pinMode(IR_PIN,     INPUT_PULLUP); // IR: LOW = object detected
  // D34, D35 are input-only, no pinMode needed

  // ── Servo Motor ──
  gateServo.attach(SERVO_PIN);     // D32
  gateServo.write(SERVO_CLOSED);   // start closed (0°)
  Serial.println("[SERVO] Attached on D32 – closed at 0°");

  // ── LCD ──
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcdPrint("PSR Campus v3", "Booting...");

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
  digitalWrite(LED_GREEN_PIN, HIGH); delay(200);
  digitalWrite(LED_RED_PIN,   HIGH); delay(200);
  digitalWrite(LED_ALERT_PIN, HIGH); delay(200);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN,   LOW);
  digitalWrite(LED_ALERT_PIN, LOW);

  // Start in GATE mode
  currentMode = GATE_MODE;
  setModeIndicator(GATE_MODE);
  showIdleScreen();
  Serial.println("[BOOT] Setup complete. Mode: GATE | Servo: D32 | IR: D16");
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

  // ── Gate auto-close (relay + servo) ──
  if (relayOpen && (now - relayOpenTime >= (unsigned long)RELAY_OPEN_MS)) {
    closeGate();              // servo to 0°
    digitalWrite(RELAY_PIN, LOW);
    relayOpen = false;
    gateOpen  = false;
    lcdPrint("Gate Closed", "Scan Card");
    delay(1000);
    showIdleScreen();
    Serial.println("[GATE] Auto-closed");
  }

  // ── WiFi watchdog ──
  if (WiFi.status() != WL_CONNECTED) {
    reconnectWiFi();
    return;
  }

  // ── Periodic env sensor report (every 30 s) ──
  if (now - lastSensorReport >= SENSOR_REPORT_MS) {
    sendSensorData();
    lastSensorReport = now;
  }

  // ── MODE TOGGLE via D23 Switch ─────────────────────────────────
  if (digitalRead(SWITCH_PIN) == LOW && (now - lastSwitchPress > SWITCH_DEBOUNCE_MS)) {
    lastSwitchPress = now;
    if (currentMode == GATE_MODE) {
      currentMode = CANTEEN_MODE;
      Serial.println("[MODE] Switched → CANTEEN");
    } else {
      currentMode = GATE_MODE;
      Serial.println("[MODE] Switched → GATE");
    }
    setModeIndicator(currentMode);
    showIdleScreen();
    delay(200);
  }

  // ── IR Sensor auto-gate (Gate Mode only) ──────────────────────
  // Triggered when person walks up WITHOUT an RFID card
  if (currentMode == GATE_MODE &&
      digitalRead(IR_PIN) == LOW &&
      !gateOpen &&
      (now - lastIRTrigger > IR_COOLDOWN_MS)) {
    lastIRTrigger = now;
    Serial.println("[IR] Person detected → auto-opening gate");
    lcdPrint("IR Detected!", "Auto Opening...");
    openGate();
    ledGrant();
    sendIREntry();            // log to server as AUTO_ENTRY
    delay(2500);
    showIdleScreen();
  }

  // ── Scan cooldown ──
  if (now - lastScanTime < SCAN_COOLDOWN_MS) return;

  // ── RFID scan ──
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial())   return;

  String uid = readRFID();
  Serial.printf("[RFID] Card: %s | Mode: %s\n", uid.c_str(),
                currentMode == GATE_MODE ? "GATE" : "CANTEEN");
  lastScanTime = now;

  // ── Get canteen amount from potentiometer ──
  int amount = getCanteenAmount();

  if (currentMode == GATE_MODE) {
    lcdPrint("Card: " + uid, "Checking Gate..");

    // Person count via ultrasonic (only in gate mode)
    int persons = countPersons();
    Serial.printf("[ULTRA] Persons: %d\n", persons);
    if (persons >= MULTI_PERSON_THRESH) {
      lcdPrint("SECURITY ALERT!", "Multi-Person!");
      ledAlert();
      activateBuzzer();
      Serial.println("[SECURITY] Tailgate alert!");
    }

    bool granted = sendRFID(uid, "main_gate", GATE_MODE, 0);
    if (granted) {
      openGate();     // servo 90° + relay HIGH
      ledGrant();
      Serial.println("[GATE] Access granted – gate opened");
    } else {
      ledDeny();
      Serial.println("[GATE] Access denied");
    }

  } else { // CANTEEN_MODE
    lcdPrint("Card: " + uid, "Paying Rs." + String(amount));
    Serial.printf("[CANTEEN] Charging Rs.%d\n", amount);

    bool paid = sendRFID(uid, "canteen_counter", CANTEEN_MODE, amount);
    if (paid) {
      // Short green flash for successful payment
      activateBuzzer(500);  // short beep
      ledGrant();
      Serial.printf("[CANTEEN] Payment Rs.%d successful\n", amount);
    } else {
      ledDeny();
      Serial.println("[CANTEEN] Payment failed");
    }
  }

  // ── Stop RFID ──
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // Return to idle after 2.5s
  delay(2500);
  showIdleScreen();
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
//  Potentiometer → canteen amount (Rs.10 – Rs.500, step Rs.10)
// ═══════════════════════════════════════════════════════════════════
int getCanteenAmount() {
  int raw = analogRead(POT_PIN);  // 0–4095
  // Map to CANTEEN_AMOUNT_MIN..MAX then round to nearest step
  int mapped = map(raw, 0, 4095, CANTEEN_AMOUNT_MIN, CANTEEN_AMOUNT_MAX);
  int stepped = (mapped / CANTEEN_AMOUNT_STEP) * CANTEEN_AMOUNT_STEP;
  if (stepped < CANTEEN_AMOUNT_MIN) stepped = CANTEEN_AMOUNT_MIN;
  return stepped;
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

  long dur  = pulseIn(ECHO_PIN, HIGH, 30000);
  float dist = (dur * 0.0343f) / 2.0f;
  Serial.printf("[ULTRA] Distance: %.1f cm\n", dist);

  if (dist > 0 && dist < PERSON_DIST_CM) {
    return (dist < 40) ? 2 : 1;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════
//  POST to /api/esp32/rfid  (supports gate AND canteen)
//  Gate:    { rfid_uid, action:"gate",    hardware_id }
//  Canteen: { rfid_uid, action:"canteen", hardware_id, amount }
// ═══════════════════════════════════════════════════════════════════
bool sendRFID(String uid, String gate_id, Mode mode, int amount) {
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
  doc["rfid_uid"]    = uid;
  doc["action"]      = (mode == GATE_MODE) ? "gate" : "canteen";
  doc["hardware_id"] = gate_id;
  if (mode == CANTEEN_MODE) doc["amount"] = amount;

  String payload;
  serializeJson(doc, payload);

  Serial.printf("[HTTP] POST %s → %s\n", url.c_str(), payload.c_str());
  int code = http.POST(payload);
  bool success = false;

  if (code == 200 || code == 201) {
    String resp = http.getString();
    Serial.printf("[HTTP] %d → %s\n", code, resp.c_str());

    StaticJsonDocument<512> res;
    if (!deserializeJson(res, resp)) {
      success = res["success"].as<bool>();
      String l1 = res["lcd_line1"] | (success ? "SUCCESS" : "FAILED");
      String l2 = res["lcd_line2"] | "";
      lcdPrint(l1, l2);
      delay(2500);
    }
  } else if (code == 404) {
    Serial.println("[HTTP] Unknown card");
    lcdPrint("UNKNOWN CARD", "Not Registered");
    delay(2500);
  } else {
    Serial.printf("[HTTP] Error: %d\n", code);
    lcdPrint("Server Error", String(code));
    delay(2000);
  }

  http.end();
  return success;
}

// ═══════════════════════════════════════════════════════════════════
//  POST env sensor data → /api/esp32/sensors  (every 30 s)
//  DHT11 (temp + humidity), LDR (light), Potentiometer
// ═══════════════════════════════════════════════════════════════════
void sendSensorData() {
  float temp  = dht.readTemperature();
  float humid = dht.readHumidity();
  int   ldr   = analogRead(LDR_PIN);
  int   pot   = analogRead(POT_PIN);

  Serial.printf("[DHT]  Temp: %.1f°C  Humid: %.1f%%\n", temp, humid);
  Serial.printf("[LDR]  Raw: %d\n", ldr);
  Serial.printf("[POT]  Raw: %d  →  Canteen Rs.%d\n", pot, getCanteenAmount());

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

  Serial.printf("[HTTP] POST sensors\n");
  int code = http.POST(payload);
  Serial.printf("[HTTP] Sensors response: %d\n", code);
  http.end();
}

// ═══════════════════════════════════════════════════════════════════
//  Actuators
// ═══════════════════════════════════════════════════════════════════
void activateBuzzer(int durationMs) {
  Serial.printf("[BUZZER] ON (%d ms)\n", durationMs);
  digitalWrite(BUZZER_PIN, HIGH);
  buzzerActive    = true;
  buzzerStartTime = millis();
  // Override duration in state so auto-off works correctly
  // We repurpose BUZZER_DURATION_MS as constant; use direct delay for short beeps
  if (durationMs != BUZZER_DURATION_MS) {
    delay(durationMs);
    digitalWrite(BUZZER_PIN, LOW);
    buzzerActive = false;
  }
}

void openRelay(int durationMs) {
  // Legacy wrapper – now calls openGate() for servo+relay
  openGate();
}

// ═══════════════════════════════════════════════════════════════════
//  openGate – moves servo to OPEN + activates relay
//  Auto-closes after RELAY_OPEN_MS via loop()
// ═══════════════════════════════════════════════════════════════════
void openGate() {
  Serial.println("[GATE] Opening – Servo 90° + Relay HIGH");
  gateServo.write(SERVO_OPEN);    // D32 servo → 90°
  digitalWrite(RELAY_PIN, HIGH);  // D2 relay → ON
  relayOpen     = true;
  gateOpen      = true;
  relayOpenTime = millis();
}

// ═══════════════════════════════════════════════════════════════════
//  closeGate – returns servo to CLOSED (0°)
// ═══════════════════════════════════════════════════════════════════
void closeGate() {
  Serial.println("[GATE] Closing – Servo 0°");
  gateServo.write(SERVO_CLOSED);  // D32 servo → 0°
  gateOpen = false;
}

// ═══════════════════════════════════════════════════════════════════
//  sendIREntry – logs auto IR-triggered entry to /api/esp32/rfid
//  Uses special UID "AUTO_EXIT_IR" which the backend already handles
// ═══════════════════════════════════════════════════════════════════
void sendIREntry() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE) + "/api/esp32/rfid";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.setTimeout(6000);

  // "AUTO_EXIT_IR" is already handled in the backend rfid route
  // It creates an anonymous auto-entry log
  StaticJsonDocument<200> doc;
  doc["rfid_uid"]    = "AUTO_EXIT_IR";
  doc["action"]      = "gate";
  doc["hardware_id"] = "main_gate_ir";

  String payload;
  serializeJson(doc, payload);

  Serial.printf("[HTTP] POST IR Entry: %s\n", payload.c_str());
  int code = http.POST(payload);
  Serial.printf("[HTTP] IR Entry response: %d\n", code);
  http.end();
}

// ─── LED helpers ───────────────────────────────────────────────────
void ledGrant() {
  digitalWrite(LED_GREEN_PIN, HIGH);
  delay(1500);
  digitalWrite(LED_GREEN_PIN, LOW);
  // Restore mode indicator after
  setModeIndicator(currentMode);
}

void ledDeny() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED_PIN, HIGH); delay(150);
    digitalWrite(LED_RED_PIN, LOW);  delay(150);
  }
}

void ledAlert() {
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_ALERT_PIN, HIGH); delay(100);
    digitalWrite(LED_ALERT_PIN, LOW);  delay(100);
  }
  setModeIndicator(currentMode); // restore
}

// ── Mode LED indicator ─────────────────────────────────────────────
void setModeIndicator(Mode m) {
  // Gate mode  → Green LED solid
  // Canteen mode → Yellow LED solid
  digitalWrite(LED_GREEN_PIN, m == GATE_MODE    ? HIGH : LOW);
  digitalWrite(LED_ALERT_PIN, m == CANTEEN_MODE ? HIGH : LOW);
  digitalWrite(LED_RED_PIN,   LOW);
}

// ── Idle screen on LCD ─────────────────────────────────────────────
void showIdleScreen() {
  if (currentMode == GATE_MODE) {
    lcdPrint("[ GATE MODE ]", "Scan RFID Card");
  } else {
    int amt = getCanteenAmount();
    lcdPrint("[CANTEEN MODE]", "Rs." + String(amt) + " - Scan");
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
    showIdleScreen();
  }
}

/*
 * ===================================================================
 *  DUAL MODE OPERATION GUIDE
 * ===================================================================
 *
 *  GATE MODE  (default at boot)
 *  ─────────────────────────────
 *  LCD shows:  "[ GATE MODE ]"
 *              "Scan RFID Card"
 *  LED Green = solid ON
 *
 *  Scan Piyush / Shravani card:
 *    → Backend checks user, logs attendance
 *    → Relay (D2) opens gate for 3 s
 *    → Green LED flashes
 *    → LCD: "ACCESS GRANTED / Piyush Bedekar"
 *
 *  Unknown card:
 *    → Red LED blinks 3×
 *    → LCD: "UNKNOWN CARD / Not Registered"
 *
 *  Multiple persons at gate:
 *    → Yellow LED blinks 5× + Buzzer 3 s
 *    → LCD: "SECURITY ALERT! / Multi-Person!"
 *
 * ─────────────────────────────────────────────────────────────────
 *  CANTEEN MODE  (press D23 to toggle)
 *  ─────────────────────────────────────
 *  LCD shows:  "[CANTEEN MODE]"
 *              "Rs.50 - Scan"
 *  LED Yellow = solid ON
 *
 *  Potentiometer (D34) sets payment amount:
 *    Turn fully left  → Rs.10
 *    Turn middle      → Rs.250
 *    Turn fully right → Rs.500
 *    (steps of Rs.10)
 *
 *  Scan Piyush / Shravani card:
 *    → Backend deducts amount from wallet
 *    → Short beep (500 ms)
 *    → Green LED flashes
 *    → LCD: "PAID Rs.50 / BAL Rs.5950"
 *
 *  Insufficient balance:
 *    → Red LED blinks 3×
 *    → LCD: "TXN FAILED / Low Balance"
 *
 * ─────────────────────────────────────────────────────────────────
 *  Toggle:  Press D23 switch anytime to switch between modes.
 *           Mode saves until next press or power cycle.
 *
 * ═══════════════════════════════════════════════════════════════════
 *  RFID WIRING (HSPI)
 * ═══════════════════════════════════════════════════════════════════
 *  SDA/CS → D15 | SCK → D18 | MOSI → D33
 *  MISO   → D19 | RST → D27 | 3.3V | GND
 *
 *  REGISTERED CARDS
 *  Piyush Bedekar  → 83F4EE28  (stored "83 F4 EE 28")
 *  Shravani Naik   → 23AED713  (stored "23 AE D7 13")
 *
 * ═══════════════════════════════════════════════════════════════════
 *  LIBRARIES (Arduino IDE)
 * ═══════════════════════════════════════════════════════════════════
 *  MFRC522 | ArduinoJson | LiquidCrystal_I2C
 *  DHT sensor library (Adafruit) | Adafruit Unified Sensor
 *
 *  UPLOAD SETTINGS
 *  Board: ESP32 Dev Module | Baud: 115200
 * ═══════════════════════════════════════════════════════════════════
 */
