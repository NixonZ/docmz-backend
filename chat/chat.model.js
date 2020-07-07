const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chat = new Schema(
  {
    from: { type: String, required: true, default: "nomail" },
    message: { type: String, default: "" },
    time: { type: Date, default: Date.now },
    image: { type: String, default: "" },
    _id: { type: String, required: true }
  },
  {
    _id: false
  }
);

module.exports = label => mongoose.model("chat." + label, chat);
