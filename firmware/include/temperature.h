#pragma once

#include <Arduino.h>

// Temperature subsystem.
//
// The sensor sits behind this interface so that changing the hardware is a
// change to temperature.cpp alone. Nothing in main.cpp, the backend or the
// app depends on which chip is fitted.

// Thresholds from the project specification.
//
// Insulin degrades from HEAT, not cold. Freezing destroys it outright, which
// is why the low bound is critical rather than a warning.
//
//   below 2 C   CRITICAL  (freezing)
//   2 to 30 C   NORMAL
//   above 30 C  WARNING
//   above 37 C  CRITICAL
//
// These are instantaneous thresholds. Real degradation depends on cumulative
// exposure; that is out of scope for this prototype and stated as such.
static const float TEMP_CRITICAL_LOW_C = 2.0f;
static const float TEMP_WARNING_HIGH_C = 30.0f;
static const float TEMP_CRITICAL_HIGH_C = 37.0f;

enum TemperatureStatus {
  TEMP_UNAVAILABLE,
  TEMP_CRITICAL_COLD,
  TEMP_NORMAL,
  TEMP_WARNING_HOT,
  TEMP_CRITICAL_HOT
};

struct TemperatureReading {
  bool available;
  float celsius;
  TemperatureStatus status;
  bool simulated;       // true when a test override is supplying the value
  uint32_t ageMillis;   // how long since the sensor was actually read
};

// Scans the I2C bus and initialises whichever supported chip is found.
// Returns false when no sensor answers; the system then reports
// not_available rather than inventing a reading.
bool temperatureBegin(uint8_t sdaPin, uint8_t sclPin);

// Reads the sensor if the sample interval has elapsed, otherwise returns the
// cached value. Safe to call from loop().
void temperatureUpdate();

TemperatureReading temperatureGet();

TemperatureStatus classifyTemperature(float celsius);
const char* temperatureStatusName(TemperatureStatus status);

// Chip and address found at boot, for diagnostics.
const char* temperatureChipName();
uint8_t temperatureAddress();
bool temperatureSensorPresent();

// Test override. Forces a value so the warning and critical paths can be
// demonstrated without heating the sensor. Any reading produced this way is
// flagged simulated everywhere it appears.
void temperatureSetOverride(float celsius);
void temperatureClearOverride();
bool temperatureOverrideActive();
