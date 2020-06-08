const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const practise = new Schema({
  enumerationType: { type: String },
  npi: { type: String, unique: true },
  last_updated_epoch: { type: String },
  created_epoch: { type: String },
  basic: {
    organization_name: { type: String },
    organizational_subpart: { type: String },
    enumeration_date: { type: String },
    last_updated: { type: String },
    status: { type: String },
    credential: { type: String },
    first_name: { type: String },
    last_name: { type: String },
    middle_name: { type: String },
    telephone_number: { type: String },
    title_or_position: { type: String },
    name_prefix: { type: String },
    name_suffix: { type: String },
    sole_proprietor: { type: String },
    gender: { type: String },
    name: { type: String }
  },
  other_names: { type: Object },
  address: [{ type: Schema.Types.ObjectId, ref: "doctorAddress" }],
  taxonomies: [{ type: Schema.Types.ObjectId, ref: "Taxonomies" }],
  practiceLocation: [{ type: Schema.Types.ObjectId, ref: "doctorAddress" }],

  practise: { type: String },
  organizationName: { type: String },
  description: { type: String, default: "NA" },
  identifiers: { type: Object },
  steps: { type: Array },
  email: { type: String },
  website: { type: String },
  taxId: { type: String },
  notes: { type: String },
  payToAddress: { type: String },
  payToAddress2: { type: String },
  payToCity: { type: String },
  payToState: { type: String },
  payToZipCode: { type: String },
  locationId: { type: Schema.Types.ObjectId, ref: "Location" },
  base_booking_parameters: {
    specialtyId: { type: Number },
    procedureId: { type: Number },
    insuranceCarrier: { type: Number },
    insurancePlan: { type: Number }
  },
  is_in_network: { type: Boolean, default: true },
  is_superDoc: { type: Boolean, default: false }, //Shows whether doctor is currently open for taking patients
  next_timeslot: { type: Object },
  location_ids: { type: Array },
  main_specialty_id: { type: Number },
  profile_url: { type: String },
  rating: { type: Object },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  availability: { type: Array },
  appointments: [{ type: Schema.Types.ObjectId, ref: "Appointments" }],
  specialty: { type: String },
  specialtyName: { type: String },
  phone: { type: String },
  password: {
    type: String
  },
  experience: { type: String },
  dob: { type: Date },
  picture: { type: Array },
  establishmentName: { type: String },
  city: { type: String },
  country: { type: String },
  state: { type: String },
  identityProof: { type: String },
  medicalProof: { type: String },
  createdOn: { type: Date, default: Date.now },
  availDate: { type: Date },
  savedCards: { type: Object },
  fee: { type: String },
  customerProfile: { type: String },
  renewDate: { type: Date },
  passwordToken: { type: String },
  passwordExpires: { type: Date },
  profileStatus: { type: Boolean, default: true }, //shows whether doctor is active or not
  autoApprove: { type: Boolean }, //Auto approve appointments
  question: [{ type: Schema.Types.ObjectId, ref: "question" }],
  appointmentsString: {
    type: String,
    default: `{"duration":"15","id":"","weekdaysArr":[{"days":["wednesday","thursday","friday"],"startTime":"02:30","endTime":"11:30","lunchStart":"06:30","lunchEnd":"07:30"},{"days":["monday","tuesday"],"startTime":"03:30","endTime":"12:30","lunchStart":"06:30","lunchEnd":"07:30"}]}`
  }, //holds the payload by the doctor for the appointment in string format
  totalPatient: { type: String }, //Shows total number of patient viewed
  firstName: { type: String },
  lastName: { type: String },
  name: { type: String },
  //Document of doctors
  document: {
    idProof: { type: Boolean, default: false },
    registrationProof: { type: Boolean, default: false },
    establishment: { type: Boolean, default: false }
  },
  idProof: { type: String },
  registrationProof: { type: String },
  establishment: { type: String },
  video: { type: String },

  referralId: { type: String },
  referrals: [{ type: Schema.Types.ObjectId, ref: "Referral" }],
  latestAppointment: [{ type: Schema.Types.ObjectId, ref: "Appointments" }],
  payment: { type: Boolean, default: true }, //whether doctor asks for payment or not
  isAssistant: { type: Boolean, default: false }, //denotes whether the account is assistent or not
  rights: [{ type: String }], // Array of rights that assistent have
  assistants: [{ type: Schema.Types.ObjectId, ref: "Practise" }], // if doctor, list of all assistents
  parent: { type: Schema.Types.ObjectId, ref: "Practise" },
  current_socketid: { type: String, unique: true }
});

module.exports = mongoose.model("Practise", practise);
