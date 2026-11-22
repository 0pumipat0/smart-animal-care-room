import json
import paho.mqtt.client as mqtt
from pymongo import MongoClient
from datetime import datetime
from zoneinfo import ZoneInfo

MQTT_BROKER = "mqtt"
MQTT_PORT = 1883

MONGO_URL = "mongodb://mongodb:27017"

mongo = MongoClient(MONGO_URL)

db = mongo["animal_room"]

collection = db["sensor_data"]

client = mqtt.Client()


def on_connect(client, userdata, flags, rc):

    print("MQTT Connected")

    client.subscribe("animal/+/pm")
    client.subscribe("animal/+/environment")


def on_message(client, userdata, msg):

    try:

        topic = msg.topic
        payload = msg.payload.decode()

        print(topic, payload)

        if topic.endswith("/pm"):
            pm25 = int(payload)

            thai_time = datetime.now(ZoneInfo("Asia/Bangkok"))

            data = {
                "type": "pm25",
                "pm25": pm25,
                "time": thai_time.isoformat()
            }

            collection.insert_one(data)

            # AUTO AIR PURIFIER
            if pm25 >= 37.5:

                client.publish(
                    "animal/station01/control/airpurifier",
                    "ON"
                )

            elif pm25 <= 35:

                client.publish(
                    "animal/station01/control/airpurifier",
                    "OFF"
                )

        elif topic.endswith("/environment"):

            data = json.loads(payload)

            data["type"] = "environment"

            collection.insert_one(data)

    except Exception as e:

        print("Error:", e)


client.on_connect = on_connect
client.on_message = on_message


def start_mqtt():

    client.connect(
        MQTT_BROKER,
        MQTT_PORT,
        60
    )

    client.loop_start()


def publish_control(device, state):

    topic = f"animal/station01/control/{device}"

    client.publish(
        topic,
        state
    )