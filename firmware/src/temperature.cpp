#include "temperature.h"

#include <Wire.h>
#include <Adafruit_BME280.h>
#include <Adafruit_BMP280.h>

// These breakout boards are sold with either chip and the silkscreen says
// "BME/BMP280" for both. Rather than requiring the builder to know, the
// firmware tries each driver at each of the two possible addresses.
static const uint8_t CANDIDATE_ADDRESSES[] = { 0x76, 0x77 };

// The sensor is read on an interval rather than on every request, so that a
// burst of HTTP polls cannot hammer the I2C bus.
static const uint32_t SAMPLE_INTERVAL_MS = 2000;

enum ChipKind { CHIP_NONE, CHIP_BME280, CHIP_BMP280 };

static Adafruit_BME280 bme;
static Adafruit_BMP280 bmp;

static ChipKind chipKind = CHIP_NONE;
static uint8_t chipAddress = 0;

static float lastCelsius = 0.0f;
static bool haveReading = false;
static uint32_t lastSampleMillis = 0;

static bool overrideActive = false;
static float overrideCelsius = 0.0f;

bool temperatureBegin(uint8_t sdaPin, uint8_t sclPin) {
  Wire.begin(sdaPin, sclPin);

  for (uint8_t i = 0; i < sizeof(CANDIDATE_ADDRESSES); i++) {
    uint8_t addr = CANDIDATE_ADDRESSES[i];

    if (bme.begin(addr, &Wire)) {
      chipKind = CHIP_BME280;
      chipAddress = addr;
      // Weather-station preset: slow, low-noise sampling. Appropriate for a
      // storage compartment, where temperature changes over minutes.
      bme.setSampling(Adafruit_BME280::MODE_FORCED,
                      Adafruit_BME280::SAMPLING_X1,
                      Adafruit_BME280::SAMPLING_X1,
                      Adafruit_BME280::SAMPLING_X1,
                      Adafruit_BME280::FILTER_OFF);
      return true;
    }

    if (bmp.begin(addr)) {
      chipKind = CHIP_BMP280;
      chipAddress = addr;
      bmp.setSampling(Adafruit_BMP280::MODE_FORCED,
                      Adafruit_BMP280::SAMPLING_X1,
                      Adafruit_BMP280::SAMPLING_X1,
                      Adafruit_BMP280::FILTER_OFF);
      return true;
    }
  }

  chipKind = CHIP_NONE;
  chipAddress = 0;
  return false;
}

static bool readSensor(float& out) {
  if (chipKind == CHIP_BME280) {
    if (!bme.takeForcedMeasurement()) return false;
    float t = bme.readTemperature();
    if (isnan(t)) return false;
    out = t;
    return true;
  }

  if (chipKind == CHIP_BMP280) {
    if (!bmp.takeForcedMeasurement()) return false;
    float t = bmp.readTemperature();
    if (isnan(t)) return false;
    out = t;
    return true;
  }

  return false;
}

void temperatureUpdate() {
  if (chipKind == CHIP_NONE) return;

  uint32_t now = millis();
  if (haveReading && (now - lastSampleMillis) < SAMPLE_INTERVAL_MS) return;

  float celsius;
  if (readSensor(celsius)) {
    lastCelsius = celsius;
    haveReading = true;
    lastSampleMillis = now;
  }
  // A failed read leaves the previous value and its age in place. The age is
  // reported, so a sensor that has stopped responding becomes visible rather
  // than appearing frozen at a plausible number.
}

TemperatureStatus classifyTemperature(float celsius) {
  if (celsius < TEMP_CRITICAL_LOW_C) return TEMP_CRITICAL_COLD;
  if (celsius > TEMP_CRITICAL_HIGH_C) return TEMP_CRITICAL_HOT;
  if (celsius > TEMP_WARNING_HIGH_C) return TEMP_WARNING_HOT;
  return TEMP_NORMAL;
}

TemperatureReading temperatureGet() {
  TemperatureReading r;

  if (overrideActive) {
    r.available = true;
    r.celsius = overrideCelsius;
    r.status = classifyTemperature(overrideCelsius);
    r.simulated = true;
    r.ageMillis = 0;
    return r;
  }

  if (chipKind == CHIP_NONE || !haveReading) {
    r.available = false;
    r.celsius = 0.0f;
    r.status = TEMP_UNAVAILABLE;
    r.simulated = false;
    r.ageMillis = 0;
    return r;
  }

  r.available = true;
  r.celsius = lastCelsius;
  r.status = classifyTemperature(lastCelsius);
  r.simulated = false;
  r.ageMillis = millis() - lastSampleMillis;
  return r;
}

const char* temperatureStatusName(TemperatureStatus status) {
  switch (status) {
    case TEMP_UNAVAILABLE:    return "unavailable";
    case TEMP_CRITICAL_COLD:  return "critical_cold";
    case TEMP_NORMAL:         return "normal";
    case TEMP_WARNING_HOT:    return "warning_hot";
    case TEMP_CRITICAL_HOT:   return "critical_hot";
  }
  return "unknown";
}

const char* temperatureChipName() {
  switch (chipKind) {
    case CHIP_BME280: return "BME280";
    case CHIP_BMP280: return "BMP280";
    default:          return "none";
  }
}

uint8_t temperatureAddress() { return chipAddress; }
bool temperatureSensorPresent() { return chipKind != CHIP_NONE; }

void temperatureSetOverride(float celsius) {
  overrideActive = true;
  overrideCelsius = celsius;
}

void temperatureClearOverride() { overrideActive = false; }
bool temperatureOverrideActive() { return overrideActive; }
