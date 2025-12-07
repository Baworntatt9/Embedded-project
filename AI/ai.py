import cv2
from ultralytics import YOLO

# firebase
import firebase_admin
from firebase_admin import credentials, storage
from datetime import datetime, timezone
import tempfile
import os
import subprocess
from pathlib import Path

# สำหรับเว็บ live stream
from flask import Flask, Response
import threading
import time

# =========================
# 1) Firebase init
# =========================
cred = credentials.Certificate(
    r"C:\Users\boonf\Desktop\Cedt year 2 term 1\Embedded System\Project\Frontend_Backend\embedded\ai\serviceAccount.json"
)

firebase_admin.initialize_app(
    cred,
    {"storageBucket": "embedded-1a2f1.firebasestorage.app"},
)

bucket = storage.bucket()

print("[INFO] Firebase initialized")

# =========================
# 2) Config กล้อง + YOLO
# =========================
ESP32_URL = "http://172.20.10.4/stream"  # IP กล้อง (MJPEG)
FRAME_WIDTH = 416
FRAME_HEIGHT = 320

FPS_EST = 10  # ประมาณการ FPS (ใช้กำหนดจำนวนเฟรมที่จะอัด)
RECORD_SECONDS = 5
FRAMES_TO_RECORD = FPS_EST * RECORD_SECONDS
COOLDOWN_SECONDS = 10  # หลัง detect แล้วจะพักไม่ตรวจซ้ำช่วงนี้

model = YOLO("yolov8n.pt")

cap = None  # จะเปิดในฟังก์ชัน open_capture()

latest_frame = None
frame_lock = threading.Lock()

recording = False
frames_left_to_record = 0
video_writer = None
current_video_local_path = None
current_event_id = None
last_detect_time = None

fourcc = cv2.VideoWriter_fourcc(*"XVID")


# =========================
# 3) ฟังก์ชันเปิดกล้อง + retry
# =========================
def open_capture():
    """
    พยายามเชื่อมต่อ ESP32-CAM ใหม่ (วน retry จนกว่าจะสำเร็จ)
    """
    global cap

    # ปิดของเก่าถ้ามี
    if cap is not None:
        try:
            cap.release()
        except Exception:
            pass
        cap = None

    while True:
        print("[CAP] trying to connect to ESP32...", ESP32_URL)
        cap = cv2.VideoCapture(ESP32_URL)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if cap.isOpened():
            print("[CAP] connected to ESP32!")
            return
        else:
            print("[CAP] failed to open. retry in 3s...")
            try:
                cap.release()
            except Exception:
                pass
            cap = None
            time.sleep(3)


# =========================
# 4) Helper: แปลง video เป็น H.264 MP4
# =========================
def convert_to_h264_mp4(input_path: str) -> str:
    input_path = os.path.abspath(input_path)
    in_name = Path(input_path).stem
    out_path = os.path.join(tempfile.gettempdir(), f"{in_name}_h264.mp4")

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        input_path,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "28",
        "-an",
        out_path,
    ]
    print("[FFMPEG]", " ".join(cmd))
    subprocess.run(cmd, check=True)
    return out_path


# =========================
# 5) Firebase upload helpers
# =========================
def upload_image_to_firebase(frame, event_id: str, people_count: int):
    filename = f"{event_id}_image.jpg"
    tmp_path = os.path.join(tempfile.gettempdir(), filename)
    cv2.imwrite(tmp_path, frame)

    blob = bucket.blob(f"DetectMotionLogs/images/{filename}")
    blob.upload_from_filename(tmp_path)
    blob.make_public()
    print("[IMG] Uploaded:", blob.public_url)
    return blob.public_url


def upload_video_to_firebase(video_path: str, event_id: str):
    if not os.path.exists(video_path):
        print("[ERR] video file not found:", video_path)
        return ""

    try:
        h264_path = convert_to_h264_mp4(video_path)
    except Exception as e:
        print("[ERR] ffmpeg convert failed:", e)
        return ""

    blob = bucket.blob(f"DetectMotionLogs/videos/{event_id}_video.mp4")
    blob.upload_from_filename(h264_path)
    blob.make_public()

    print("[VID] Uploaded:", blob.public_url)
    return blob.public_url


# =========================
# 6) YOLO + Record + Firebase + Update latest_frame
# =========================
def processing_loop():
    global latest_frame
    global recording, frames_left_to_record, video_writer
    global current_video_local_path, current_event_id, last_detect_time
    global cap

    # เปิดกล้องครั้งแรก
    open_capture()

    fail_count = 0  # นับจำนวนเฟรมที่อ่านไม่ได้ติดกัน

    while True:
        # ---------------- อ่านเฟรมจาก ESP32 ----------------
        ret, frame = cap.read()
        if not ret or frame is None:
            fail_count += 1
            print(f"[CAP] อ่านภาพจาก ESP32 ไม่ได้ (count={fail_count})")

            # ถ้าอ่านไม่ได้หลายครั้งติดกัน -> ลอง reconnect ใหม่
            if fail_count >= 30:
                print("[CAP] too many failures, reconnecting...")
                open_capture()
                fail_count = 0

            time.sleep(0.1)
            continue

        # ถ้าอ่านได้ รีเซ็ตเคาน์เตอร์
        fail_count = 0

        frame = cv2.resize(frame, (FRAME_WIDTH, FRAME_HEIGHT))

        # ---------------- Recording ----------------
        if recording and video_writer is not None:
            video_writer.write(frame)
            frames_left_to_record -= 1
            if frames_left_to_record <= 0:
                print("[REC] stop recording")
                recording = False
                video_writer.release()
                video_writer = None

                if current_video_local_path and current_event_id:
                    upload_video_to_firebase(current_video_local_path, current_event_id)
                    current_video_local_path = None
                    current_event_id = None

        # ---------------- Cooldown ----------------
        now = datetime.now(timezone.utc)
        if (
            last_detect_time
            and (now - last_detect_time).total_seconds() < COOLDOWN_SECONDS
        ):
            with frame_lock:
                latest_frame = frame.copy()

            cv2.imshow("YOLO + ESP32-CAM", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
            continue

        # ---------------- YOLO detect ----------------
        results = model(frame, imgsz=FRAME_WIDTH, verbose=False)[0]
        people_count = 0

        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # class 0 = person
            if cls_id == 0 and conf > 0.5:
                people_count += 1
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(
                    frame,
                    f"person {conf:.2f}",
                    (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 0),
                    2,
                )

        # ---------------- Detected ----------------
        if people_count > 0 and not recording:
            print(f"[DETECT] found {people_count} person(s)")

            event_id = datetime.now(timezone.utc).strftime("evt_%Y%m%d_%H%M%S")
            current_event_id = event_id
            last_detect_time = now

            # รูป snapshot
            upload_image_to_firebase(frame, event_id, people_count)

            # เตรียมไฟล์ video (AVI) สำหรับอัด
            current_video_local_path = os.path.join(
                tempfile.gettempdir(), f"{event_id}_video.avi"
            )
            video_writer = cv2.VideoWriter(
                current_video_local_path,
                fourcc,
                FPS_EST,
                (FRAME_WIDTH, FRAME_HEIGHT),
            )

            if video_writer.isOpened():
                frames_left_to_record = FRAMES_TO_RECORD
                recording = True
                print("[REC] start recording:", current_video_local_path)
            else:
                print("[REC] cannot open VideoWriter")

        # ---------------- Update latest_frame ----------------
        with frame_lock:
            latest_frame = frame.copy()

        # ---------------- Show local window ----------------
        cv2.imshow("YOLO + ESP32-CAM", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    # ออกจาก loop
    if cap is not None:
        cap.release()
    cv2.destroyAllWindows()


# =========================
# 7) Flask live stream
# =========================
app = Flask(__name__)


def gen_frames():
    while True:
        with frame_lock:
            frame = latest_frame.copy() if latest_frame is not None else None

        if frame is None:
            time.sleep(0.05)
            continue

        ret, buffer = cv2.imencode(".jpg", frame)
        if not ret:
            continue

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
        )


@app.route("/video_feed")
def video_feed():
    return Response(
        gen_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


# =========================
# 8) Main
# =========================
if __name__ == "__main__":
    t_proc = threading.Thread(target=processing_loop, daemon=True)
    t_proc.start()

    # Flask live stream
    app.run(host="0.0.0.0", port=5000)
