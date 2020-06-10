const express = require("express");
const executeAsync = require("./appHelper");
const router = express.Router();

const ChatController = require("./../video_call/chat.controller");

router.get("/auth", (req, res) => {
  res.send("Auth");
});

const ChatControl = new ChatController(global.io);
router.get("/chat", executeAsync(ChatControl.index));

module.exports = router;
