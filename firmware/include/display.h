#pragma once

#include <Arduino.h>
#include "temperature.h"

// Display subsystem.
//
// The display is driven from state rather than written to directly: callers
// hand it what the device currently knows and it renders a whole frame. No
// code path can leave half the screen showing something stale, and adding
// delivery status at stage 8 is a change to one function here.

struct DisplayState {
  const char* deviceState;   // "ready", "connecting", "wifi_failed"
  bool wifiConnected;
  int32_t rssi;
  String ipAddress;
  uint32_t uptimeSeconds;
  TemperatureReading temperature;
};

// Shares the I2C bus already initialised by temperatureBegin. Returns false
// when no display answers; that is not an error and the device carries on.
bool displayBegin();

bool displayPresent();
uint8_t displayAddress();

// Renders only when something visible changed, or after one second, so the
// shared I2C bus is not held up by redraws that show the same thing.
void displayUpdate(const DisplayState& state);

// Shown during boot, before Wi-Fi is up.
void displayBootMessage(const char* line);
