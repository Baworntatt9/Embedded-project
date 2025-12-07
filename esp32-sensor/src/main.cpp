#include <Arduino.h>
#include <esp_now.h>
#include <esp_wifi.h>
#include <WiFi.h>
#include <DHT.h>

// --- Config: MAC Address ของตัวรับ (Gateway) ---
// แก้เป็น MAC ของ Board 2 ของคุณเอง
uint8_t broadcastAddress[] = {0x44, 0x1D, 0x64, 0xFA, 0x0D, 0x44}; 

// --- Structure (ต้องตรงกับตัวรับ) ---
typedef struct struct_message {
  float distance;
  int lightVal;
  int hallState;
  int micState; 
  float temperature;
  float humidity;
} struct_message;

struct_message myData;
esp_now_peer_info_t peerInfo;

// --- Pin Definitions ---
#define PIN_TRIG 5
#define PIN_ECHO 18
#define PIN_HALL 19
#define PIN_DHT 22
#define PIN_PHOTO 32  // Analog Input (ADC1)
#define PIN_MIC_A 35  // Analog Input (ADC1)

#define DHTTYPE DHT11
DHT dht(PIN_DHT, DHTTYPE);

#define WIFI_CHANNEL 1

// --- Settings ---
const int MIC_SAMPLE_WINDOW = 50; // ms
const int MIC_THRESHOLD = 2000;   // ปรับค่าความไวเสียงตรงนี้

// --- Functions ---

// ฟังก์ชันอ่านความดังเสียง (Analog)
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
  return signalMax - signalMin; // Peak-to-Peak
}

float getDistance() {
  digitalWrite(PIN_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long duration = pulseIn(PIN_ECHO, HIGH);
  return duration * 0.034 / 2;
}

// Callback เมื่อส่งเสร็จ (บอกสถานะการส่ง)
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("[ESP-NOW] Send Status: ");
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("Success (Gateway received)");
  } else {
    Serial.println("FAIL (Gateway not found or busy)");
  }
}

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_HALL, INPUT_PULLUP);
  
  dht.begin();
  WiFi.mode(WIFI_STA);

  esp_wifi_set_promiscuous(true);
  esp_wifi_set_channel(WIFI_CHANNEL, WIFI_SECOND_CHAN_NONE);
  esp_wifi_set_promiscuous(false);
  
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  esp_now_register_send_cb(OnDataSent);
  
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;  
  peerInfo.encrypt = false;
  
  if (esp_now_add_peer(&peerInfo) != ESP_OK){
    Serial.println("Failed to add peer");
    return;
  }
  
  Serial.println("Sensor Node Started...");
}

void loop() {
  Serial.println("\n--- 1. Reading Sensors ---");

  // 1. อ่านค่า Ultrasonic
  myData.distance = getDistance();
  Serial.print("Distance: "); Serial.print(myData.distance); Serial.println(" cm");

  // 2. อ่านค่าแสง (LDR)
  myData.lightVal = analogRead(PIN_PHOTO);
  Serial.print("Light Raw: "); Serial.println(myData.lightVal);

  // 3. อ่านค่า Hall Sensor (Magnetic)
  myData.hallState = digitalRead(PIN_HALL);
  Serial.print("Hall State: "); 
  Serial.println(myData.hallState == HIGH ? "HIGH (No Magnet)" : "LOW (Magnet Detected)");

  // 4. อ่านค่า Mic (Analog Process)
  int loudness = getSoundLoudness();
  Serial.print("Mic Loudness: "); Serial.print(loudness);
  if (loudness > MIC_THRESHOLD) {
    myData.micState = 1;
    Serial.println(" -> Status: LOUD");
  } else {
    myData.micState = 0;
    Serial.println(" -> Status: Quiet");
  }

  // 5. อ่านค่า DHT
  myData.temperature = dht.readTemperature();
  myData.humidity = dht.readHumidity();
  // กันค่า Error
  if (isnan(myData.temperature)) myData.temperature = 0.0;
  if (isnan(myData.humidity)) myData.humidity = 0.0;
  
  Serial.print("Temp: "); Serial.print(myData.temperature); Serial.println(" C");
  Serial.print("Hum: "); Serial.print(myData.humidity); Serial.println(" %");

  // --- ส่งข้อมูล ---
  Serial.println("--- 2. Sending Data via ESP-NOW ---");
  esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

  if (result == ESP_OK) {
    Serial.println("Command Sent.");
  } else {
    Serial.println("Error Sending Command.");
  }
  
  delay(1000); // หน่วงเวลา 1 วินาที เพื่อให้อ่าน Serial Monitor ทัน
}