const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chat = new Schema({
  fromDoc: Boolean,
  message: String,
  time: { type: Date, default: Date.now }
});

module.exports = label => mongoose.model("chat." + label, chat);
