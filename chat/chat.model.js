const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chat = new Schema(
  {
    from: String,
    message: String,
    _id: String,
    time: { type: Date, default: Date.now }
  },
  {
    _id: false
  }
);

module.exports = label => mongoose.model("chat." + label, chat);
