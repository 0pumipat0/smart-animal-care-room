#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "VO1";
const char* WIFI_PASSWORD = "113333555555";

// IP ของคอมที่รัน Docker / Mosquitto
const char* MQTT_BROKER = "10.242.227.XXX";
const int MQTT_PORT = 1883;

const char* MQTT_TOPIC = "animal/station01/pm";

HardwareSerial PMS(2);

WiFiClient espClient;
PubSubClient mqtt(espClient);


void connectWiFi() {

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");

  }

  Serial.println();
  Serial.println("WiFi Connected");

  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());

}


void connectMQTT() {

  while (!mqtt.connected()) {

    Serial.print("Connecting MQTT...");

    if (mqtt.connect("ESP32_PM25")) {

      Serial.println("Connected");

    } else {

      Serial.print("Failed, state=");
      Serial.println(mqtt.state());

      delay(2000);

    }
  }
}


void setup() {

  Serial.begin(115200);

  PMS.begin(
    9600,
    SERIAL_8N1,
    3,
    -1
  );

  connectWiFi();

  mqtt.setServer(
    MQTT_BROKER,
    MQTT_PORT
  );

}


void loop() {

  if (!mqtt.connected()) {

    connectMQTT();

  }

  mqtt.loop();


  if (PMS.available() >= 32) {

    uint8_t d[32];

    PMS.readBytes(
      d,
      32
    );


    if (
      d[0] == 0x42 &&
      d[1] == 0x4D
    ) {

      int pm25 =
        (d[6] << 8) | d[7];


      Serial.print("PM2.5 = ");
      Serial.print(pm25);
      Serial.println(" ug/m3");


      char message[10];

      sprintf(
        message,
        "%d",
        pm25
      );


      mqtt.publish(
        MQTT_TOPIC,
        message
      );


      Serial.print("MQTT ส่ง: ");
      Serial.println(message);

    }
  }


  delay(1000);

}