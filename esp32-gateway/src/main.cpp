#include <ArduinoJson.h>
#include <ESP_Mail_Client.h> // <--- เพิ่ม Library กลับมา
#include <HTTPClient.h>
#include <Stepper.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wpa2.h>
#include "secrets.h"

// ================================================================
// 1. CONFIGURATION & PIN DEFINITIONS
// ================================================================

// --- Pins ---
#define PIN_LED_BUILTIN 2
#define PIN_BUZZER 4
#define IN1 19
#define IN2 18
#define IN3 5
#define IN4 17

// --- Thresholds ---
const int LIGHT_THRESHOLD = 150; 
const int DIST_THRESHOLD  = 50; 
const int STEPS_PER_REV   = 2048;

// --- Timing ---
const unsigned long POLLING_INTERVAL    = 2000;  // เช็คคำสั่งทุก 2 วิ
const unsigned long UPLOAD_INTERVAL     = 5000;  // ส่ง Firebase ทุก 5 วิ
const unsigned long THINGSPEAK_INTERVAL = 20000; // ส่ง ThingSpeak ทุก 20 วิ
const unsigned long BUZZER_DURATION     = 3000;  // เสียงดัง 3 วิ

// --- Email Config (Gmail) ---

#define RECIPIENT_EMAIL    "khanes96.bb@gmail.com"

// ================================================================
// 2. DATA STRUCTURES & GLOBALS
// ================================================================

typedef struct SensorData {
  int nodeID;
  float distance;
  int lightVal;
  int hallState;
  int micState;
  float temperature;
  float humidity;
} SensorData;

typedef struct CommandData {
  int type; // 0 = Door
  int value;
} CommandData;

// Hardware Objects
Stepper myStepper(STEPS_PER_REV, IN1, IN3, IN2, IN4);
SMTPSession smtp;

// State Variables
SensorData currentData; 
volatile bool newDataAvailable = false;
bool isLocked = false;

// Flags for Core 0
volatile bool shouldSendEmail = false; 
volatile bool shouldUpdateLockStatus = false;

// Buzzer State (Non-blocking)
unsigned long buzzerStartTime = 0;
bool isBuzzerActive = false;

// FreeRTOS Handles
QueueHandle_t cloudQueue; 
QueueHandle_t commandQueue;
TaskHandle_t TaskCloudHandle;
TaskHandle_t TaskEmailHandle;

// Logic variables
bool manualUnlockActive = false;
unsigned long lastUnlockTime = 0;
unsigned long doorClosedTime = 0;
const int RELOCK_DELAY = 15000;
const int AUTO_LOCK_DELAY = 1000;

// ================================================================
// 3. HARDWARE CONTROL (Stepper, Buzzer)
// ================================================================

void stopStepperPower() {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
}

void lockDoor() {
  if (!isLocked) {
    Serial.println("[Action] Locking Door...");
    myStepper.step(-STEPS_PER_REV / 4);
    stopStepperPower(); 
    isLocked = true;
    shouldUpdateLockStatus = true;
  }
}

void unlockDoor() {
  if (isLocked) {
    Serial.println("[Action] Unlocking Door...");
    myStepper.step(STEPS_PER_REV / 4);
    stopStepperPower();
    isLocked = false;
    shouldUpdateLockStatus = true;
  }
}

// เริ่มเสียงเตือน (ไม่บล็อกระบบ)
void startBuzzer() {
  if (!isBuzzerActive) {
    digitalWrite(PIN_BUZZER, HIGH);
    buzzerStartTime = millis();
    isBuzzerActive = true;
  }
}

// ตรวจสอบเวลาเพื่อปิดเสียง (ใส่ใน Loop)
void handleBuzzer() {
  if (isBuzzerActive) {
    if (millis() - buzzerStartTime >= BUZZER_DURATION) {
      digitalWrite(PIN_BUZZER, LOW);
      isBuzzerActive = false;
    }
  }
}

// ================================================================
// 4. NETWORK & HTTP HELPERS
// ================================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("[WiFi] Reconnecting...");

#ifdef USE_WIFI_ENTERPRISE
    Serial.println("[WiFi] Connecting Enterprise...");
    esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)EAP_IDENTITY,
                                       strlen(EAP_IDENTITY));
    esp_wifi_sta_wpa2_ent_set_username((uint8_t *)EAP_USERNAME,
                                       strlen(EAP_USERNAME));
    esp_wifi_sta_wpa2_ent_set_password((uint8_t *)EAP_PASSWORD,
                                       strlen(EAP_PASSWORD));
    esp_wifi_sta_wpa2_ent_enable();
    WiFi.begin(WIFI_SSID_ENT);
#else
    Serial.println("[WiFi] Connecting Hotspot...");
    WiFi.begin(WIFI_SSID_HOME, WIFI_PASS_HOME);
  #endif

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) { // รอ 10 วิ
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println(WiFi.status() == WL_CONNECTED ? "\n[WiFi] Connected" : "\n[WiFi] Failed");
}

// Helper: ส่ง PUT Request ลดโค้ดซ้ำ
void sendPutRequest(String endpoint, String jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = SERVER_URL;
  if (!url.endsWith("/")) url += "/";
  url += endpoint;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int code = http.PUT(jsonPayload);
  if (code > 0) Serial.printf("[Firebase] %s Code: %d\n", endpoint.c_str(), code);
  else Serial.printf("[Firebase] %s Error: %s\n", endpoint.c_str(), http.errorToString(code).c_str());
  
  http.end();
}

// Callback Email
void smtpCallback(SMTP_Status status){
  if (status.success()) Serial.println("[Email] Sent OK!");
}

// Callback ESP-NOW
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingDataPtr, int len) {
  SensorData temp;
  memcpy(&temp, incomingDataPtr, sizeof(temp));
  
  // อัปเดต Core 1
  memcpy(&currentData, &temp, sizeof(currentData));
  newDataAvailable = true;

  Serial.printf("[Gateway] Received from Node ID: %d\n", temp.nodeID);

  // ส่ง Core 0
  xQueueSend(cloudQueue, &temp, 0);
}

// ================================================================
// 5. TASK CORE 0: CLOUD & NETWORK
// ================================================================

void CloudTask(void * parameter) {
  SensorData dataToSend;
  unsigned long lastPoll = 0, lastTS = 0, lastFB = 0, lastEmail = 0;
  static int lastLockValue = -1;

  connectWiFi();
  smtp.callback(smtpCallback);

  for(;;) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[Task] WiFi lost, reconnecting...");
      connectWiFi();
      vTaskDelay(pdMS_TO_TICKS(5000));
      continue;
    }

    unsigned long now = millis();

    // --- 1. Polling Command (GET) ---
    if (now - lastPoll > POLLING_INTERVAL) {
      HTTPClient http;
      String url = SERVER_URL;
      if (!url.endsWith("/")) url += "/";
      http.begin(url += "lock");
      
      if (http.GET() > 0) {
        String payload = http.getString();
        StaticJsonDocument<512> doc;
        if (!deserializeJson(doc, payload)) {
           if (doc.containsKey("controlLockDoor")) {
             int currentLockValue = doc["controlLockDoor"] ? 1 : 0;
             // ส่งเข้า Queue เฉพาะเมื่อค่าเปลี่ยน
             if (currentLockValue != lastLockValue) {
               CommandData cmdData = {0, currentLockValue};
               xQueueSend(commandQueue, &cmdData, 0);
               lastLockValue = currentLockValue;
               Serial.printf("[Cloud] Cmd Changed: %d\n", currentLockValue);
             }
           }
        }
      }
      http.end();
      lastPoll = now;
    }

    // --- 2. Update Lock Status (PUT) ---
    if (shouldUpdateLockStatus) {
       StaticJsonDocument<200> doc;
       doc["lockStatus"] = isLocked ? "Locked" : "Unlocked";
       String json;
       serializeJson(doc, json);
       sendPutRequest("lock", json); // ใช้ Helper function
       shouldUpdateLockStatus = false;
    }

    // --- 3. Upload Sensor Data ---
    // ใช้ while เพื่อเคลียร์ Queue ให้หมด
    while (xQueueReceive(cloudQueue, &dataToSend, 0) == pdTRUE) {
      
      // Firebase (PUT)
      if (now - lastFB > UPLOAD_INTERVAL) {
        StaticJsonDocument<200> doc;
        doc["doorStatus"] = (dataToSend.hallState == LOW);
        doc["humidity"] = dataToSend.humidity;
        doc["light"] = dataToSend.lightVal;
        doc["temperature"] = dataToSend.temperature;
        String json;
        serializeJson(doc, json);
        sendPutRequest("sensor", json); // ใช้ Helper function
        lastFB = now;
      }

      // ThingSpeak (GET)
      if (now - lastTS > THINGSPEAK_INTERVAL) {
        HTTPClient http;

         // String variable
        String sTemp = String(dataToSend.temperature);
        String sHum  = String(dataToSend.humidity);
        String sLight= String(dataToSend.lightVal);
        String sDoorStatus = (dataToSend.hallState == LOW) ? "1" : "0";
        String url = "http://api.thingspeak.com/update?api_key=";
        url += THINGSPEAK_API_KEY;
        url += "&field1="; url += sTemp;
        url += "&field2="; url += sHum;
        url += "&field3="; url += sLight;
        url += "&field4="; url += sDoorStatus;
        http.begin(url);
        int code = http.GET();
        if(code > 0) Serial.printf("[ThingSpeak] Sent: %d\n", code);
        http.end();
        lastTS = now;
      }
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

void EmailTask(void * parameter) {
  // ตั้งค่า NTP Time ครั้งเดียวตอนเริ่ม Task
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");

  struct tm timeinfo;
  Serial.print("Syncing time");
  while(!getLocalTime(&timeinfo)){
    Serial.print(".");
    vTaskDelay(1000);
  }
  Serial.println("\nTime Synced!");

  for(;;) {
    // รอจนกว่าจะมีคำสั่งให้ส่ง (เช็คทุก 1 วินาที)
    if (shouldSendEmail) {
       
       // เช็ค Cooldown ว่าเพิ่งส่งไปหรือเปล่า (กันส่งรัว)
       static unsigned long lastEmailSent = 0;
       if (millis() - lastEmailSent > 60000) { 
          
          Serial.println("[Email Task] Starting sequence...");
          
          ESP_Mail_Session session;
          session.server.host_name = SMTP_HOST;
          session.server.port = SMTP_PORT;
          session.login.email = AUTHOR_EMAIL;
          session.login.password = AUTHOR_PASSWORD;
          session.login.user_domain = "";
          
          // Config Time (Important for Gmail)
          // session.time.ntp_server = "pool.ntp.org,time.nist.gov";
          // session.time.gmt_offset = 7;
          // session.time.day_light_offset = 0;

          SMTP_Message message;
          message.sender.name = "ESP32 Security";
          message.sender.email = AUTHOR_EMAIL;
          message.subject = "⚠️ Alert: Intruder Detected!";
          message.addRecipient("User", RECIPIENT_EMAIL);
          message.text.content = "Warning: Door opened or loud noise detected!";
          
          // เชื่อมต่อและส่ง (ใช้เวลา 3-5 วิ แต่จะไม่บล็อก Task อื่นแล้ว)
          if (smtp.connect(&session)) {
             if (MailClient.sendMail(&smtp, &message)) {
                Serial.println("[Email Task] Sent Successfully!");
             } else {
                Serial.println("[Email Task] Failed");
             }
          }
          
          lastEmailSent = millis();
       }
       
       // รีเซ็ตธงทันที (รับทราบงานแล้ว)
       shouldSendEmail = false; 
    }

    // พักยาวๆ เพื่อไม่ให้กิน CPU
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

// ================================================================
// 6. MAIN SETUP & LOOP (CORE 1)
// ================================================================

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_LED_BUILTIN, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  myStepper.setSpeed(10); 

  // Queues
  cloudQueue = xQueueCreate(20, sizeof(SensorData));
  commandQueue = xQueueCreate(10, sizeof(CommandData));

  // Core 0 Task
  xTaskCreatePinnedToCore(
    CloudTask, 
    "CloudTask", 
    10000, 
    NULL, 
    1, 
    &TaskCloudHandle, 
    0
  );

  xTaskCreatePinnedToCore(
    EmailTask,        // ฟังก์ชัน
    "EmailTask",      // ชื่อ
    20480,            // Stack Size (สำคัญมาก! ห้ามต่ำกว่า 20000)
    NULL, 
    1,                // Priority เท่ากันกับ CloudTask (แบ่งเวลาคนละครึ่ง)
    &TaskEmailHandle, 
    0                 // รันบน Core 0 เหมือนเดิม (จะได้ไม่กวนมอเตอร์ที่ Core 1)
  );

  // WiFi & ESP-NOW
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW Init Error");
    return;
  }
  esp_now_register_recv_cb(esp_now_recv_cb_t(OnDataRecv));

  Serial.println("System Ready.");
}

void loop() {
  // 1. จัดการ Buzzer (Non-blocking)
  handleBuzzer();

  // 2. จัดการคำสั่งจาก Cloud
  CommandData cmd;
  if (xQueueReceive(commandQueue, &cmd, 0) == pdTRUE) {
    if (cmd.type == 0) { // Door Command
       // Logic: สั่ง Lock (1) ต้องแน่ใจว่าประตูปิดอยู่ (hallState == LOW)
       if (cmd.value == 1) {
          if (currentData.hallState == LOW) {
            lockDoor();
            manualUnlockActive = false;
          }
          else Serial.println("Can't lock: Door Open");
       } 
       else {
        unlockDoor();
        manualUnlockActive = true;
        lastUnlockTime = millis();
      }
    }
  }

  // 3. จัดการข้อมูล Sensor
  if (newDataAvailable) {
    bool isLoud     = (currentData.micState == 1);
    bool isDark     = (currentData.lightVal < LIGHT_THRESHOLD); 
    bool isDoorOpen = (currentData.hallState == HIGH);
    bool isNear      = (currentData.distance < DIST_THRESHOLD);

    // --- Auto-Lock ---
    if (isDoorOpen) {
        // ถ้าประตูเปิดอยู่
        manualUnlockActive = false; // ยกเลิกสถานะ Manual (ถือว่าคนเข้าแล้ว)
        doorClosedTime = 0;         // รีเซ็ตเวลาปิดประตู
    } 
    else { 
        // ถ้าประตูปิดอยู่ (Closed) และยังไม่ได้ล็อก (!isLocked)
        if (!isLocked) {
            
            // กรณีที่ 1: เราเพิ่งสั่ง Unlock ผ่านแอป (รอคนเดินเข้า)
            if (manualUnlockActive) {
                if (millis() - lastUnlockTime > RELOCK_DELAY) {
                    Serial.println("[Auto] Timeout! No entry detected -> Re-locking...");
                    lockDoor();
                    manualUnlockActive = false; // จบงาน
                }
            }
            
            // กรณีที่ 2: เพิ่งปิดประตู (คนเข้า/ออกเสร็จแล้ว)
            else {
                if (doorClosedTime == 0) {
                    doorClosedTime = millis();
                }
                
                if (millis() - doorClosedTime > AUTO_LOCK_DELAY) {
                    Serial.println("[Auto] Door Closed -> Auto Locking...");
                    lockDoor();
                }
            }
        }
    }

    // --- LED ---
    if (isNear && isDark) {
      digitalWrite(LED_BUILTIN, HIGH);
    } else {
      digitalWrite(LED_BUILTIN, LOW);
    }

    // Intruder Alert Logic
    if (isLocked && isDoorOpen) {
      Serial.println("🚨 ALERT: Forced Entry Detected!");
      startBuzzer();
      shouldSendEmail = true;
    }

    if (isLoud) {
      Serial.println("🚨 ALERT: Loud Noise Detected!");
      startBuzzer();
      shouldSendEmail = true;
    }
    
    newDataAvailable = false;
  }

  delay(10); 
}