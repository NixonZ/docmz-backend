import kurento from "kurento-client";
import has from "lodash/has";
import RoomService from "./services/RoomService";
import { KURENTO_URL } from "./../configs/app";

const cookieparser = require("cookie-parser"),
  db = require("_helpers/db"),
  User = db.User,
  Practise = db.Practise,
  express = require("express"),
  app = express();

export default class ChatController {
  constructor(io) {
    this.io = io;
    this.chat = io.of("/chat");
    this.chatIndex();
    this.rooms = {};
  }
  async chatIndex(req, res) {
    try {
      const kurentoClient = await kurento(KURENTO_URL);

      this.chat.on("connection", socket => {
        console.log("connection Triggered");

        socket.on("start-call", async doctorEmail => {
          Practise.findOne({ email: doctorEmail }).then(doctor => {
            if (!doctor) {
              res
                .status(404)
                .json({ status: false, message: "User Not Found!" });
            }
            let roomID = doctor.current_socketid;
            if (roomID && !has(this.rooms, roomID)) {
              const newRoom = new RoomService(
                roomID,
                this.rooms,
                kurentoClient,
                this.io
              );
              // await newRoom.create(roomID);
              this.rooms[roomID] = newRoom;
            } else {
              console.log("No Such doctor online");
            }
            this.chat.emit("doctor-connected", "Hello User");
          });
        });

        socket.on("disconnect", () => {
          this.chat.emit("user disconnected");
        });
      });
    } catch (error) {
      console.log(error);
    }
  }
}
