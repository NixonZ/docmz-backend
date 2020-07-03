const multer = require("multer"),
  fs = require("fs"),
  path = require("path");

const uploadImg = (req, res, next) => {
  console.log("it came here");
  const file = req.files;
  console.log(file);
  const id = req.body.id;
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  res.send(file);
};

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(path.join(__dirname, "../public/chat/" + req.body.chatId));
    } catch (err) {}

    cb(null, "public/chat/" + req.body.chatId);
  },
  filename: (req, file, cb) => {
    let filename = file.originalname.split(".")[0];
    cb(null, filename + "-" + Date.now() + path.extname(file.originalname));
  }
});

let uploadMulter = multer({
  storage: storage,
  limits: {
    fileSize: 420 * 150 * 200
  }
});

module.exports = {
  uploadImg,
  uploadMulter
};
