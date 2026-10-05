// Insulin delivery research prototype — device firmware.
//
// Stage 7: networking plus temperature monitoring. The device serves a JSON
// status endpoint that the backend polls. It has no actuators yet; delivery
// arrives at stage 8.
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
#include "temperature.h"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

static const char* FIRMWARE_VERSION = "0.7.0";
static const uint16_t HTTP_PORT = 80;

#define RGB_LED_PIN 48
#define NUM_LEDS 1
static const uint8_t LED_BRIGHTNESS = 10;

// I2C bus. The sensor is wired here; the OLED will share the same two pins.
#define I2C_SDA_PIN 4
#define I2C_SCL_PIN 14

static const int WIFI_MAX_ATTEMPTS = 30;
static const uint16_t WIFI_ATTEMPT_DELAY_MS = 500;
static const uint32_t WIFI_CHECK_INTERVAL_MS = 5000;
static const uint32_t WIFI_RECONNECT_COOLDOWN_MS = 10000;

// Test endpoints that force a temperature. They exist so the warning and
// critical paths can be demonstrated without heating the sensor. Any reading
// they produce is flagged simulated wherever it appears.
static const bool TEST_CONTROLS_ENABLED = true;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

Adafruit_NeoPixel rgbLed(NUM_LEDS, RGB_LED_PIN, NEO_GRB + NEO_KHZ800);
WebServer server(HTTP_PORT);

static uint32_t bootMillis = 0;
static uint32_t lastWifiCheck = 0;
static uint32_t lastReconnectAttempt = 0;
static uint32_t pollCount = 0;
static bool serverStarted = false;

// ---------------------------------------------------------------------------
// LED status
//
// The LED is the only diagnostic when the board is not on USB. It shows the
// most severe current condition: red for anything critical, orange for a
// warning, green when all is well. The app and serial output distinguish
// which condition it is.
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
  if (deviceState == STATE_READY) {
    TemperatureReading t = temperatureGet();

    if (t.available) {
      if (t.status == TEMP_CRITICAL_HOT || t.status == TEMP_CRITICAL_COLD) {
        setColor(255, 0, 0);
        return;
      }
      if (t.status == TEMP_WARNING_HOT) {
        setColor(255, 90, 0);
        return;
      }
    }

    setColor(0, 255, 0);
    return;
  }

  switch (deviceState) {
    case STATE_BOOTING:     setColor(0, 0, 0);   break;
    case STATE_CONNECTING:  setColor(0, 0, 255); break;
    case STATE_WIFI_FAILED: setColor(255, 0, 0); break;
    default: break;
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

void addTemperature(JsonDocument& doc) {
  TemperatureReading t = temperatureGet();

  JsonObject temp = doc["temperature"].to<JsonObject>();
  temp["available"] = t.available;
  temp["status"] = temperatureStatusName(t.status);
  temp["simulated"] = t.simulated;
  temp["sensorPresent"] = temperatureSensorPresent();
  temp["chip"] = temperatureChipName();

  if (t.available) {
    // One decimal place: the sensor's resolution does not justify more, and
    // trailing digits imply precision that is not there.
    temp["celsius"] = roundf(t.celsius * 10.0f) / 10.0f;
    temp["ageSeconds"] = t.ageMillis / 1000;
  } else {
    temp["celsius"] = nullptr;
    temp["ageSeconds"] = nullptr;
  }

  JsonObject limits = temp["thresholds"].to<JsonObject>();
  limits["criticalLowC"] = TEMP_CRITICAL_LOW_C;
  limits["warningHighC"] = TEMP_WARNING_HIGH_C;
  limits["criticalHighC"] = TEMP_CRITICAL_HIGH_C;
}

void handleStatus() {
  pollCount++;

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

  addTemperature(doc);

  JsonObject subsystems = doc["subsystems"].to<JsonObject>();
  subsystems["temperature"] =
      temperatureSensorPresent() ? "ready" : "not_available";
  subsystems["delivery"] = "not_implemented";
  subsystems["display"] = "not_implemented";

  blinkActivity();
  sendJson(200, doc);
}

void handleHealth() {
  JsonDocument doc;
  doc["ok"] = true;
  doc["uptimeSeconds"] = (millis() - bootMillis) / 1000;
  sendJson(200, doc);
}

// Test only. POST /test/temperature?c=38.5 forces a value; DELETE clears it.
void handleTestTemperature() {
  if (server.method() == HTTP_DELETE) {
    temperatureClearOverride();
    applyStateColor();

    JsonDocument doc;
    doc["ok"] = true;
    doc["overrideActive"] = false;
    sendJson(200, doc);
    return;
  }

  if (!server.hasArg("c")) {
    JsonDocument doc;
    doc["ok"] = false;
    doc["error"] = "missing_parameter";
    doc["detail"] = "Supply a temperature as ?c=<celsius>";
    sendJson(400, doc);
    return;
  }

  float celsius = server.arg("c").toFloat();

  // A plausibility bound, not a safety limit: it only stops a typo from
  // producing a nonsense test reading.
  if (celsius < -40.0f || celsius > 125.0f) {
    JsonDocument doc;
    doc["ok"] = false;
    doc["error"] = "out_of_range";
    doc["detail"] = "Temperature must be between -40 and 125 C";
    sendJson(400, doc);
    return;
  }

  temperatureSetOverride(celsius);
  applyStateColor();

  JsonDocument doc;
  doc["ok"] = true;
  doc["overrideActive"] = true;
  doc["celsius"] = celsius;
  doc["status"] = temperatureStatusName(classifyTemperature(celsius));
  sendJson(200, doc);
}

void handleRoot() {
  TemperatureReading t = temperatureGet();

  String tempLine;
  if (t.available) {
    tempLine = String(t.celsius, 1) + " &deg;C (" +
               String(temperatureStatusName(t.status)) + ")" +
               (t.simulated ? " <b>SIMULATED</b>" : "");
  } else {
    tempLine = "unavailable";
  }

  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'>"
                "<title>Insulin Pump Device</title></head><body>"
                "<h2>Insulin delivery prototype &mdash; device</h2>"
                "<p>Firmware " + String(FIRMWARE_VERSION) + "</p>"
                "<p>State: <b>" + String(stateName()) + "</b></p>"
                "<p>IP: " + WiFi.localIP().toString() + "</p>"
                "<p>Uptime: " + String((millis() - bootMillis) / 1000) + " s</p>"
                "<p>Polls served: " + String(pollCount) + "</p>"
                "<hr>"
                "<p>Sensor: " + String(temperatureChipName()) +
                (temperatureSensorPresent()
                     ? " at 0x" + String(temperatureAddress(), HEX)
                     : "") + "</p>"
                "<p>Temperature: " + tempLine + "</p>"
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

    if (TEST_CONTROLS_ENABLED) {
      server.on("/test/temperature", HTTP_POST, handleTestTemperature);
      server.on("/test/temperature", HTTP_DELETE, handleTestTemperature);
      Serial.println("  Test controls enabled (/test/temperature)");
    }

    server.onNotFound(handleNotFound);
    server.begin();
    serverStarted = true;
    Serial.println("HTTP server started.");
  }
}

void maintainWifi() {
  uint32_t now = millis();

  if (now - lastWifiCheck < WIFI_CHECK_INTERVAL_MS) return;
  lastWifiCheck = now;

  if (WiFi.status() == WL_CONNECTED) {
    if (deviceState != STATE_READY) {
      Serial.println("WiFi recovered.");
      Serial.print("  IP address: ");
      Serial.println(WiFi.localIP());
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

  Serial.print("Temperature sensor on SDA=");
  Serial.print(I2C_SDA_PIN);
  Serial.print(" SCL=");
  Serial.print(I2C_SCL_PIN);
  Serial.println("...");

  if (temperatureBegin(I2C_SDA_PIN, I2C_SCL_PIN)) {
    Serial.print("  Found ");
    Serial.print(temperatureChipName());
    Serial.print(" at 0x");
    Serial.println(temperatureAddress(), HEX);

    temperatureUpdate();
    TemperatureReading t = temperatureGet();
    if (t.available) {
      Serial.print("  Reading: ");
      Serial.print(t.celsius, 1);
      Serial.print(" C (");
      Serial.print(temperatureStatusName(t.status));
      Serial.println(")");
    }
  } else {
    // Not fatal. The device reports not_available and everything else works,
    // so the rest of the system stays testable without the sensor.
    Serial.println("  No sensor found. Temperature reports as unavailable.");
    Serial.println("  Check: SDA/SCL not swapped, VIN on 3V3, wiring secure.");
  }

  if (connectWifi()) {
    startServices();
  }
}

void loop() {
  server.handleClient();
  maintainWifi();
  temperatureUpdate();

  // The LED reflects the current temperature status, so it has to be
  // refreshed as readings change rather than only on state transitions.
  static uint32_t lastLedRefresh = 0;
  if (millis() - lastLedRefresh > 2000) {
    lastLedRefresh = millis();
    applyStateColor();
  }
}
