const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const appointment = new Schema({
  bookedOn: { type: Date },
  patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: Schema.Types.ObjectId, ref: "Practise" },
  bookedFor: { type: Date },
  cancelledByPatient: { type: Boolean, default: false },
  cancelledByDoctor: { type: Boolean, default: false },
  transactionId: { type: String },
  reasonForCancellation: { type: String },
  availabilitySelected: { type: String },
  paid: { type: Boolean, default: false },
  duration: { type: String },
  available: { type: Boolean },
  booked: { type: Boolean, default: false }
});

module.exports = mongoose.model("Appointments", appointment);