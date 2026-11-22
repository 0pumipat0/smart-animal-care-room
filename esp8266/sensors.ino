#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

const char* WIFI_SSID = "VO1";
const char* WIFI_PASSWORD = "113333555555";

// IP คอมที่รัน Docker / MQTT
const char* MQTT_BROKER = "10.242.227.XXX";
const int MQTT_PORT = 1883;

const char* MQTT_TOPIC = "animal/station01/environment";

#define LASER_PIN D0
#define RECEIVER_PIN D1
#define DHT_PIN D5
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

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

  Serial.print("ESP8266 IP: ");
  Serial.println(WiFi.localIP());
}


void connectMQTT() {

  while (!mqtt.connected()) {

    Serial.print("Connecting MQTT...");

    if (mqtt.connect("ESP8266_SENSOR")) {

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

  pinMode(LASER_PIN, OUTPUT);
  pinMode(RECEIVER_PIN, INPUT);

  digitalWrite(LASER_PIN, HIGH);

  dht.begin();

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


  int laserState =
    digitalRead(RECEIVER_PIN);


  float humidity =
    dht.readHumidity();

  float temperature =
    dht.readTemperature();


  if (
    !isnan(humidity) &&
    !isnan(temperature)
  ) {

    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");


    if (laserState == HIGH) {

      Serial.println(
        "Laser: มีบางอย่างเข้าออก!"
      );

    } else {

      Serial.println(
        "Laser: ไม่มี"
      );

    }


    char message[150];

    sprintf(
      message,
      "{\"temperature\":%.1f,\"humidity\":%.1f,\"motion\":%d}",
      temperature,
      humidity,
      laserState
    );


    mqtt.publish(
      MQTT_TOPIC,
      message
    );


    Serial.print("MQTT ส่ง: ");
    Serial.println(message);

  } else {

    Serial.println(
      "DHT11: อ่านค่าไม่ได้"
    );

  }


  Serial.println(
    "--------------------"
  );

  delay(3000);
}