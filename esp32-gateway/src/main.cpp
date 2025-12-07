#include <ArduinoJson.h>
#include <ESP_Mail_Client.h> // <--- เพิ่ม Library กลับมา
#include <HTTPClient.h>
#include <Stepper.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wpa2.h>

// ======================= CONFIGURATION =======================

// --- 1. WiFi Selection ---
// #define USE_WIFI_ENTERPRISE // <--- Uncomment ถ้าใช้เน็ตมหาลัย / Comment ออกถ้าใช้
// Hotspot

// --- 2. WiFi Credentials ---
#define WIFI_SSID_HOME "Baworntatt"
#define WIFI_PASS_HOME "1234567890"

#define WIFI_SSID_ENT "ChulaWiFi"
#define EAP_IDENTITY "6733201121"
#define EAP_USERNAME "6733201121"
#define EAP_PASSWORD "7J423aV7"

// --- 3. Cloud Config ---
#define SERVER_URL "http://192.168.224.59:3000/api/"
#define THINGSPEAK_API_KEY "2HUCH7858YED299G"

// --- 4. Email Config (Gmail) ---
#define SMTP_HOST "smtp.gmail.com"
#define SMTP_PORT 465
#define AUTHOR_EMAIL "poorinut.frame2547@gmail.com" // <--- แก้เมล์คนส่ง
#define AUTHOR_PASSWORD                                                        \
    "cuol pnez sdtk ncur" // <--- แก้รหัส 16 หลัก (App Password)
#define RECIPIENT_EMAIL "poorinut.frame2547@gmail.com" // <--- แก้เมล์คนรับ

// --- 5. Pins ---
#define PIN_LED_BUILTIN 2
#define PIN_BUZZER 4
#define IN1 19
#define IN2 18
#define IN3 5
#define IN4 17

// =============================================================

// --- Global Variables & Objects ---
const int STEPS_PER_REV = 2048;
Stepper myStepper(STEPS_PER_REV, IN1, IN3, IN2, IN4);

// Sensor data struct
typedef struct SensorData {
    float distance;
    int lightVal;
    int hallState;
    int micState;
    float temperature;
    float humidity;
};

// Cloud command struct
typedef struct CommandData {
    int type;
    int value;
};

// ตัวแปรสำหรับ Main Loop (Hardware Control)
SensorData currentData;
volatile bool newDataAvailable = false;
bool isLocked = false;

// Config Thresholds
const int LIGHT_THRESHOLD = 150;
const int DIST_THRESHOLD = 50;

// Email Management
SMTPSession smtp;
volatile bool shouldSendEmail =
    false; // Flag สั่งให้ Core 0 ส่งเมล (volatile เพื่อความปลอดภัยข้าม Task)

// --- FreeRTOS Handles ---
QueueHandle_t cloudQueue; // "ท่อ" ส่งข้อมูลจาก Core 1 ไป Core 0
QueueHandle_t commandQueue;
TaskHandle_t TaskCloudHandle;

// ======================= HELPER FUNCTIONS =======================

void stopStepperPower() {
    digitalWrite(IN1, LOW);
    digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);
    digitalWrite(IN4, LOW);
}

void lockDoor() {
    if (!isLocked) { // เช็คก่อนว่ายังไม่ได้ล็อก
        Serial.println("[Action] Locking Door...");
        myStepper.step(-STEPS_PER_REV / 4); // หมุนทวนเข็ม 90 องศา
        stopStepperPower();
        isLocked = true;
    } else {
        Serial.println("Already locked");
    }
}

void unlockDoor() {
    if (isLocked) { // เช็คก่อนว่าล็อกอยู่จริงไหม
        Serial.println("[Action] Unlocking Door...");
        myStepper.step(STEPS_PER_REV / 4); // หมุนตามเข็ม 90 องศา
        stopStepperPower();
        isLocked = false;
    } else {
        Serial.println("Already unlocked");
    }
}

void playBuzzerAlarm() {
    // Buzzer ดังติ๊ดๆ (สั้นๆ ไม่บล็อกนานเกินไป)
    for (int i = 0; i < 2; i++) {
        digitalWrite(PIN_BUZZER, HIGH);
        delay(100);
        digitalWrite(PIN_BUZZER, LOW);
        delay(100);
    }
}

// ฟังก์ชันเชื่อมต่อ WiFi (รองรับทั้ง 2 โหมด)
void connectWiFi() {
    WiFi.disconnect(true);
    WiFi.mode(WIFI_STA);

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

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WiFi] Connected!");
        Serial.print("IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("Channel: ");
        Serial.println(WiFi.channel());
    } else {
        Serial.println("\n[WiFi] Connect Failed");
    }
}

// ฟังก์ชัน Callback สำหรับ Email Status
void smtpCallback(SMTP_Status status) {
    if (status.success())
        Serial.println("[Email] Sent OK!");
}

// ======================= ESP-NOW CALLBACK =======================
// ทำงานที่ Core 1 (Trigger โดย Interrupt)
void OnDataRecv(const uint8_t *mac, const uint8_t *incomingDataPtr, int len) {
    SensorData temp;
    memcpy(&temp, incomingDataPtr, sizeof(temp));

    // 1. อัปเดตข้อมูลให้ Loop หลัก (เพื่อคุมมอเตอร์)
    memcpy(&currentData, &temp, sizeof(currentData));
    newDataAvailable = true;

    // 2. โยนใส่ Queue ส่งไปให้ Core 0 (เพื่อส่ง Cloud)
    xQueueSend(cloudQueue, &temp, 0);
}

// ======================= TASKS (FreeRTOS) =======================

// --- Task 2: Cloud & Network (รันบน Core 0) ---
// รับผิดชอบงานช้าๆ: WiFi, Firebase, ThingSpeak, Email
void CloudTask(void *parameter) {
    SensorData dataToSend;

    // Timers
    unsigned long lastCheckCommand = 0;
    unsigned long lastThingSpeak = 0;
    unsigned long lastFirebase = 0;
    unsigned long lastEmail = 0;

    // เชื่อมต่อ WiFi ครั้งแรกที่นี่
    connectWiFi();

    // ตั้งค่า Callback Email
    smtp.callback(smtpCallback);

    for (;;) { // Infinite Loop (ทำงานตลอดเวลาขนานกับ loop หลัก)

        // 1. เช็ค WiFi ถ้าหลุดให้ต่อใหม่
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[Task] WiFi lost, reconnecting...");
            connectWiFi();
            vTaskDelay(pdMS_TO_TICKS(5000)); // รอ 5 วิค่อยทำต่อ
            continue;
        }

        unsigned long now = millis();

        // 1: เช็คคำสั่งจาก Cloud (Polling)
        if (now - lastCheckCommand > 2000) {
            HTTPClient http;
            String url = SERVER_URL;
            url += "sensor";
            http.begin(url);
            int httpCode = http.GET();
            if (httpCode > 0) {
                String payload = http.getString();

                // Serial.print("[Debug] Payload: ");
                // Serial.println(payload);

                StaticJsonDocument<512> doc;
                DeserializationError error = deserializeJson(doc, payload);

                if (!error) {
                    CommandData cmdData;

                    // เช็คก่อนว่ามี key นี้ส่งมาจริงไหม (กัน Error)
                    if (doc.containsKey("controlDoor")) {
                        cmdData.type = 0;
                        cmdData.value = doc["controlDoor"] ? 1 : 0;
                        xQueueSend(commandQueue, &cmdData, 0);
                    }
                } else {
                    Serial.print("[Cloud] JSON Error: ");
                    Serial.println(error.c_str());
                }
            }
            http.end();
            lastCheckCommand = now;
        }

        // 2. อ่านข้อมูลจาก Queue (เพื่อส่ง Firebase/ThingSpeak)
        if (xQueueReceive(cloudQueue, &dataToSend, pdMS_TO_TICKS(100)) ==
            pdTRUE) {
            // --- ส่ง Firebase (Local Server) ทุก 5 วิ ---
            if (now - lastFirebase > 5000) {
                HTTPClient http;
                String url = SERVER_URL;
                url += "sensor";
                http.begin(url);
                http.addHeader("Content-Type", "application/json");

                StaticJsonDocument<200> doc;
                doc["doorStatus"] = (dataToSend.hallState == HIGH); // High=Open
                doc["humidity"] = dataToSend.humidity;
                doc["light"] = dataToSend.lightVal;
                doc["temperature"] = dataToSend.temperature;

                String jsonStr;
                serializeJson(doc, jsonStr);
                int code = http.PUT(jsonStr); // Uncomment เมื่อพร้อมส่ง
                if (code > 0)
                    Serial.printf("[Firebase] Sent: %d\n", code);
                http.end();

                lastFirebase = now;
            }

            // --- ส่ง ThingSpeak ทุก 20 วิ ---
            if (now - lastThingSpeak > 20000) {
                HTTPClient http;

                // String variable
                String sTemp = String(dataToSend.temperature);
                String sHum = String(dataToSend.humidity);
                String sLight = String(dataToSend.lightVal);
                String sDoorStatus = (dataToSend.hallState == HIGH) ? "1" : "0";

                // สร้าง URL Query String
                String url = "http://api.thingspeak.com/update?api_key=";
                url += THINGSPEAK_API_KEY;

                // ใส่ข้อมูลลงแต่ละ Field (ต้องตรงกับที่ตั้งในเว็บ)
                url += "&field1=";
                url += sTemp;
                url += "&field2=";
                url += sHum;
                url += "&field3=";
                url += sLight;
                url += "&field4=";
                url += sDoorStatus;

                http.begin(url);
                int code = http.GET();
                if (code > 0)
                    Serial.printf("[ThingSpeak] Sent: %d\n", code);
                http.end();

                lastThingSpeak = now;
            }
        }

        // --- C. ส่ง Email (ตรวจสอบ Flag ที่ถูกสั่งมาจาก Core 1) ---
        // เงื่อนไข: ถูกสั่ง (Flag=true) AND พ้นช่วง Cooldown 1 นาทีแล้ว
        if (shouldSendEmail && (millis() - lastEmail > 60000)) {

            ESP_Mail_Session session;
            session.server.host_name = SMTP_HOST;
            session.server.port = SMTP_PORT;
            session.login.email = AUTHOR_EMAIL;
            session.login.password = AUTHOR_PASSWORD;
            session.login.user_domain = "";

            SMTP_Message message;
            message.sender.name = "ESP32 Security";
            message.sender.email = AUTHOR_EMAIL;
            message.subject = "⚠️ Alert: Intruder Detected!";
            message.addRecipient("User", RECIPIENT_EMAIL);
            message.text.content =
                "Warning: Door opened or loud noise detected!";

            Serial.println("[Email] Sending... (Core 0)");
            // คำสั่ง connect และ sendMail ใช้เวลา 3-5 วินาที
            // แต่เพราะมันอยู่บน Core 0 -> Core 1 (มอเตอร์) จะยังหมุนได้ปกติ!
            if (smtp.connect(&session)) {
                MailClient.sendMail(&smtp, &message);
            }

            shouldSendEmail = false; // รีเซ็ตธง
            lastEmail = millis();    // เริ่มนับ Cooldown ใหม่
        }

        // พัก Task นิดหน่อย
        vTaskDelay(pdMS_TO_TICKS(50));
    }
}

// ======================= MAIN SETUP & LOOP =======================

void setup() {
    Serial.begin(115200);

    // Setup Pins
    pinMode(PIN_LED_BUILTIN, OUTPUT);
    pinMode(PIN_BUZZER, OUTPUT);
    myStepper.setSpeed(10); // 10 RPM

    // 1. สร้าง Queue เพื่อส่งข้อมูลข้าม Core
    cloudQueue = xQueueCreate(10, sizeof(SensorData));
    commandQueue = xQueueCreate(10, sizeof(CommandData));

    // 2. สร้าง Task Cloud ให้ไปวิ่งที่ Core 0
    xTaskCreatePinnedToCore(
        CloudTask,        // ฟังก์ชัน
        "CloudTask",      // ชื่อ Task
        10000,            // Stack Size (10KB สำหรับ Email/SSL ถือว่ากำลังดี)
        NULL,             // Params
        1,                // Priority
        &TaskCloudHandle, // Handle
        0                 // *** ระบุ Core 0 ***
    );

    // 3. เริ่ม ESP-NOW (จะวิ่งที่ Core 1 ตาม Default ของ Arduino)
    WiFi.mode(WIFI_STA);
    if (esp_now_init() != ESP_OK) {
        Serial.println("Error initializing ESP-NOW");
        return;
    }
    esp_now_register_recv_cb(esp_now_recv_cb_t(OnDataRecv));

    Serial.println("System Ready: Dual Core Running...");
}

void loop() {
    // --- Core 1: พื้นที่ศักดิ์สิทธิ์ ห้ามมี Delay ยาวๆ ---
    // ทำงานเกี่ยวกับ Hardware: Motor, Sensor Logic, Buzzer
    CommandData receivedCmd;

    if (xQueueReceive(commandQueue, &receivedCmd, 0) == pdTRUE) {

        // แยกแยะว่าคำสั่งนี้ของใคร
        switch (receivedCmd.type) {

        case 0: // --- สั่งประตู ---
            if (receivedCmd.value == 1) {
                lockDoor();
            } else {
                unlockDoor();
            }
            break;
        }
    }

    if (newDataAvailable) {
        bool isNear = (currentData.distance < DIST_THRESHOLD);
        bool isLoud = (currentData.micState == 1);
        bool isDark = (currentData.lightVal > LIGHT_THRESHOLD);
        bool isDoorOpen = (currentData.hallState == HIGH);

        // --- Logic 1: Intruder Alert ---
        if ((isDoorOpen && isDark) || isLoud) {
            playBuzzerAlarm(); // Buzzer

            // สั่งให้ Core 0 ส่งเมล (แค่ยกธง shouldSendEmail = true)
            // การยกธงใช้เวลาแค่ 0.00001 วินาที ดังนั้น Loop นี้จะไม่สะดุด
            shouldSendEmail = true;
        }

        // --- Logic 2: Auto Lock/Unlock Door ---
        // (Stepper ทำงานตรงนี้ได้เลย ลื่นๆ)
        // if (isDark && isNear) {
        //   if (!isLocked) {
        //     Serial.println("[Auto] Locking...");
        //     myStepper.step(STEPS_PER_REV / 4);
        //     stopStepperPower();
        //     isLocked = true;
        //   }
        //   digitalWrite(PIN_LED_BUILTIN, HIGH);
        // } else {
        //   if (!isDark && isLocked) {
        //      Serial.println("[Auto] Unlocking...");
        //      myStepper.step(-STEPS_PER_REV / 4);
        //      stopStepperPower();
        //      isLocked = false;
        //   }
        //   digitalWrite(PIN_LED_BUILTIN, LOW);
        // }

        newDataAvailable = false; // เคลียร์สถานะ
    }

    delay(10); // Delay สั้นๆ เพื่อให้ Watchdog ไม่ดุ
}