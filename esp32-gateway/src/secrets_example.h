/**
 * Template for secrets.h
 */

#ifndef SECRETS_H
#define SECRETS_H

// ==========================================
// 1. WiFi Configuration (Home / Hotspot)
// ==========================================
#define WIFI_SSID_HOME     "YOUR_WIFI_NAME"      // WiFi SSID
#define WIFI_PASS_HOME     "YOUR_WIFI_PASSWORD"  // WiFi Password

// ==========================================
// 2. WiFi Enterprise (ChulaWiFi / Eduroam)
// ==========================================
// ถ้าไม่ใช้ ให้ปล่อยว่างไว้ หรือไม่ต้องแก้
#define WIFI_SSID_ENT      "YOUR_WIFI_NAME"      // WiFi SSID
#define EAP_IDENTITY       "YOUR_STUDENT_ID"     // Identity
#define EAP_USERNAME       "YOUR_STUDENT_ID"     // Username
#define EAP_PASSWORD       "YOUR_WIFI_PASS"      // WiFi Password

// ==========================================
// 3. Local Server Configuration (Node.js)
// ==========================================
// เลขท้าย IP เครื่องคอมพิวเตอร์ของคุณ (Server) 
// เช่นถ้าคอมได้ IP xxx.xxx.xxx.59 ให้ใส่ "59"
// (ใช้สำหรับฟังก์ชัน Auto-Detect URL ใน main.cpp)
#define SERVER_IP_SUFFIX   "YOUR_IP_SUFFIX" 

// ==========================================
// 4. Cloud APIs (ThingSpeak)
// ==========================================
#define THINGSPEAK_API_KEY "YOUR_THINGSPEAK_KEY" // Write API Key

// ==========================================
// 5. Email Configuration (Gmail)
// ==========================================
// หมายเหตุ: Gmail ต้องเปิด 2-Step Verification และสร้าง App Password
#define SMTP_HOST          "smtp.gmail.com"
#define SMTP_PORT          465

#define AUTHOR_EMAIL       "sender@gmail.com"    // อีเมลคนส่ง (Bot)
#define AUTHOR_PASSWORD    "xxxx xxxx xxxx xxxx" // รหัส App Password 16 หลัก (ห้ามใช้รหัส Login ปกติ)

#endif