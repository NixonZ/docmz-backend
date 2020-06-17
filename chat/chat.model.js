const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chat = new Schema(
  {
    fromDoc: Boolean,
    message: String
  },
  {
    timestamps: true
  }
);

module.exports = label => mongoose.model("chat." + label, chat);
