require("rootpath")();
const express = require("express");
var socket = require("socket.io");
const bodyParser = require("body-parser");
const app = express();
const expressValidator = require("express-validator");
// app.use(expressValidator());
const cors = require("cors");

// const cron = require("./cron/cron");
// const appointcron = require("./cron/appointmentCron");

const jwt = require("_helpers/jwt");
const errorHandler = require("_helpers/error-handler");
const cookieparser = require("cookie-parser");
const session = require("express-session");
const morgan = require("morgan");
const chatModel = require("./chat/chat.model");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieparser());
// app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(cors({ origin: "http://localhost:3000" }));

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    key: "user_sid",
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000
    }
  })
);
app.use(express.static("public"));

// const readfile = require("./readfile"); //Uncomment this while reading from excel file

// var socket = require('socket.io');

// start server
// const port = process.env.PORT || 4000;
// const server = app.listen(process.env.PORT, function() {
// 	console.log(`Server listening on port ${process.env.PORT}`);
// });

// var server = http.createServer(app);
// io = socket(server);

// require('./socket/socket')(io);

// // middleware function to check for logged in users
// let sessionChecker = (req, res, next) => {
//     if (req.session.user && req.cookies.user_sid) {
//         res.redirect('/');
//     } else {
//         next();
//     }
// };

// // middleware for checking if the cookie information is saved or not
// app.use((req, res, next) => {
//     if (req.cookies.user_sid && !req.session.user) {
//         res.clearCookie('user_sid');
//     }
//     next();
// });

// use JWT auth to secure the api
// app.use(jwt());

app.use("/questionnaire", require("./routes/questionnaire_route"));

// NPI
app.use("/doctors", require("./routes/doctor_routes.js"));

//Codes
app.use("/codes", require("./routes/codes_routes"));

//Insurance
app.use("/insurance", require("./routes/insurance_routes"));

//User Routes
app.use("/patient", require("./routes/user_routes"));

//Stripe Routes
app.use("/Stripe", require("./routes/stripe_routes"));

//Appointment Routes
app.use("/appointment", require("./routes/appointment_routes"));

app.use("/medicine", require("./routes/medicine_route"));

app.use("/admin", require("./routes/admin_routes"));

app.use("/referral", require("./routes/referral_routes"));

app.use("/team", require("./routes/teams_route"));

app.use("/chat", require("./routes/chat_routes"));

app.use(errorHandler);

global.LoggedInUsers = [];

var server = app.listen(4000, () => {
  console.log("listening to port 4000");
});

global.io = socket(server);

const io = global.io;

app.use("/call", require("./routes/call_routes.js"));

io.on("connection", async socket => {
  // socket is unique to frontend and backend.
  console.log("User is using app now", socket.id);
  var userEmail = null;

  socket.addListener("sendID", function(data) {
    userEmail = data.email_id;
    console.log("pushing " + userEmail);

    LoggedInUsers.push({
      email_id: data.email_id,
      user_Id: socket.id
    });
    console.log(LoggedInUsers);
  });

  // socket.on('hello', function (hello) { console.log('hello'); });

  socket.on("sendMessage", data => {
    //data={reciever,message,chatId,_id}
    console.log("message recieved" + JSON.stringify(data));

    const recieverOnline = LoggedInUsers.filter(
      ele => ele.email_id === data.reciever
    );

    // console.log(userEmail);
    const chat = new (chatModel(data.chatId))({
      message: data.message ?? "",
      from: userEmail ?? "nomail",
      _id: data._id,
      time: data.time,
      image: data.image ?? ""
    }); //collection name = chat.uuid4()

    //testing: revert the message back to sender
    console.log("sending back to " + socket.id);
    io.to(socket.id).emit("recieveMessage", {
      chat: {
        message: data.message ?? "",
        from: data.reciever,
        _id: data._id + "a",
        time: data.time,
        image: data.image ?? ""
      },
      chatId: data.chatId
    });

    if (recieverOnline.length > 0) {
      //reciever is online
      const recieverSocketId = recieverOnline[0].user_Id;

      //socket send message to reciever
      io.to(recieverSocketId).emit("recieveMessage", {
        chat: chat.toObject(),
        chatId: data.chatId
      });
    } else {
      //reciever is offline
    }

    chat.save();
  });

  socket.on("RemoveUser", () => {
    console.log("remove user " + userEmail);
    LoggedInUsers = LoggedInUsers.filter(data => data.user_Id != socket.id);
    // console.log(LoggedInUsers);
  });

  socket.on("disconnect", () => {
    console.log("disconnected " + userEmail);
  });
});

module.exports = app;
