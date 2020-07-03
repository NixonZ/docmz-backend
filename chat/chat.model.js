const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chat = new Schema(
  {
    from: String,
    message: String,
    _id: { type: String, unique: true, required: true },
    time: { type: Date, default: Date.now },
    image: { type: String, default: "" }
  },
  {
    _id: false
  }
);

module.exports = label => mongoose.model("chat." + label, chat);
