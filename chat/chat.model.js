const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chat = new Schema(
  {
    sender: { type: String },
    reciever: { type: String },
    message: { type: String }
  },
  {
    timestamps: true
  }
);

module.exports = label => mongoose.model(label + ".chat", chat);
