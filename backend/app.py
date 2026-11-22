from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mqtt import start_mqtt, publish_control
from pymongo import MongoClient

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

mongo = MongoClient("mongodb://mongodb:27017")

db = mongo["animal_room"]

collection = db["sensor_data"]

start_mqtt()


@app.get("/")
def home():
    return {
        "status": "Smart Animal Care Room API"
    }


@app.get("/api/status")
def status():

    data = list(
        collection.find(
            {},
            {"_id": 0}
        ).sort(
            "_id",
            -1
        ).limit(50)
    )

    return data


@app.post("/api/control/{device}/{state}")
def control(device: str, state: str):

    state = state.upper()

    if device not in ["light", "ac", "fan"]:
        return {
            "error": "Invalid device"
        }

    if state not in ["ON", "OFF"]:
        return {
            "error": "Invalid state"
        }

    publish_control(device, state)

    return {
        "success": True,
        "device": device,
        "state": state
    }