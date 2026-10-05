#include "display.h"

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

static const uint8_t SCREEN_WIDTH = 128;
static const uint8_t SCREEN_HEIGHT = 64;

// Common addresses for SSD1306 modules. Distinct from the BME280 at 0x76,
// so both live on the same bus without conflict.
static const uint8_t CANDIDATE_ADDRESSES[] = { 0x3C, 0x3D };

// A full frame over I2C costs a few milliseconds and the bus is shared with
// the sensor, so the screen is redrawn when something changed and otherwise
// at most once a second.
static const uint32_t MAX_REDRAW_INTERVAL_MS = 1000;

static Adafruit_SSD1306 oled(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

static bool present = false;
static uint8_t address = 0;
static uint32_t lastRenderMillis = 0;

// What was last drawn, so an unchanged frame can be skipped.
static float lastCelsius = -999.0f;
static TemperatureStatus lastStatus = TEMP_UNAVAILABLE;
static bool lastSimulated = false;
static bool lastWifi = false;
static uint32_t lastUptimeMinutes = 0xFFFFFFFF;

bool displayBegin() {
  for (uint8_t i = 0; i < sizeof(CANDIDATE_ADDRESSES); i++) {
    uint8_t addr = CANDIDATE_ADDRESSES[i];

    // Wire.begin() has already been called by temperatureBegin; passing
    // false here stops the driver resetting the shared bus.
    if (oled.begin(SSD1306_SWITCHCAPVCC, addr, false, false)) {
      present = true;
      address = addr;
      oled.clearDisplay();
      oled.setTextColor(SSD1306_WHITE);
      oled.display();
      return true;
    }
  }

  present = false;
  address = 0;
  return false;
}

bool displayPresent() { return present; }
uint8_t displayAddress() { return address; }

void displayBootMessage(const char* line) {
  if (!present) return;

  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.println(F("INSULIN PUMP"));
  oled.println();
  oled.println(line);
  oled.display();
}

static const char* shortStatusName(TemperatureStatus status) {
  switch (status) {
    case TEMP_UNAVAILABLE:   return "NO SENSOR";
    case TEMP_CRITICAL_COLD: return "TOO COLD";
    case TEMP_NORMAL:        return "NORMAL";
    case TEMP_WARNING_HOT:   return "TOO WARM";
    case TEMP_CRITICAL_HOT:  return "TOO HOT";
  }
  return "UNKNOWN";
}

static bool frameChanged(const DisplayState& s) {
  const TemperatureReading& t = s.temperature;

  if (t.status != lastStatus) return true;
  if (t.simulated != lastSimulated) return true;
  if (s.wifiConnected != lastWifi) return true;
  if (s.uptimeSeconds / 60 != lastUptimeMinutes) return true;

  // A tenth of a degree is the smallest change the screen shows, so smaller
  // movement is not worth a redraw.
  if (t.available && fabsf(t.celsius - lastCelsius) >= 0.05f) return true;

  return false;
}

void displayUpdate(const DisplayState& state) {
  if (!present) return;

  uint32_t now = millis();
  bool due = (now - lastRenderMillis) >= MAX_REDRAW_INTERVAL_MS;

  if (!due && !frameChanged(state)) return;

  const TemperatureReading& t = state.temperature;

  oled.clearDisplay();

  // Title row, with the simulated flag on the right when an override is
  // supplying the reading. A forced value must be obvious on the device
  // itself, not only in the app.
  oled.setTextSize(1);
  oled.setCursor(0, 0);
  oled.print(F("INSULIN PUMP"));

  if (t.simulated) {
    oled.setCursor(98, 0);
    oled.print(F("SIM"));
  }

  oled.drawFastHLine(0, 10, SCREEN_WIDTH, SSD1306_WHITE);

  // Temperature, large. The screen is read from across a bench, so the
  // number that matters gets the space.
  oled.setTextSize(2);
  oled.setCursor(4, 18);

  if (t.available) {
    oled.print(t.celsius, 1);
    oled.print(F(" C"));
  } else {
    // Not a blank and not a zero: the device says plainly that it does not
    // have a reading.
    oled.print(F("--.- C"));
  }

  oled.setTextSize(1);
  oled.setCursor(4, 38);
  oled.print(shortStatusName(t.status));

  oled.drawFastHLine(0, 50, SCREEN_WIDTH, SSD1306_WHITE);

  // Connection row. The IP is on screen because when something is wrong,
  // "what address is it on?" is the first question.
  oled.setCursor(0, 54);
  if (state.wifiConnected) {
    oled.print(state.ipAddress);
    oled.setCursor(92, 54);
    uint32_t minutes = state.uptimeSeconds / 60;
    if (minutes < 100) {
      oled.print(minutes);
      oled.print(F("m"));
    } else {
      oled.print(minutes / 60);
      oled.print(F("h"));
    }
  } else {
    oled.print(F("WIFI DISCONNECTED"));
  }

  oled.display();

  lastCelsius = t.available ? t.celsius : -999.0f;
  lastStatus = t.status;
  lastSimulated = t.simulated;
  lastWifi = state.wifiConnected;
  lastUptimeMinutes = state.uptimeSeconds / 60;
  lastRenderMillis = now;
}
