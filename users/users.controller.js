const cookieparser = require("cookie-parser"),
  db = require("_helpers/db"),
  User = db.User,
  Usermeta = db.Usermeta,
  Member = db.Member,
  Appointment = db.Appointment,
  Referral = db.Referral,
  express = require("express"),
  app = express(),
  crypto = require("crypto"),
  algorithm = "aes-256-cbc";
let key = "abcdefghijklmnopqrstuvwxyztgbhgf";
const jwt = require("jsonwebtoken");
let iv = "1234567891234567";
let async = require("async");
let nodemailer = require("nodemailer");
let ejs = require("ejs");
const keySecret = "	sk_test_hoVy16mRDhxHCoNAOAEJYJ4N00pzRH8xK2";
const stripe = require("stripe")(keySecret);
const randomstring = require("randomstring");
const _ = require("underscore");
const io = require("socket.io-client");
const socket = io.connect('http://192.168.1.6:5000/')
socket.on('connect', (client) => {
  console.log('Connected to port 5000');
});
//SMTP Config
let smtpConfig = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL,
  // you can try with TLS, but port is then 587
  auth: {
    user: "anas3rde@gmail.com", // Your email id
    pass: "8123342590" // Your password
  },
  tls: {
    rejectUnauthorized: false
  }
};
const multer = require("multer");
let fs = require("fs"),
  path = require("path"),
  filePath = path.join(__dirname, "/forgotPassword.html");
console.log({ filePath });
let template = fs.readFileSync(filePath, { encoding: "utf-8" });

app.use(cookieparser());

// middleware function to check for logged in users
let sessionChecker = (req, res, next) => {
  if (req.cookies.user_sid) {
    res.json({ status: true });
  } else {
    next();
  }
};

// middleware for checking if the cookie information is saved or not
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie("user_sid");
  }
  next();
});

//Function get all the users
// let getAllUsers = (req, res) => {
// 	let parent = await User.find({ role: 'parent' });
// 	let admin = await User.find({ role: 'admin' });

// 	await res
// 		.status(200)
// 		.json({
// 			status: true,
// 			parents: parent,
// 			admins: admin,
// 			teachers: teacher,
// 			students: student
// 		});
// }

// //Checking stored user session details
// function checkSession(req, res) {
// 	if (req.cookies.user_sid) {
// 		res.json({ status: true });
// 	} else {
// 		res.json({ status: false });
// 	}
// }

let register = async (req, res) => {
  console.log("i am here in register");
  // validate the input
  // req.checkBody("email", "Email is required").notEmpty();
  // req.checkBody("role", "Role is required").notEmpty();
  // req.checkBody("name", "First Name is required").notEmpty();
  // req.checkBody("phonenumber", "Phone Number is required").notEmpty();
  // req.checkBody("password", "Password is required").notEmpty();

  // // check the validation object for errors
  // let errors = req.validationErrors();
  let { firstName, lastName, email, phone, password } = req.body;
  // if (errors) {
  //   res.json({ status: false, messages: errors });
  // } else {
  // validate

  // hashing the password
  let cipher = crypto.createCipheriv(algorithm, new Buffer.from(key), iv);
  var encrypted = cipher.update(password, "utf8", "hex") + cipher.final("hex");

  stripe.customers.create(
    {
      description: firstName + " " + lastName + "|" + email,
      email
    },
    async function (error, customer) {
      if (error) {
        res.status(400).json({ status: false, message: error });
      } else if (customer) {
        //Creating the user model
        let referralId = req.body.firstName + randomstring.generate(5);
        let meta = new Usermeta({ referralId });

        meta.save().then(metadata => {
          console.log("meta", metadata);
          const user = new User({
            firstName,
            lastName,
            email,
            // role,
            phone,
            password: encrypted,
            customerProfile: customer.id,
            meta: metadata._id,
            referralId
          });

          //Saving the user
          user
            .save()
            .then(async data => {
              // console.log("User", data);
              Usermeta.findOneAndUpdate(
                { _id: data.meta },
                { userId: data._id },
                { new: true }
              )
                .then(result => {
                  // console.log("updated meta", result);
                  Referral.findOne({ email: req.body.email }).then(result => {
                    if (!_.isEmpty(result)) {
                      result.referredTo = "Patient";
                      result.registered = true;
                      result.registeredId = data._id;
                      result.save().then(final => {
                        // console.log("final", final);
                        res.json({
                          status: true,
                          message: "Successfully Registered",
                          data: result
                        });
                      });
                    } else if (req.body.referralId) {
                      // console.log("in referral");
                      let refData = new Referral({
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        referredTo: "Patient",
                        registered: true,
                        registeredId: data._id,
                        referralId: req.body.referralId
                      });
                      refData
                        .save()
                        .then(ref => {
                          // console.log("ref created", data._id, ref);
                          if (req.body.referralId.split("_") === "d") {
                            Practise.findOneAndUpdate(
                              { referralId: req.body.referralId },
                              { $push: { referrals: ref._id } },
                              { new: true }
                            )
                              .then(final => {
                                console.log("by link", final);
                                res.status(200).json({
                                  status: true,
                                  message: "Successfully Registered"
                                });
                              })
                              .catch(err => {
                                // console.log("with referralId", err);
                                res.status(500).json({
                                  status: false,
                                  message: "Something went wrong",
                                  err: err
                                });
                              });
                          } else {
                            Usermeta.findOneAndUpdate(
                              { referralId: req.body.referralId },
                              { $push: { referrals: ref._id } },
                              { new: true }
                            )
                              .then(final => {
                                // console.log("by link", final);
                                res.status(200).json({
                                  status: true,
                                  message: "Successfully Registered"
                                });
                              })
                              .catch(err => {
                                // console.log("with referralId", err);
                                res.status(500).json({
                                  status: false,
                                  message: "Something went wrong",
                                  err: err
                                });
                              });
                          }
                        })
                        .catch(err => {
                          // console.log(err);
                          res.status(500).json({
                            status: false,
                            message: "Something went wrong",
                            err: err
                          });
                        });
                    } else {
                      // console.log("no referral");
                      res.status(200).json({
                        status: true,
                        message: "Successfully Registered",
                        data: data
                      });
                    }
                  });
                })
                .catch(err => {
                  res.status(500).json({
                    status: false,
                    err: err,
                    message: "err while find"
                  });
                });

              // if (req.b\\ ody.referralId) {
              // 	let refData = new Referral({

              // 		firstName: req.body.firstName,
              // 		lastName: req.body.lastName,
              // 		referredBy: req.body.referralId,
              // 		registered: true,
              // 		registeredId: data._id,
              // 	});
              // 	refData.save().then((ref) => {
              // 		console.log("ref created", req.body.referralId, ref);
              // 		Usermeta.findOneAndUpdate(
              // 			{ referralId: req.body.referralId },
              // 			{ $push: { referrals: ref._id } },
              // 			{ new: true }
              // 		)
              // 			.then((metares) => {
              // 				console.log("final meta update", metares);
              // 				res.status(200).json({
              // 					status: true,
              // 					message: "Successfully registered",
              // 				});
              // 			})
              // 			.catch((err) => {
              // 				res.status(500).json({
              // 					status: false,
              // 					err: err,
              // 					message: "err by refdata",
              // 				});
              // 			});
              // 	});
              // } else {
              // 	Referral.findOne({ email: req.body.email }).then(
              // 		(refres) => {
              // 			console.log("check by mail", refres);
              // 			if (_.isEmpty(refres)) {
              // 				res.status(200).json({
              // 					status: true,
              // 					message: "Successfully registered",
              // 				});
              // 			} else {
              // 				refres.registered = true;
              // 				refres.registeredId = result._id;
              // 				refres.save().then((output) => {
              // 					console.log("final refres update", output);
              // 					res
              // 						.status(200)
              // 						.json({
              // 							status: true,
              // 							message: "Successfully registered",
              // 						})
              // 						.catch((err) => {
              // 							res.status(500).json({
              // 								status: false,
              // 								err: err,
              // 								message: "err by form",
              // 							});
              // 						});
              // 				});
              // 			}
              // 		}
              // 	);
              // }

              // .then((result) => {
              // 	// console.log(result);
              // 	res.status(200).json({ status: true, data });
              // })
              // .catch((err) => {
              // 	res.status(500).json({
              // 		status: false,
              // 		message: "Something went wrong",
              // 		err: err,
              // 	});
              // });
              // let mailOptions = {
              // 	from: '"DocMz"; <admin@docmz.com>',
              // 	to: email,
              // 	subject: "Su`ccessfully Registered - DocMz",
              // 	text: "You've been successfully registered on DocMz. ",
              // };

              // smtpTransport.sendMail(mailOptions, function(err) {
              //   if (err) console.log(err);
              // });

              //Sending Success Response
            })
            .catch(error => {
              if (error.code === 11000) {
                res.status(500).json({
                  status: false,
                  message: "This mail is already taken"
                });
              } else res.status(500).json({ status: false, error });
            });
        });
      }
    }
  );

  // }
};

let registerDoctor = async (req, res) => {
  // validate the input
  req.checkBody("email", "Email is required").notEmpty();
  req.checkBody("role", "Role is required").notEmpty();
  req.checkBody("name", "First Name is required").notEmpty();
  req.checkBody("phonenumber", "Phone Number is required").notEmpty();
  req.checkBody("password", "Password is required").notEmpty();

  // check the validation object for errors
  let errors = req.validationErrors();
  let { name, email, role, phone, password } = req.body;
  if (errors) {
    res.json({ status: false, messages: errors });
  } else {
    // validate
    if (await User.findOne({ email })) {
      res.status(404).json({
        status: false,
        error: "Email " + email + " is already taken"
      });
    } else {
      // hashing the password
      let cipher = crypto.createCipheriv(algorithm, new Buffer.from(key), iv);
      var encrypted =
        cipher.update(password, "utf8", "hex") + cipher.final("hex");

      //Creating the user model
      const user = new User({
        name,
        email,
        role,
        phone,
        password: encrypted
      });

      //Saving the user
      await user
        .save()
        .then(data => {
          //Sending Mail
          let mailOptions = {
            from: '"DocMz"; <admin@docmz.com>',
            to: email,
            subject: "Successfully Registered - DocMz",
            text: "You've been succesfully registered on DocMz. "
          };

          smtpTransport.sendMail(mailOptions, function (err) {
            if (err) console.log(err);
          });

          //Sending Success Response
          res.status(200).json({ status: true, data });
        })
        .catch(error => {
          res.status(404).json({ status: false, error });
        });
    }
  }
};

// Function to authenticate an user
let authenticate = (req, res) => {
  // if (req.body.email) {
  //   // validate the input
  //   req.checkBody("email", "Email is required").notEmpty();
  //   req.checkBody("password", "Password is required").notEmpty();

  //   // check the validation object for errors
  //   let errors = req.validationErrors();

  //   if (errors) {
  //     res.json({ status: false, messages: errors });
  //   } else {
  let { email, password, socketID } = req.body;

  const messageToSearchWith = new User({ email });
  messageToSearchWith.encryptFieldsSync();

  let cipher = crypto.createCipheriv(algorithm, new Buffer.from(key), iv);
  let encrypted = cipher.update(password, "utf8", "hex") + cipher.final("hex");

  User.findOneAndUpdate(
    { email: messageToSearchWith.email },
    {
      $set: { current_socketID: socketID }
    }
  ).then(user => {
    app.get(sessionChecker, (req, res) => {
      console.log({ status: "session stored" });
    });

    //Checking if User exits or not
    if (user) {
      console.log(user);
      if (!user) {
        res.status(404).json({ status: false, message: "User Not Found!" });
      } else if (encrypted != user.password) {
        res
          .status(500)
          .json({ status: false, error: "Password Entered is Incorrect" });
      } else {
        let token = jwt.sign(user.toJSON(), "catchmeifyoucan", {
          expiresIn: 604800
        });
        req.session.user = user;
        req.session.Auth = user;
        res.status(200).json({
          status: true,
          user: req.session.Auth,
          token
        });
      }
    } else {
      res.json({ status: false, error: "Password Entered is Incorrect" });
    }
  });
  // }
};

let authenticatebyImage = (req, res) => {
  let { email, image } = req.body;

  const messageToSearchWith = new User({ email });
  messageToSearchWith.encryptFieldsSync();

  var percentage = 0.7;

  User.findOne(
    { email: messageToSearchWith.email }
    // User.findOne({email}
  ).then(user => {
    app.get(sessionChecker, (req, res) => {
      console.log({ status: "session stored" });
    });
    console.log(user);
    console.log(messageToSearchWith);
    //Checking if User exits or not
    if (user) {
      async function recognise() {
        const main_path = path.join(__dirname, '../')
        const user_picture = fs.readFileSync(path.join(main_path, user.picture), { encoding: 'base64' });

        socket.emit('VideoandUploadImage', { video_image: image, user_image: user_picture });

        socket.on('output', (output) => {
          console.log('Recieved Percentage');
          console.log(percentage);
          percentage = parseFloat(output);
          if (!user) {
            res.status(404).json({ status: false, message: "User Not Found!" });
          } else if (percentage < 0.75) {
            res
              .status(500)
              .json({ status: false, error: "Percentage not exceeded", percentage: percentage });
          } else {
            let token = jwt.sign(user.toJSON(), "catchmeifyoucan", {
              expiresIn: 604800
            });
            req.session.user = user;
            req.session.Auth = user;
            res.status(200).json({
              status: true,
              user: req.session.Auth,
              token
            });
          }
        });
      };
      recognise().then(() => { });
    }
    else {
      res.json({ status: false, error: "Password Entered is Incorrect" });
    }
  });
  // }
};

//Function for loggging out
let logout = (req, res) => {
  res.clearCookie("user_sid");
  res.json({
    session: "cleared",
    status: true
  });
  console.log(req);
};

// //Function to register
// function register(req, res, next) {
// 	userService.create(req, res, req.body);
// }

// //Function to get all the teachers
// async function getAllTeachers(req, res, next) {
// 	let teach = {};
// 	await userService
// 		.getTeachers_verified()
// 		.then((users) => (teach = users))
// 		.catch((err) => next(err));
// 	userService
// 		.getTeachers_Nverified()
// 		.then((unverified) => res.json({ status: true, verified: teach, Unverified: unverified }))
// 		.catch((err) => res.json({ status: false, error: err }));
// }

// //Function to get all the parents
// async function getAllParents(req, res, next) {
// 	let parents = {};
// 	await userService
// 		.getParents_verified()
// 		.then((users) => (parents = users))
// 		.catch((err) => next(err));
// 	userService
// 		.getParents_Nverified()
// 		.then((unverified) => res.json({ status: true, verified: parents, Unverified: unverified }))
// 		.catch((err) => res.json({ status: false, error: err }));
// }

// //Function to get all the admins
// async function getAllAdmins(req, res, next) {
// 	let admin = {};
// 	await userService
// 		.getadmin_verified()
// 		.then((users) => (admin = users))
// 		.catch((err) => next(err));
// 	userService
// 		.getadmin_Nverified()
// 		.then((unverified) => res.json({ status: true, verified: admin, Unverified: unverified }))
// 		.catch((err) => res.json({ status: false, error: err }));
// }

// //Function to assign token for resetting password
// function Token(req, res, next) {
// 	userService
// 		.TokenForgotPassword(req.body.email)
// 		.then(() => res.json({ success: true }))
// 		.catch((err) => next(err));
// }

// //Function to assign token to a particular email
// function assignToken(req, res, next) {
// 	console.log('token function from controller executed');
// 	console.log(req.body.email);
// 	userService
// 		.assignToken(req.body.email)
// 		.then(() => res.json({ success: true }))
// 		.catch((err) => next(err));
// }

// //function to verify that token in database
// async function verifytoken(req, res, next) {
// 	console.log('verifyToken function executed');
// 	let token = req.params.token;
// 	console.log(token);
// 	async.waterfall(
// 		User.findOne({ passwordtoken: token, passwordexpires: { $gt: Date.now() } }, function(
// 			err,
// 			user
// 		) {
// 			if (user) {
// 				console.log('user found');
// 				res.status(200).json({ success: true, token: token });
// 			} else {
// 				console.log('User not found or token expired');
// 				res.status(404).json({
// 					success: false,
// 					message: 'No user found or token expired'
// 				});
// 				console.log(user);
// 			}
// 		})
// 	);
// }

// //Function to set password
// function setPassword(req, res, next) {
// 	// Body validations
// 	req.checkBody('password', 'Password is required').notEmpty();
// 	req.checkBody('password2', 'Password2 is required').notEmpty();

// 	// check the validation object for errors
// 	let errors = req.validationErrors();

// 	if (errors) {
// 		res.json({ status: false, messages: errors });
// 	} else {
// 		if (req.body.password !== req.body.password2) {
// 			res.json({
// 				success: false,
// 				message: 'Passwords do not match'
// 			});
// 		} else {
// 			userService.setPassword(req.params.token, req.body.password, req.body.forgetpassword);
// 			res.status(200).json({ success: true, token: req.params.token });
// 		}
// 	}
// }

// //Function to See user credentials
// function viewUser(req, res) {
// 	let id = req.body.id;
// 	User.findById(id).then((data) => changepass(data));
// 	function changepass(data) {
// 		let password = data.password;
// 		let decipher = crypto.createDecipheriv(algorithm, new Buffer.from(key), iv);
// 		let decrypted = decipher.update(password, 'hex', 'utf8') + decipher.final('utf8');
// 		res.json({ password: decrypted });
// 	}
// }

// //Function to edit users credentials
// async function editUser(req, res) {
// 	// validate the input
// 	req.checkBody('username', 'Username is required').notEmpty();

// 	req.checkBody('newusername', 'Username is required').notEmpty();

// 	req.checkBody('password', 'Password is required').notEmpty();

// 	// check the validation object for errors
// 	let errors = req.validationErrors();
// 	if (errors) {
// 		res.json({ status: false, messages: errors });
// 		return;
// 	} else {
// 		await User.findOne({ username: req.body.newusername }).then((user) => check_user(user));
// 		// await Student.findOne({email: req.body.newemail}).then((student) => check_student(student));
// 		async function check_user(user) {
// 			if (user && user.username == req.body.newusername) {
// 				let cipher = crypto.createCipheriv(algorithm, new Buffer.from(key), iv);
// 				var encrypted =
// 					cipher.update(req.body.password, 'utf8', 'hex') + cipher.final('hex');
// 				User.findOneAndUpdate(
// 					{ _id: req.body.id, role: req.params.type },
// 					{
// 						$set: { username: req.body.newusername, password: encrypted }
// 					}
// 				)
// 					.then((user) => res.json({ status: true, user: user }))
// 					.catch((err) => res.json(err));
// 			} else {
// 				if (user) {
// 					res.status(404).json({
// 						status: false,
// 						error: 'Username ' + req.body.newusername + ' is already taken'
// 					});
// 				} else {
// 					await Student.findOne({ username: req.body.newusername }).then((student) =>
// 						check_student(student)
// 					);
// 					function check_student(student) {
// 						if (student) {
// 							res.status(404).json({
// 								status: false,
// 								error: 'Username ' + req.body.newusername + ' is already taken'
// 							});
// 						} else {
// 							let cipher = crypto.createCipheriv(algorithm, new Buffer.from(key), iv);
// 							var encrypted =
// 								cipher.update(req.body.password, 'utf8', 'hex') +
// 								cipher.final('hex');
// 							User.findOneAndUpdate(
// 								{ _id: req.body.id, role: req.params.type },
// 								{
// 									$set: { username: req.body.newusername, password: encrypted }
// 								}
// 							)
// 								.then((user) => res.json({ status: true }))
// 								.catch((err) => res.json(err));
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// }

// //Function to edit the role of any user
// function editRole(req, res) {
// 	let id = req.body.id;
// 	User.findByIdAndUpdate(id, {
// 		$set: {
// 			role: req.params.newrole
// 		}
// 	})
// 		.then((users) => res.json(users))
// 		.catch((Err) => res.json(err));
// }

// //Function to approve/decline any particular user
// function assignReply(req, res) {
// 	let reply;
// 	if (req.params.reply == 'approve') {
// 		reply = 'Approved';
// 	} else if (req.params.reply == 'decline') {
// 		reply = 'Rejected';
// 	}
// 	let id = req.body.id;

// 	User.findByIdAndUpdate(id, {
// 		$set: {
// 			status: reply
// 		}
// 	})
// 		.then(User.findById(id).then((user) => res.json({ status: true, User: user })))
// 		.catch((err) => res.json(err));
// }

//Get profile details
function getProfileDetails(req, res) {
  let { id } = req.params;
  User.findOne({ _id: id })
    .populate({
      path: "favourites",
      select:
        "basic firstName lastName address phone email picture appointments",
      populate: "appointments address"
    })
    .populate({
      path: "appointments",
      populate: {
        path: "doctor",
        select: "-appointments -password"
      }
    })
    .then(data => {
      res
        .status(200)
        .json({ status: true, message: "Profile Details fetched", data });
    })
    .catch(error => {
      res.status(404).json({ status: false, message: error });
    });
}

//Forget password

function tokenForgetPassword(email) {
  console.log("Reset password token function executed");
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          let token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOneAndUpdate(
          { email },
          {
            $set: {
              passwordToken: token,
              passwordExpires: Date.now() + 3600000
            }
          }
        ).exec(function (err, user) {
          done(err, token, user);
        });
      },
      function (token, user, done) {
        console.log({ user });

        let url = "http://localhost:3000/forgetpassword/";

        let fields = {
          url
        };

        let html = ejs.render(template, fields);

        let mailOptions = {
          from: "anas3rde@gmail.com",
          to: email,
          subject: "Reset Password - DocMz",
          text:
            "Please click on the following link to reset your password:\n\n" +
            process.enc.CLIENT_URL +
            "/setpassword/" +
            token +
            "\n\n"
        };

        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("Reset Password email sent");
          done(err, "done");
        });
      }
    ],
    function (err) {
      if (err) console.log(err);
    }
  );
}

//Function to assign token
async function assignToken(req, res) {
  let { email } = req.body;
  console.log("token function executed");
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        User.findOneAndUpdate(
          { email: email },
          {
            $set: {
              passwordtoken: token,
              passwordexpires: Date.now() + 3600000
            }
          },
          { new: true }
        ).exec(function (err, user) {
          console.log("1");
          done(err, token, user);
          console.log("2");
        });
      },
      function (token, user, done) {
        console.log({ user });

        let url = "http://localhost:3000/forgetpassword/" + token;

        let fields = {
          url
        };

        let html = ejs.render(template, fields);

        // var smtpTransport = nodemailer.createTransport({
        // 	host: 'smtp.gmail.com',
        // 	port: 587,
        // 	secure: false,
        // 	// port: 465,
        // 	// secure: true, // use SSL
        // 	auth: {
        // 		user: 'anas3rde@gmail.com',
        // 		pass: '8123342590'
        // 	}
        // });

        var mailOptions = {
          from: "anas3rde@gmail.com",
          to: email,
          subject: "Reset Your Password - DocMz",
          html
          // text:
          //   "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
          //   process.env.CLIENT_URL +
          //   "/users/setpassword/" +
          //   token +
          //   "\n\n"
        };
        let transporter = nodemailer.createTransport(smtpConfig);
        transporter.sendMail(mailOptions, function (err) {
          console.log("Email sent");
          done(err, "done");
        });
      }
    ],
    function (err) {
      if (err) console.log(err);
      res.status(200).json({ status: true, message: "Email Sent" });
    }
  );
}

//Function to set the password
function setPassword(req, res) {
  console.log(req.body);
  let { token, password } = req.body;

  let cipher = crypto.createCipheriv(algorithm, new Buffer.from(key), iv);
  var encrypted = cipher.update(password, "utf8", "hex") + cipher.final("hex");
  // var hashp = bcrypt.hashSync(password, 10);

  User.findOneAndUpdate(
    {
      passwordtoken: token,
      passwordexpires: { $gt: Date.now() }
    },
    {
      $set: {
        password: encrypted,
        passwordToken: undefined,
        passwordExpires: undefined
      }
    },
    function (err, user) {
      // var smtptransport2 = nodemailer.createTransport({
      // 	host: 'smtp.gmail.com',
      // 	port: 587,
      // 	secure: false,
      // 	// port: 465,
      // 	// secure: true, // use SSL
      // 	auth: {
      // 		user: 'anas3rde@gmail.com',
      // 		pass: '8123342590'
      // 	}
      // });
      console.log({ user });
      if (user) {
        let mailOptions = {
          to: user.email,
          from: "anas3rde@gmail.com",
          subject: "Password Changed - DocMz",
          text:
            "Your password has been successfully changed" +
            "\n\n" +
            "Feel free to log in with your newly set password."
        };

        let transporter = nodemailer.createTransport(smtpConfig);
        transporter.sendMail(mailOptions, function (err) {
          done(err);
        });
        res.status(200).json({ status: true, message: "Password Set" });
      } else {
        res.status(404).json({ status: false, message: "Token Expired" });
      }
    }
  );
}

//Function to update profile
let updateProfile = (req, res) => {
  delete req.body.email; //should not  be sent from frontend
  delete req.body.password; //should not be sent from frontend
  let { id } = req.body;
  User.findByIdAndUpdate(id, req.body, { new: true })
    .populate("appointments")
    .then(data => {
      res.status(200).json({ status: true, message: "Profile Updated", data });
    })
    .catch(error => {
      res.status(404).json({ status: false, message: error });
    });
};

let getPatient = (req, res) => {
  let { id } = req.body;
  User.findById(id)
    .populate("appointments")
    .populate("favourites")
    .then(data => {
      res
        .status(200)
        .json({ status: true, message: "Patient details fetched", data });
    })
    .catch(error => {
      res.status(403).json({ status: false, message: error });
    });
};

// SET STORAGE

let uploadImage = (req, res, next) => {
  const file = req.file;
  const id = req.body.id;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  User.findByIdAndUpdate({ _id: id }, { imagePath: file.path }, { new: true })
    .then(() => {
      res.status(200).json({
        status: true,
        message: "succesfully uploaded image"
      });
    })
    .catch(err => {
      res.status(501).json({
        status: false,
        message: err
      });
    });
  // res.send(file);
};

let faceRecognise = (req, res) => {
  var socket = io.connect("http://192.168.1.2:5000/");
  socket.on('connect', async client => {
    client.emit('VideoImage', req.videodata);
    User.findOne({ email: req.email })
      .then((user) => {
        client.emit('UploadImage', user.imagePath);
      })
      .catch(err => {
        res.status(200).json({
          status: false,
          message: err
        });
      });

    socket.emit('Recognise', 'Hello');
    socket.addEventListener('output', (percentage) => {
      if (percentage > 0.8) {
        res.status(200).json({
          status: true,
          message: "User recognised successfully"
        });
      }
      else {
        res.status(500).json({
          status: false,
          message: "User not recognised try again"
        })
      }
    });
  });
}

let attemptQuiz = (req, res) => {
  Appointment.findOneAndUpdate({ _id: req.body.id }, { quiz: req.body.quiz })
    .then(result => {
      console.log(result);

      res.status(200).json({
        status: true,
        message: "Successfully added Quiz"
      });
    })
    .catch(err =>
      res.status(500).json({
        status: false,
        message: err
      })
    );
};

addFavourite = (req, res) => {
  const { id, docId } = req.body;
  User.findOneAndUpdate(
    { _id: id, favourites: { $ne: docId } },
    { $push: { favourites: docId } },
    { new: true }
  )
    .then(result => {
      // console.log(result);
      if (result !== null) {
        res.status(200).json({
          message: "Successfully added to favourites",
          status: true
        });
      } else {
        res.status(201).json({
          status: false,
          message: "Already in favourites"
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        err: err,
        message: "Something went wrong"
      });
    });
};

removeFavourite = (req, res) => {
  const { id, docId } = req.body;
  User.findOneAndUpdate(
    { _id: id },
    { $pull: { favourites: docId } },
    { new: true }
  )
    .then(result => {
      // console.log(result);

      res.status(200).json({
        message: "Successfully removed from favourites",
        status: true
      });
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        err: err,
        message: "Something went wrong"
      });
    });
};

//------------------------member-----------------------------------------
const addMember = (req, res) => {
  // console.log(req.body);
  let {
    firstName,
    lastName,
    birthdate,
    gender,
    email,
    relationship,
    metaId
  } = req.body;

  birthdate = new Date(birthdate);

  const member = new Member({
    firstName,
    lastName,
    birthdate,
    gender,
    email,
    relationship
  });

  member
    .save()
    .then(data => {
      Usermeta.findOneAndUpdate(
        { _id: metaId },
        { $push: { members: data._id } }
      )
        .then(result => {
          // console.log(result);
          res.status(200).json({
            message: "Successfully updated member",
            status: true,
            data
          });
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            message: "Something went wrong",
            status: false,
            err: err
          });
        });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        message: "Something went wrong",
        status: false,
        err: err
      });
    });
};

const updateMember = (req, res) => {
  Member.findOneAndUpdate({ _id: req.body.id }, req.body, { new: true })
    .then(data => {
      res.status(200).json({
        message: "Successfully updated member",
        status: true
      });
    })
    .catch(err =>
      res.status(500).json({
        message: "Something went wrong",
        status: false,
        err: err
      })
    );
};

const deleteMember = (req, res) => {
  Usermeta.findOneAndUpdate(
    { _id: req.body.metaId },
    { $pull: { members: req.body.memberId } },
    { new: true }
  )
    .then(data => {
      res.status(200).json({
        message: "Successfully updated member",
        status: true
      });
    })
    .catch(err =>
      res.status(500).json({
        message: "Something went wrong",
        status: false,
        err: err
      })
    );
};

const getMember = (req, res) => {
  Usermeta.findOne({ _id: req.body.metaId })
    .select("members")
    .populate("members")
    .then(data => {
      res.status(200).json({
        message: "Successfully updated member",
        status: true,
        data
      });
    })
    .catch(err =>
      res.status(500).json({
        message: "Something went wrong",
        status: false,
        err: err
      })
    );
};

//-------------------------medicalInfo---------------------

const getMeta = (req, res) => {
  Usermeta.findOne({ _id: req.body.id })
    .then(result => {
      res.status(200).json({
        message: "Successfully fetched patient meta deta",
        data: result,
        status: true
      });
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        message: "Something went wrong",
        err
      });
    });
};

addMedicalInfo = async (req, res) => {
  let { id, meta, field, data } = req.body;
  if (typeof data === "string") {
    data = JSON.parse(data);
  }

  let d1 = await User.findOneAndUpdate(
    { _id: id },
    { [field]: data },
    { new: true }
  );
  let d2 = await Usermeta.findOneAndUpdate(
    { _id: meta },
    { $push: { [field]: data } },
    { new: true }
  );
  Promise.all([d1, d2])
    .then(result => {
      console.log(result);
      res
        .status(200)
        .json({ status: true, message: "Successfully updated data" });
    })
    .catch(err => {
      res.status(500).json({
        status: false,
        err: err,
        message: "Something went wrong"
      });
    });
};

getMedicalInfo = (req, res) => { };
//Exporting all the functions
module.exports = {
  authenticate,
  authenticatebyImage,
  register,
  updateProfile,
  assignToken,
  setPassword,
  getProfileDetails,
  getPatient,
  uploadImage,
  attemptQuiz,
  addFavourite,
  removeFavourite,
  addMedicalInfo,
  addMember,
  updateMember,
  deleteMember,
  getMember,
  getMeta,
  faceRecognise
};
