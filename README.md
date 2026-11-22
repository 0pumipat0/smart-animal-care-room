# Smart Animal Care Room

> **โครงงาน IoT ---
> ระบบตรวจสอบสภาพแวดล้อมและการเข้า--ออกสำหรับห้องดูแลสัตว์เลี้ยง**

## 1. ภาพรวมโครงงาน

**Smart Animal Care Room** เป็นระบบ IoT Prototype
สำหรับตรวจสอบสภาพแวดล้อมและเหตุการณ์บริเวณทางเข้า--ออกภายในห้องดูแลสัตว์เลี้ยง โดยใช้
ESP8266 และ ESP32 เป็น Sensor Node เชื่อมต่อผ่าน Wi-Fi และ MQTT
จากนั้นส่งข้อมูลเข้าสู่ Server ที่ทำงานด้วย Docker จัดเก็บข้อมูลใน MongoDB
และให้บริการผ่าน Web API / Web Dashboard

### ความสามารถหลัก

-   ตรวจวัดอุณหภูมิและความชื้นด้วย DHT11
-   ตรวจวัดค่า PM2.5 ด้วย PMS7003
-   ตรวจสอบเหตุการณ์บริเวณทางเข้า--ออกด้วย Laser และ LDR Photo Receiver
    Module
-   แสดงข้อมูลบน OLED ที่ต่อโดยตรงกับ ESP8266
-   ส่งข้อมูล Sensor ผ่าน MQTT
-   จัดเก็บข้อมูลใน MongoDB
-   ให้บริการ Web API และ Web Dashboard
-   ควบคุม LED บนบอร์ดผ่าน MQTT เพื่อจำลองการควบคุมไฟ

> **ข้อจำกัดของ Prototype:** ไม่มี Relay และไม่มีการต่อพัดลม เครื่องปรับอากาศ
> หรือเครื่องฟอกอากาศจริง การสาธิตการควบคุมอุปกรณ์ที่ทำจริงใช้ **Onboard LED**
> เป็นตัวจำลองการเปิด--ปิดไฟ

------------------------------------------------------------------------

## 2. วัตถุประสงค์ของระบบ

1.  ตรวจสอบอุณหภูมิภายในห้อง
2.  ตรวจสอบความชื้นภายในห้อง
3.  ตรวจสอบค่า PM2.5
4.  ตรวจสอบเหตุการณ์บริเวณทางเข้า--ออก
5.  ส่งข้อมูล Sensor ผ่าน MQTT
6.  รับและประมวลผลข้อมูลจาก MQTT
7.  จัดเก็บข้อมูล Sensor ลง MongoDB
8.  แสดงข้อมูลผ่าน Web Dashboard
9.  ให้ Pet Caretaker ตรวจสอบสถานะของห้องผ่าน Web Application
10. รองรับการส่งคำสั่งควบคุมผ่าน MQTT
11. สาธิตการควบคุมไฟด้วย Onboard LED แทน Relay

------------------------------------------------------------------------

# 3. สถาปัตยกรรมระบบ

ระบบแบ่งออกเป็นส่วนหลัก ได้แก่ Sensor Node, MQTT Broker, Data Processing,
Database, Web API และ Web Dashboard

``` text
┌──────────────────────────────────────────────────────────┐
│                 Smart Animal Care Room                  │
└──────────────────────────────────────────────────────────┘

        ชั้นอุปกรณ์และ Sensor
        ┌──────────────────────┐
        │ ESP8266              │
        │ ├─ DHT11             │
        │ ├─ Laser             │
        │ ├─ LDR Receiver      │
        │ └─ OLED              │
        └──────────┬───────────┘
                   │ Wi-Fi / MQTT
                   │
        ┌──────────▼───────────┐
        │ ESP32                │
        │ └─ PMS7003           │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ MQTT Broker          │
        │ Eclipse Mosquitto    │
        │ Port 1883            │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Collector / Backend  │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ MongoDB              │
        │ Port 27017           │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ FastAPI / WebApp     │
        │ Port 8000            │
        └──────────┬───────────┘
                   │ HTTP
                   ▼
        ┌──────────────────────┐
        │ Web Dashboard        │
        │ Pet Caretaker        │
        └──────────────────────┘
```

### 3.1 การไหลของข้อมูล Sensor

``` text
Sensor
  ↓
ESP32 / ESP8266
  ↓
Wi-Fi
  ↓
MQTT Publish
  ↓
Mosquitto Broker
  ↓
Collector / Backend
  ↓
MongoDB
  ↓
FastAPI / Web API
  ↓
Dashboard
```

### 3.2 การไหลของคำสั่งควบคุม

``` text
Pet Caretaker
  ↓
Web Dashboard
  ↓
Web API
  ↓
MQTT Command
  ↓
Mosquitto
  ↓
ESP8266
  ↓
Onboard LED
```

> การควบคุมที่ทดสอบทางกายภาพใน Prototype คือ Onboard LED เท่านั้น

------------------------------------------------------------------------

# 4. ฮาร์ดแวร์

## 4.1 ESP8266

ESP8266 ทำหน้าที่เป็น Sensor Node
สำหรับตรวจสอบสภาพแวดล้อมและเหตุการณ์บริเวณทางเข้า--ออก

  อุปกรณ์                       หน้าที่
  --------------------------- -----------------------------------------
  DHT11                       วัดอุณหภูมิและความชื้น
  Laser Transmitter           ส่งลำแสงสำหรับตรวจเหตุการณ์บริเวณทางเข้า--ออก
  LDR Photo Receiver Module   รับแสงจาก Laser
  OLED                        แสดงข้อมูลและสถานะ
  Onboard LED                 จำลองการควบคุมไฟ

### การจ่ายไฟ

อุปกรณ์ที่ต่อกับฝั่ง ESP8266 ใช้ไฟเลี้ยง **3.3V** ตามการต่อของ Prototype

------------------------------------------------------------------------

## 4.2 ESP32

ESP32 ทำหน้าที่เป็น Sensor Node สำหรับตรวจวัด PM2.5

  อุปกรณ์     หน้าที่
  --------- ----------------
  PMS7003   ตรวจวัดค่า PM2.5

PMS7003 เป็นโมดูล PM2.5 สำเร็จรูปที่เชื่อมต่อกับ ESP32 ผ่าน UART

------------------------------------------------------------------------

# 5. Pin Mapping

## 5.1 ESP8266

  อุปกรณ์                       ขา ESP8266   ไฟเลี้ยง
  --------------------------- ------------ --------
  DHT11 DATA                  D5           3.3V
  Laser Signal                D0           3.3V
  LDR Photo Receiver Signal   D1           3.3V
  OLED SCL                    D6           3.3V
  OLED SDA                    D7           3.3V
  OLED VCC                    3.3V         3.3V
  OLED GND                    GND          GND

``` text
ESP8266
│
├── DHT11
│   └── DATA → D5
│
├── Laser Transmitter
│   └── Signal → D0
│
├── LDR Photo Receiver
│   └── Signal → D1
│
└── OLED
    ├── SCL → D6
    └── SDA → D7
```

## 5.2 ESP32 + PMS7003

  PMS7003   ESP32
  --------- -------------------------------
  VCC       5V
  GND       GND
  TX        GPIO 3
  RX        GPIO -1 / ไม่ได้ใช้งานในโค้ดปัจจุบัน

ESP32 ใช้ GPIO 3 เป็นขารับข้อมูลจาก PMS7003 ตามการกำหนด UART ในโค้ดปัจจุบัน

------------------------------------------------------------------------

# 6. MQTT

## 6.1 MQTT Broker

ระบบใช้ **Eclipse Mosquitto** เป็น MQTT Broker

``` text
Broker : Eclipse Mosquitto
Port   : 1883
Protocol : MQTT
```

ESP8266 และ ESP32 ซึ่งอยู่นอก Docker Network จะเชื่อมต่อ MQTT Broker ผ่าน IP
ของเครื่อง Server และ Port `1883`

------------------------------------------------------------------------

## 6.2 โครงสร้าง MQTT Topic

ระบบใช้รูปแบบ:

``` text
animal/<station_id>/<data>
animal/<station_id>/control/<device>
```

### Sensor Data

``` text
animal/station01/environment
animal/station01/pm
```

### Control

``` text
animal/station01/control/light
animal/station01/control/fan
animal/station01/control/ac
animal/station01/control/airpurifier
```

  ------------------------------------------------------------------------------------------------------
  Topic                                    ประเภท                  หน้าที่
  ---------------------------------------- ----------------------- -------------------------------------
  `animal/station01/environment`           Sensor Data             ส่งข้อมูลอุณหภูมิ ความชื้น และข้อมูลเหตุการณ์

  `animal/station01/pm`                    Sensor Data             ส่งข้อมูล PM2.5

  `animal/station01/control/light`         Command                 ควบคุมไฟ / Onboard LED

  `animal/station01/control/fan`           Command                 คำสั่งสำหรับแนวคิดการควบคุมพัดลม

  `animal/station01/control/ac`            Command                 คำสั่งสำหรับแนวคิดการควบคุมแอร์

  `animal/station01/control/airpurifier`   Command                 คำสั่งสำหรับแนวคิดการควบคุมเครื่องฟอกอากาศ
  ------------------------------------------------------------------------------------------------------

> **หมายเหตุ:** ใน Prototype มีการสาธิต `light` ด้วย Onboard LED จริง ส่วน
> Fan, AC และ Air Purifier ยังไม่มี Relay/Actuator จริงที่ต่อกับระบบ

------------------------------------------------------------------------

# 7. MQTT Payload

## 7.1 Environment Payload

Topic:

``` text
animal/station01/environment
```

ตัวอย่าง:

``` json
{
  "device_id": "esp8266-01",
  "room": "animal-room",
  "temperature": 24.6,
  "humidity": 48.0,
  "motion": 1
}
```

> ใน Payload ปัจจุบันมีการใช้ชื่อ Field ว่า `motion`
> แต่ฮาร์ดแวร์ที่ใช้ตรวจเหตุการณ์จริงคือ **Laser + LDR Photo Receiver**
> สำหรับตรวจเหตุการณ์บริเวณทางเข้า--ออก ไม่ใช่ PIR Motion Sensor

## 7.2 Light Control Payload

Topic:

``` text
animal/station01/control/light
```

เปิด:

``` json
{
  "device": "light01",
  "command": "ON"
}
```

ปิด:

``` json
{
  "device": "light01",
  "command": "OFF"
}
```

------------------------------------------------------------------------

# 8. Database

ระบบใช้ MongoDB สำหรับจัดเก็บข้อมูล Sensor

### Database

``` text
animal_room
```

### Collection

``` text
sensor_data
```

### ตัวอย่าง Document

``` json
{
  "device_id": "esp8266-01",
  "room": "animal-room",
  "temperature": 24.6,
  "humidity": 48.0,
  "motion": 1
}
```

### Data Flow

``` text
MQTT
  ↓
Collector / Backend
  ↓
MongoDB
  ↓
animal_room
  ↓
sensor_data
```

------------------------------------------------------------------------

# 9. Web API

## 9.1 ตรวจสอบสถานะระบบ

``` http
GET /api/status
```

ใช้สำหรับเรียกข้อมูล Sensor/สถานะปัจจุบันในรูปแบบ JSON

ตัวอย่าง:

``` json
{
  "temperature": 24.6,
  "humidity": 48.0,
  "pm25": 18.0,
  "motion": 1
}
```

## 9.2 ควบคุมอุปกรณ์

``` http
POST /api/control/{device}/{state}
```

ตัวอย่าง:

``` http
POST /api/control/light/on
POST /api/control/light/off
```

### Control Flow

``` text
Web Dashboard
      ↓
Web API
      ↓
MQTT
      ↓
animal/station01/control/light
      ↓
ESP8266
      ↓
Onboard LED
```

------------------------------------------------------------------------

# 10. Docker Architecture

Server ของระบบแบ่งออกเป็น 4 Container หลัก

  Service       เทคโนโลยี                   Port หน้าที่
  ------------- -------------------- ---------- ---------------------------
  `mqtt`        Eclipse Mosquitto          1883 MQTT Broker
  `collector`   Python MQTT Client     Internal รับและประมวลผล MQTT
  `mongodb`     MongoDB                   27017 จัดเก็บข้อมูล
  `webapp`      FastAPI                    8000 Web API / Web Application

## 10.1 Docker Network

Container ติดต่อกันผ่านชื่อ Service:

``` text
collector → mqtt:1883
collector → mongodb:27017
webapp → mongodb:27017
```

**ไม่ใช้ `localhost` สำหรับการสื่อสารระหว่าง Container**

ESP32 และ ESP8266 อยู่นอก Docker Network และเชื่อมต่อ MQTT ผ่าน IP ของ Server

------------------------------------------------------------------------

# 11. Network

ตัวอย่างโครงสร้าง Network:

``` text
Wi-Fi Router
192.168.1.1
      │
      ├── ESP8266
      │
      ├── ESP32
      │
      └── Docker Host
           │
           ├── MQTT :1883
           └── WebApp :8000
```

> IP ในตัวอย่างเป็นเพียงตัวอย่างเพื่ออธิบาย Architecture ต้องเปลี่ยนเป็น IP จริงของ
> Server เมื่อใช้งาน

### Port ที่ใช้

     Port Service           การใช้งาน
  ------- ----------------- -----------------------------
     1883 MQTT              ESP32/ESP8266 ↔ MQTT Broker
    27017 MongoDB           Database
     8000 Web Application   Browser ↔ WebApp/API

------------------------------------------------------------------------

# 12. Web Dashboard

Web Dashboard เป็นส่วนติดต่อสำหรับ **Pet Caretaker**

### ความสามารถหลัก

-   แสดง Temperature
-   แสดง Humidity
-   แสดง PM2.5
-   แสดงสถานะ/เหตุการณ์การเข้า--ออก
-   แสดงสถานะอุปกรณ์
-   ส่งคำสั่งควบคุมไฟ
-   แสดงข้อมูลจาก Backend/API

เปิด Dashboard:

``` text
http://SERVER-IP:8000
```

ตัวอย่าง:

``` text
http://192.168.1.100:8000
```

> `192.168.1.100` เป็นเพียง IP ตัวอย่าง

------------------------------------------------------------------------

# 13. การติดตั้งและการใช้งาน

## 13.1 สิ่งที่ต้องมี

-   Docker
-   Docker Compose
-   Wi-Fi Network
-   ESP8266
-   ESP32
-   DHT11
-   Laser Transmitter
-   LDR Photo Receiver Module
-   OLED
-   PMS7003

## 13.2 Start Server

เข้าไปยังโฟลเดอร์ที่มี `docker-compose.yml`

``` bash
docker compose up -d --build
```

## 13.3 ตรวจสอบ Container

``` bash
docker compose ps
```

## 13.4 ดู Log

``` bash
docker compose logs -f
```

## 13.5 หยุดระบบ

``` bash
docker compose down
```

------------------------------------------------------------------------

# 14. User Manual

## 14.1 ดูข้อมูล Sensor

1.  Start Docker Services
2.  เปิด Web Dashboard
3.  ตรวจสอบ Temperature
4.  ตรวจสอบ Humidity
5.  ตรวจสอบ PM2.5
6.  ตรวจสอบข้อมูลการเข้า--ออก

### Data Flow

``` text
Sensor
  ↓
ESP
  ↓
MQTT
  ↓
Backend
  ↓
Database / API
  ↓
Dashboard
```

## 14.2 ตรวจสอบการเข้า--ออก

Laser และ LDR Photo Receiver Module ใช้บริเวณทางเข้า

``` text
Laser
  ↓
LDR Receiver
  ↓
ESP8266
  ↓
MQTT
  ↓
Backend
  ↓
Dashboard / OLED
```

## 14.3 ควบคุมไฟ

คำสั่งจาก Dashboard:

``` text
ON
 ↓
MQTT Command
 ↓
ESP8266
 ↓
Onboard LED ON
```

และ

``` text
OFF
 ↓
MQTT Command
 ↓
ESP8266
 ↓
Onboard LED OFF
```

------------------------------------------------------------------------

# 15. Developer Manual

## 15.1 โครงสร้าง Project

ตัวอย่างโครงสร้าง:

``` text
smart-animal-care-room/
│
├── README.md
├── docker-compose.yml
├── .env
│
├── mqtt/
│   └── mosquitto.conf
│
├── collector/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── collector.py
│
├── webapp/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py
│   └── static/
│       └── index.html
│
├── esp8266/
│   └── smart_animal_care_esp8266.ino
│
├── esp32/
│   └── smart_animal_care_esp32.ino
│
├── docs/
│   ├── architecture.png
│   ├── circuit.png
│   ├── mqtt-design.png
│   └── api-design.png
│
└── test/
    └── test_report.md
```

> ชื่อไฟล์จริงสามารถแตกต่างได้ แต่ควรแยก Module ให้ชัดเจน

------------------------------------------------------------------------

# 16. คำสั่งสำหรับ Developer

### Build

``` bash
docker compose build
```

### Run

``` bash
docker compose up -d
```

### Build + Run

``` bash
docker compose up -d --build
```

### ตรวจสอบ Services

``` bash
docker compose ps
```

### ดู Logs

``` bash
docker compose logs -f
```

### หยุดระบบ

``` bash
docker compose down
```

------------------------------------------------------------------------

# 17. Troubleshooting

## 17.1 ESP32 / ESP8266 เชื่อมต่อ MQTT ไม่ได้

ตรวจสอบ:

1.  Wi-Fi Connection
2.  Server IP
3.  MQTT Port `1883`
4.  MQTT Broker ทำงานหรือไม่

``` bash
docker compose ps
```

และ

``` bash
docker compose logs -f mqtt
```

------------------------------------------------------------------------

## 17.2 MQTT Message ไม่เข้า

ตรวจสอบ Pipeline:

``` text
ESP32 / ESP8266
      ↓
MQTT Publish
      ↓
Mosquitto
      ↓
Collector Subscribe
```

ตรวจสอบ Topic เช่น:

``` text
animal/station01/environment
animal/station01/pm
```

------------------------------------------------------------------------

## 17.3 MongoDB ไม่ทำงาน

ตรวจสอบ:

``` bash
docker compose logs -f mongodb
```

การเชื่อมต่อภายใน Docker ต้องใช้:

``` text
mongodb:27017
```

ไม่ใช่:

``` text
localhost:27017
```

------------------------------------------------------------------------

## 17.4 Dashboard เปิดไม่ได้

ตรวจสอบ:

``` bash
docker compose ps
```

จากนั้น:

``` bash
docker compose logs -f webapp
```

และตรวจสอบ Port `8000`

------------------------------------------------------------------------

## 17.5 LED ไม่ตอบสนอง

ตรวจสอบ:

1.  ESP8266 เชื่อมต่อ Wi-Fi
2.  ESP8266 เชื่อมต่อ MQTT
3.  Control Topic ถูกต้อง
4.  Command เป็น `ON` หรือ `OFF`
5.  MQTT Broker Log

Topic:

``` text
animal/station01/control/light
```

------------------------------------------------------------------------

# 18. Testing Summary

ระบบมีการทดสอบตั้งแต่ Service, MQTT, Database, API, Dashboard ไปจนถึง
End-to-End

  Test ID   รายการทดสอบ               Status
  --------- ------------------------- --------
  T01       Docker Compose Services   PASS
  T02       MQTT Publish              PASS
  T03       MQTT Subscribe            PASS
  T04       Valid JSON                PASS
  T05       Invalid JSON              PASS
  T06       Latest API                PASS
  T07       History API               PASS
  T08       Dashboard                 PASS
  T09       Dashboard Refresh         PASS
  T10       MQTT Broker Restart       PASS
  T11       ESP32 MQTT Connection     PASS
  T12       End-to-End                PASS

------------------------------------------------------------------------

# 19. End-to-End Test

## 19.1 Test A: Sensor → Dashboard

``` text
Physical Environment
        ↓
Sensor
        ↓
ESP32 / ESP8266
        ↓
MQTT Publish
        ↓
Mosquitto
        ↓
Collector / Backend
        ↓
MongoDB
        ↓
Web API
        ↓
Dashboard
```

## 19.2 Test B: Dashboard → Control

สำหรับ Prototype ที่มีการสาธิตจริง:

``` text
Pet Caretaker
      ↓
Dashboard
      ↓
Web API
      ↓
MQTT Command
      ↓
Mosquitto
      ↓
ESP8266
      ↓
Onboard LED
```

------------------------------------------------------------------------

# 20. ข้อจำกัดของ Prototype

ระบบปัจจุบันมีข้อจำกัดดังนี้:

1.  ไม่มี Relay Module
2.  ไม่มีการต่อพัดลมจริง
3.  ไม่มีการต่อเครื่องปรับอากาศจริง
4.  ไม่มีการต่อเครื่องฟอกอากาศจริง
5.  การควบคุมไฟที่ทดสอบจริงใช้ Onboard LED
6.  Fan / AC / Air Purifier เป็นแนวคิดสำหรับการพัฒนาต่อ
7.  การตรวจสอบบริเวณทางเข้า--ออกใช้ Laser + LDR Photo Receiver ไม่ใช่ PIR
    Motion Sensor

------------------------------------------------------------------------

# 21. การพัฒนาต่อในอนาคต

สามารถพัฒนาระบบเพิ่มเติมได้ เช่น

-   เพิ่ม Relay Module
-   ควบคุมพัดลมจริง
-   ควบคุมเครื่องปรับอากาศจริง
-   ควบคุมเครื่องฟอกอากาศจริง
-   เพิ่มระบบแจ้งเตือนเมื่อ PM2.5 สูง
-   เพิ่มระบบ Notification
-   เพิ่ม Authentication
-   รองรับหลายห้อง / หลาย Station
-   เพิ่ม Historical Analytics
-   เพิ่ม Cloud Deployment
-   เพิ่ม Mobile Application

------------------------------------------------------------------------

# 22. Final System Pipeline

สามารถสรุประบบทั้งหมดได้ดังนี้:

``` text
SENSE
  ↓
ESP32 / ESP8266
  ↓
COMMUNICATE
  ↓
MQTT / Mosquitto
  ↓
PROCESS
  ↓
Collector / Backend
  ↓
STORE
  ↓
MongoDB
  ↓
PROVIDE
  ↓
FastAPI / Web API
  ↓
VISUALIZE
  ↓
Web Dashboard
  ↓
Pet Caretaker
  ↓
CONTROL
  ↓
MQTT Command
  ↓
ESP8266
  ↓
Onboard LED
```

------------------------------------------------------------------------

# 23. สถานะของโครงงาน

  Component               สถานะ
  ----------------------- --------------------
  ESP8266                 ใช้งาน
  DHT11                   ใช้งาน
  Laser                   ใช้งาน
  LDR Photo Receiver      ใช้งาน
  OLED                    ใช้งาน
  ESP32                   ใช้งาน
  PMS7003                 ใช้งาน
  Wi-Fi                   ใช้งาน
  MQTT                    ใช้งาน
  Mosquitto               ใช้งาน
  MongoDB                 ใช้งาน
  Web API                 ใช้งาน
  Web Dashboard           ใช้งาน
  Onboard LED Control     ใช้งาน / Simulation
  Relay                   ไม่ได้ใช้
  Physical Fan            Concept
  Physical AC             Concept
  Physical Air Purifier   Concept

------------------------------------------------------------------------

# 24. Quick Start

``` bash
# 1. Start ระบบ
docker compose up -d --build

# 2. ตรวจสอบ Services
docker compose ps

# 3. ดู Logs
docker compose logs -f

# 4. เปิด Dashboard
# http://SERVER-IP:8000

# 5. หยุดระบบ
docker compose down
```

------------------------------------------------------------------------

## หมายเหตุสำคัญ

-   **ชื่อระบบ:** Smart Animal Care Room
-   **ผู้ใช้งานหลัก:** Pet Caretaker
-   ESP8266 ใช้ DHT11, Laser, LDR Photo Receiver และ OLED
-   ESP32 ใช้ PMS7003 สำหรับ PM2.5
-   อุปกรณ์ฝั่ง ESP8266 ใช้ไฟ 3.3V ตาม Wiring ของ Prototype
-   PMS7003 ใช้ไฟ 5V ตาม Wiring ของ Prototype
-   ไม่มี Relay ใน Prototype
-   Onboard LED ใช้จำลองการควบคุมไฟ
-   Fan, AC และ Air Purifier เป็น Concept / Future Extension
-   IP Address ในตัวอย่างต้องเปลี่ยนเป็น IP จริงของ Server
