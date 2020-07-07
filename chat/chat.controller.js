const multer = require("multer"),
  fs = require("fs"),
  path = require("path"),
  chatModel = require("./chat.model");

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

const storage = multer.diskStorage({
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

const uploadMulter = multer({
  storage: storage,
  limits: {
    fileSize: 420 * 150 * 200
  }
});

const getChat = async (req, res) => {
  const { chatIds, timestamp } = req.body;
  console.log(req.body);
  if (!chatIds) {
    console.log("no chatids");
    res.status(401).send({ message: "Please send chatIds" });
    return;
  }

  let dataRes = {};

  for (const chatId of chatIds) {
    const model = chatModel(chatId);
    dataRes[chatId] = await model.find({
      time: { $gt: timestamp ?? 0 }
    });
  }

  res.send(dataRes);
};

module.exports = {
  uploadImg,
  uploadMulter,
  getChat
};
