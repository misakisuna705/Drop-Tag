#!/usr/bin/env node

const path = require("path");
const commander = require("commander");
const mqtt = require("mqtt");
const firebase_admin = require("firebase-admin");

commander
  .option("--addr <mac>", "Sensor Mac addrress")
  .option("--host <url>", "mqtt broker url")
  .option("--username <username>", "MQTT broker username")
  .option("--password <password>", "MQTT broker password")
  .option("--firebase <path>", "Firebase Admin SDK")
  .option("--topics <list>", "list of comma seperated topics")
  .action(cmd => {
    const { addr, host, username, password, firebase, topics } = cmd;

    if (!(addr && host && username && password && firebase && topics)) {
      console.error("flag undefined");
      process.exit(1);
    }

    const certificate = require(path.resolve(process.cwd(), firebase));

    firebase_admin.initializeApp({ credential: firebase_admin.credential.cert(certificate) });

    const firestore = firebase_admin.firestore();

    const client = mqtt.connect(host, { username, password });

    client.on("connect", () => {
      console.log(`\n[log] connected to ${host}\n`);

      topics.split(",").forEach(topic => {
        client.subscribe(topic);
      });
    });

    client.on("message", (topic, packet) => {
      const json = JSON.parse(packet.toString());
      const date = new Date(Date.parse(json[0].time) - 28800000);
      const time = date.toISOString();
      const code = json[0].data.substring(2, 4);
      const temperature = code === "67" ? parseInt(json[0].data.substring(5, 8), 16) * 0.1 : null;
      const humidity = code === "67" ? parseInt(json[0].data.substring(13, 14), 16) * 0.5 : null;
      const barometer = code === "67" ? parseInt(json[0].data.substring(19, 22), 16) * 0.1 : null;
      const accelerationX = code === "71" ? parseInt(json[0].data.substring(5, 8), 16) * 0.001 : null;
      const accelerationY = code === "71" ? parseInt(json[0].data.substring(9, 12), 16) * 0.001 : null;
      const accelerationZ = code === "71" ? parseInt(json[0].data.substring(13, 16), 16) * 0.001 : null;
      const latitude = code === "88" ? parseInt(json[0].data.substring(5, 12), 16) * 0.0000001 : null;
      const longitude = code === "88" ? parseInt(json[0].data.substring(12, 20), 16) * 0.0000001 : null;

      const info = {
        time: time,
        topic: topic,
        macaddr: json[0].macAddr,
        data: json[0].data,
        temperature: temperature,
        humidity: humidity,
        barometer: barometer,
        accelerationX: accelerationX,
        accelerationY: accelerationY,
        accelerationZ: accelerationZ,
        latitude: latitude,
        longitude: longitude
      };

      if (info.macaddr === addr) {
        console.log(info);
        console.log("\n");

        if (info.accelerationX != null && info.accelerationY != null && info.accelerationZ != null) {
          firestore
            .collection("Vibration")
            .doc(time.toString())
            .set(info);
        } else if (info.temperature != null && info.humidity != null && info.barometer != null) {
          firestore
            .collection("Weather")
            .doc(time.toString())
            .set(info);
        } else if (info.latitude != null && info.longitude != null) {
          firestore
            .collection("GPS")
            .doc(time.toString())
            .set(info);
        } else {
          //info.latitude = Math.random() * (24.79591 - 24.78699) + 24.78699;
          //info.longitude = Math.random() * (120.99535 - 120.9897) + 120.9897;
          //firestore
          //.collection("GPS")
          //.doc(time.toString())
          //.set(info);
        }
      }
    });

    client.on("close", () => {
      console.log(`\n[log] disconnected from ${host}\n`);
    });
  })
  .parse(process.argv);
