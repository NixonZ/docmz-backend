const router = require("express").Router();
const chatController = require("../chat/chat.controller");

router.post(
  "/upload",
  chatController.uploadMulter.any(),
  chatController.uploadImg
);

module.exports = router;
