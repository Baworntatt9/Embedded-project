#include <WebServer.h>
#include <WiFi.h>
#include <esp32cam.h>

const char *WIFI_SSID = "iPhone";     // ใส่ WiFi SSID
const char *WIFI_PASS = "0972498020"; // ใส่ WiFi password

WebServer server(80);

// --- ใช้ความละเอียด 800x600 (SVGA) ---
static auto streamRes = esp32cam::Resolution::find(800, 600);

// ---------------- stream MJPEG ----------------
void handleStream() {
    Serial.println("Client connected -> /stream");

    WiFiClient client = server.client();

    client.print("HTTP/1.1 200 OK\r\n"
                 "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n"
                 "Connection: close\r\n\r\n");

    esp32cam::Camera.changeResolution(streamRes);

    while (client.connected()) {
        auto frame = esp32cam::capture();
        if (!frame) {
            Serial.println("CAPTURE FAIL");
            continue;
        }

        client.printf("--frame\r\n"
                      "Content-Type: image/jpeg\r\n"
                      "Content-Length: %d\r\n\r\n",
                      frame->size());

        frame->writeTo(client); // ส่งข้อมูลภาพ
        client.print("\r\n");

        delay(30);
    }

    Serial.println("Client disconnected /stream");
}

void setup() {
    Serial.begin(115200);
    Serial.println();

    // ---------- ตั้งค่ากล้อง ----------
    using namespace esp32cam;
    Config cfg;
    cfg.setPins(pins::AiThinker);

    cfg.setResolution(streamRes);

    cfg.setJpeg(12);

    cfg.setBufferCount(2);

    bool ok = Camera.begin(cfg);
    Serial.println(ok ? "CAMERA OK" : "CAMERA FAIL");

    if (!ok) {
        Serial.println("ลองลดความละเอียด หรือเพิ่มค่า cfg.setJpeg() ดู");
    }

    // ---------- ต่อ WiFi ----------
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    Serial.print("Connecting WiFi ");
    while (WiFi.status() != WL_CONNECTED) {
        delay(300);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected!");

    // IP address
    Serial.print("Stream URL: http://");
    Serial.print(WiFi.localIP());
    Serial.println("/stream");

    // ---------- map URL ----------
    server.on("/stream", handleStream);

    server.begin();
}

void loop() { server.handleClient(); }
