#include <Arduino.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <WiFi.h>
#include <DHT.h>

// ======================= CONFIGURATION =======================

// Gateway MAC Address
uint8_t broadcastAddress[] = {0x44, 0x1D, 0x64, 0xFA, 0x0D, 0x44}; 

// WiFi Channel
#define WIFI_CHANNEL 6

int simulatedNodeID = 1; 
const int TOTAL_NODES = 5; // สมมติว่าเรามี 5 เครื่อง

// Pin Definitions
#define PIN_TRIG    5
#define PIN_ECHO    18
#define PIN_HALL    19
#define PIN_DHT     22
#define PIN_PHOTO   32  // Analog
#define PIN_MIC_A   35  // Analog

// Sensor Settings
#define DHTTYPE DHT11
const int MIC_SAMPLE_WINDOW = 50; // ms
const int MIC_THRESHOLD = 1000;   // ปรับความไวเสียง

// =============================================================

// --- Structures & Objects ---
typedef struct struct_message {
  int nodeID;
  float distance;
  int lightVal;
  int hallState;
  int micState; 
  float temperature;
  float humidity;
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;
DHT dht(PIN_DHT, DHTTYPE);

// ======================= HELPER FUNCTIONS =======================

// อ่านค่าเสียง (Peak-to-Peak)
int getSoundLoudness() {
  unsigned long startMillis = millis();
  unsigned int signalMax = 0;
  unsigned int signalMin = 4095;
  
  while (millis() - startMillis < MIC_SAMPLE_WINDOW) {
    int sample = analogRead(PIN_MIC_A);
    if (sample < 0 || sample > 4095) continue;
    if (sample > signalMax) signalMax = sample;
    if (sample < signalMin) signalMin = sample;
  }
  return signalMax - signalMin; 
}

// อ่านค่าระยะทาง (Ultrasonic)
float getDistance() {
  digitalWrite(PIN_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH);
  return duration * 0.034 / 2;
}

// Callback send status
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("[ESP-NOW] Send Status: ");
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("Success (Gateway received) ✅");
  } else {
    Serial.println("FAIL (Gateway not found/Channel mismatch) ❌");
  }
}

// ======================= SETUP =======================

void setup() {
  Serial.begin(115200);

  // Init Pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_HALL, INPUT_PULLUP);
  
  // Init Sensors
  dht.begin();

  // --- WiFi Setup (Force Channel) ---
  WiFi.mode(WIFI_STA);
  
  esp_wifi_set_promiscuous(true);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous(false);

  Serial.print("Sensor Node Initialized on Channel: ");
  Serial.println(WIFI_CHANNEL);

  // --- ESP-NOW Init ---
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_send_cb(OnDataSent);

  // --- Register Peer ---
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = WIFI_CHANNEL;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }
}

// ======================= LOOP =======================

void loop() {
  Serial.println("\n--- Reading Sensors ---");

  myData.distance = getDistance();
  myData.lightVal = analogRead(PIN_PHOTO);
  myData.hallState = digitalRead(PIN_HALL);
  int loudness = getSoundLoudness();
  myData.micState = (loudness > MIC_THRESHOLD) ? 1 : 0;
  myData.temperature = dht.readTemperature();
  myData.humidity = dht.readHumidity();
  
  // Handle NaN (Error reading)
  if (isnan(myData.temperature)) myData.temperature = 0.0;
  if (isnan(myData.humidity)) myData.humidity = 0.0;

  myData.nodeID = simulatedNodeID;

  // Debug Prints
  Serial.printf("Sent Data as Node: %d\n", simulatedNodeID);
  Serial.printf("Dist: %.1f cm | Light: %d | Hall: %d | Mic: %d %d\n", 
                myData.distance, myData.lightVal, myData.hallState, loudness, myData.micState);
  Serial.printf("Temp: %.1f C | Hum: %.1f %%\n", myData.temperature, myData.humidity);

  // Send Data
  esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

  simulatedNodeID++;
  if (simulatedNodeID > TOTAL_NODES) {
    simulatedNodeID = 1;
  }
  
  if (result != ESP_OK) {
    Serial.println("Error sending data");
  }

  delay(1000);
}