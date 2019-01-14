const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uuidv4 = require("uuid/v4");

const User = require("../models/user");

exports.createUser = (req, res, next) => {
  bcrypt.hash(req.body.password, 10).then(hash => {
    const user = new User({
      email: req.body.email,
      password: hash
    });
    user
      .save()
      .then(result => {
        res.status(201).json({
          message: "user created!",
          result: result
        });
      })
      .catch(error => {
        res.status(500).json({
          message: "Invalid authentication credentials!"
        });
      });
  });
};
exports.refreshToken = async (req, res, next) => {
  const refreshToken = req.headers["x-auth"].split(" ")[1];

  const decodedToken = jwt.decode(refreshToken);
  const { userId, id } = decodedToken;

  const user = await User.findById(userId);
  const refreshId = user.tokens.find(el => el === id);

  try {
    jwt.verify(refreshToken, "process.env.JWT_KEY" + refreshId);
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      "process.env.JWT_KEY",
      { expiresIn: "10s" }
    );
    res.status(200).json({ token });
  } catch (err) {
    res.status(401).json({
      message: "You are not authenticated!"
    });
  }
};
exports.logout = async (req, res, next) => {
  const refreshToken = req.headers["x-auth"].split(" ")[1];

  const decodedToken = jwt.decode(refreshToken);
  const { userId, id } = decodedToken;

  await User.updateOne(
    { _id: userId },
    {
      $pull: {
        tokens: id
      }
    }
  );
};
exports.userLogin = async (req, res, next) => {
  let fetchedUser;
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return res.status(401).json({
          message: "Auth failed!"
        });
      }
      fetchedUser = user;
      return bcrypt.compare(req.body.password, user.password);
    })
    .then(result => {
      if (!result) {
        return res.status(401).json({
          message: "Auth failed!"
        });
      }
      const token = jwt.sign(
        { email: fetchedUser.email, userId: fetchedUser._id },
        "process.env.JWT_KEY",
        { expiresIn: "10s" }
      );

      const uuid = uuidv4();
      fetchedUser.tokens.push(uuid);
      fetchedUser.save().then(user => {
        const refreshToken = jwt.sign(
          { email: user.email, userId: user._id, id: uuid },
          "process.env.JWT_KEY" + uuid,
          { expiresIn: "1d" }
        );
        res.status(200).json({
          token: token,
          refreshToken,
          expiresIn: 3600,
          userId: user._id
        });
      });
    })
    .catch(err => {
      return res.status(401).json({
        message: "Invalid authentication credentials!"
      });
    });
};
