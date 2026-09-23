// Insulin delivery research prototype — device firmware.
//
// Stage 6: networking only. The device joins Wi-Fi and serves a JSON status
// endpoint that the backend polls. It has no actuators yet; temperature
// arrives at stage 7 and delivery at stage 8.
//
// The device never pushes to the backend. All communication is the backend
// polling this device.

#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

#include "secrets.h"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

static const char* FIRMWARE_VERSION = "0.6.0";
static const uint16_t HTTP_PORT = 80;

#define RGB_LED_PIN 48
#define NUM_LEDS 1
static const uint8_t LED_BRIGHTNESS = 10;

// Connection attempt budget, carried over from the POC: a definite failure
// after 15 seconds rather than hanging forever.
static const int WIFI_MAX_ATTEMPTS = 30;
static const uint16_t WIFI_ATTEMPT_DELAY_MS = 500;

// How often loop() checks whether Wi-Fi is still up.
static const uint32_t WIFI_CHECK_INTERVAL_MS = 5000;
static const uint32_t WIFI_RECONNECT_COOLDOWN_MS = 10000;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

Adafruit_NeoPixel rgbLed(NUM_LEDS, RGB_LED_PIN, NEO_GRB + NEO_KHZ800);
WebServer server(HTTP_PORT);

static uint32_t bootMillis = 0;
static uint32_t lastWifiCheck = 0;
static uint32_t lastReconnectAttempt = 0;
static uint32_t pollCount = 0;
static uint32_t lastPollMillis = 0;
static bool serverStarted = false;

// ---------------------------------------------------------------------------
// LED status
//
// The LED is the only diagnostic when the board is not on USB, so each state
// has one unambiguous colour. Stages 7 and 8 add warning and fault states
// here rather than calling setColor from scattered places.
// ---------------------------------------------------------------------------

enum DeviceState {
  STATE_BOOTING,
  STATE_CONNECTING,
  STATE_READY,
  STATE_WIFI_FAILED
};

static DeviceState deviceState = STATE_BOOTING;

void setColor(uint8_t r, uint8_t g, uint8_t b) {
  rgbLed.setPixelColor(0, rgbLed.Color(r, g, b));
  rgbLed.show();
}

void applyStateColor() {
  switch (deviceState) {
    case STATE_BOOTING:     setColor(0, 0, 0);     break;
    case STATE_CONNECTING:  setColor(0, 0, 255);   break;  // blue
    case STATE_READY:       setColor(0, 255, 0);   break;  // green
    case STATE_WIFI_FAILED: setColor(255, 0, 0);   break;  // red
  }
}

void setState(DeviceState next) {
  deviceState = next;
  applyStateColor();
}

const char* stateName() {
  switch (deviceState) {
    case STATE_BOOTING:     return "booting";
    case STATE_CONNECTING:  return "connecting";
    case STATE_READY:       return "ready";
    case STATE_WIFI_FAILED: return "wifi_failed";
  }
  return "unknown";
}

// Brief white blink, so a poll from the backend is visible on the bench.
void blinkActivity() {
  setColor(255, 255, 255);
  delay(20);
  applyStateColor();
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------

void sendJson(int code, JsonDocument& doc) {
  String out;
  serializeJson(doc, out);
  server.send(code, "application/json", out);
}

// Polled by the backend. Deliberately small and fast: it reports what the
// device knows about itself and nothing more.
void handleStatus() {
  pollCount++;
  lastPollMillis = millis();

  JsonDocument doc;
  doc["deviceId"] = DEVICE_HOSTNAME;
  doc["firmwareVersion"] = FIRMWARE_VERSION;
  doc["state"] = stateName();
  doc["ready"] = (deviceState == STATE_READY);
  doc["uptimeSeconds"] = (millis() - bootMillis) / 1000;
  doc["freeHeapBytes"] = ESP.getFreeHeap();
  doc["pollCount"] = pollCount;

  JsonObject wifi = doc["wifi"].to<JsonObject>();
  wifi["connected"] = (WiFi.status() == WL_CONNECTED);
  wifi["ssid"] = WiFi.SSID();
  wifi["ip"] = WiFi.localIP().toString();
  wifi["rssi"] = WiFi.RSSI();

  // Subsystems the backend will read in later stages. Declared now so the
  // response shape does not change when they arrive.
  JsonObject subsystems = doc["subsystems"].to<JsonObject>();
  subsystems["temperature"] = "not_implemented";
  subsystems["delivery"] = "not_implemented";
  subsystems["display"] = "not_implemented";

  blinkActivity();
  sendJson(200, doc);
}

// Liveness only. Smaller and cheaper than /status.
void handleHealth() {
  JsonDocument doc;
  doc["ok"] = true;
  doc["uptimeSeconds"] = (millis() - bootMillis) / 1000;
  sendJson(200, doc);
}

// Human-readable page for checking the device from a browser.
void handleRoot() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                "<title>Insulin Pump Device</title></head><body>"
                "<h2>Insulin delivery prototype &mdash; device</h2>"
                "<p>Firmware " + String(FIRMWARE_VERSION) + "</p>"
                "<p>State: <b>" + String(stateName()) + "</b></p>"
                "<p>IP: " + WiFi.localIP().toString() + "</p>"
                "<p>Uptime: " + String((millis() - bootMillis) / 1000) + " s</p>"
                "<p>Polls served: " + String(pollCount) + "</p>"
                "<hr>"
                "<p><a href='/status'>/status</a> (JSON, polled by backend)</p>"
                "<p><a href='/health'>/health</a> (JSON, liveness)</p>"
                "<hr><p><small>Academic research prototype. "
                "Not for clinical use.</small></p>"
                "</body></html>";
  server.send(200, "text/html", html);
}

void handleNotFound() {
  JsonDocument doc;
  doc["ok"] = false;
  doc["error"] = "not_found";
  doc["path"] = server.uri();
  sendJson(404, doc);
}

// ---------------------------------------------------------------------------
// Wi-Fi
// ---------------------------------------------------------------------------

bool connectWifi() {
  setState(STATE_CONNECTING);

  WiFi.mode(WIFI_STA);
  WiFi.setHostname(DEVICE_HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < WIFI_MAX_ATTEMPTS) {
    delay(WIFI_ATTEMPT_DELAY_MS);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed to connect to WiFi.");
    setState(STATE_WIFI_FAILED);
    return false;
  }

  Serial.println("WiFi connected.");
  Serial.print("  SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("  IP address: ");
  Serial.println(WiFi.localIP());
  Serial.print("  Signal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");

  // Confirmation flash, carried over from the POC.
  for (int i = 0; i < 3; i++) {
    setColor(0, 255, 0);
    delay(300);
    setColor(0, 0, 0);
    delay(300);
  }

  setState(STATE_READY);
  return true;
}

void startServices() {
  if (MDNS.begin(DEVICE_HOSTNAME)) {
    MDNS.addService("http", "tcp", HTTP_PORT);
    Serial.print("  Also reachable at http://");
    Serial.print(DEVICE_HOSTNAME);
    Serial.println(".local");
  } else {
    Serial.println("  mDNS failed to start (IP address still works)");
  }

  if (!serverStarted) {
    server.on("/", handleRoot);
    server.on("/status", handleStatus);
    server.on("/health", handleHealth);
    server.onNotFound(handleNotFound);
    server.begin();
    serverStarted = true;
    Serial.println("HTTP server started.");
  }
}

// The POC connected once at boot. Without this, a router restart leaves the
// device unreachable until it is power-cycled.
void maintainWifi() {
  uint32_t now = millis();

  if (now - lastWifiCheck < WIFI_CHECK_INTERVAL_MS) return;
  lastWifiCheck = now;

  if (WiFi.status() == WL_CONNECTED) {
    if (deviceState != STATE_READY) {
      Serial.println("WiFi recovered.");
      setState(STATE_READY);
      startServices();
    }
    return;
  }

  if (deviceState == STATE_READY) {
    Serial.println("WiFi connection lost.");
    setState(STATE_WIFI_FAILED);
  }

  if (now - lastReconnectAttempt < WIFI_RECONNECT_COOLDOWN_MS) return;
  lastReconnectAttempt = now;

  Serial.println("Attempting to reconnect...");
  WiFi.disconnect();
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ---------------------------------------------------------------------------

void setup() {
  // Carried over from the POC: the S3 can brown out on USB power during the
  // radio's initial current draw.
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  bootMillis = millis();

  Serial.begin(115200);
  delay(2000);

  rgbLed.begin();
  rgbLed.setBrightness(LED_BRIGHTNESS);
  setState(STATE_BOOTING);

  Serial.println();
  Serial.println("=====================================");
  Serial.print("Insulin delivery prototype — firmware ");
  Serial.println(FIRMWARE_VERSION);
  Serial.println("Academic research prototype. Not for clinical use.");
  Serial.println("=====================================");

  if (connectWifi()) {
    startServices();
  }
}

void loop() {
  server.handleClient();
  maintainWifi();
}
