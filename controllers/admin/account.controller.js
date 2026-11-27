const AccountAdmin = require("../../models/account-admin.model");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const {
  generateRandomNumber
} = require("../../helpers/generate.helper");
const ForgotPassword = require("../../models/forgot-password.model");
const mailHelper = require("../../helpers/mail.helper");

module.exports.login = async (req, res) => {
  res.render("admin/pages/login", {
    pageTitle: "Đăng nhập"
  });
}

module.exports.loginPost = async (req, res) => {
  const {
    email,
    password,
    rememberPassword
  } = req.body;

  const existAccount = await AccountAdmin.findOne({
    email: email,
    deleted: false
  })

  if(!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thống!"
    })
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, existAccount.password);

  if(!isPasswordValid) {
    res.json({
      code: "error",
      message: "Mật khẩu không đúng!"
    })
    return;
  }

  if(existAccount.status != "active") {
    res.json({
      code: "error",
      message: "Tài khoản chưa được kích hoạt!"
    })
    return;
  }

  const token = jwt.sign({
      id: existAccount.id,
      email: existAccount.email,
      tokenVersion: existAccount.tokenVersion || 0,
      purpose: "login",
    },
    process.env.JWT_SECRET, {
      expiresIn: rememberPassword ? "7d" : "1d"
    }
  );

  res.cookie("token", token, {
    maxAge: rememberPassword ? (7 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });

  res.json({
    code: "success",
    message: "Đăng nhập thành công!"
  })
}

module.exports.register = async (req, res) => {
  res.render("admin/pages/register", {
    pageTitle: "Đăng ký"
  });
}

module.exports.registerPost = async (req, res) => {
  const existAccount = await AccountAdmin.findOne({
    email: req.body.email
  })

  if(existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!"
    })
    return;
  }

  req.body.status = "initial";

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  req.body.password = await bcrypt.hash(req.body.password, salt);

  const newAccount = new AccountAdmin({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    status: "initial"
  });
  await newAccount.save();

  res.json({
    code: "success",
    message: "Đăng ký tài khoản thành công!"
  })
}

module.exports.registerInitial = async (req, res) => {
  res.render("admin/pages/register-initial", {
    pageTitle: "Tài khoản đã được khởi tạo"
  });
}

module.exports.forgotPassword = async (req, res) => {
  res.render("admin/pages/forgot-password", {
    pageTitle: "Quên mật khẩu"
  });
}

module.exports.forgotPasswordPost = async (req, res) => {
  const {
    email
  } = req.body;

  // Kiểm tra email có tồn tại trong CSDL
  const existAccount = await AccountAdmin.findOne({
    email: email,
    status: "active",
    deleted: false
  })

  if(!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thống!"
    })
    return;
  }

  // Kiểm tra email đã tồn tại trong ForgotPassword hay chưa
  const existEmailInForgotPassword = await ForgotPassword.findOne({
    email: email,
    expireAt: {
      $gt: new Date()
    }
  })

  if(existEmailInForgotPassword) {
    res.json({
      code: "error",
      message: "Vui lòng gửi lại yêu cầu sau 5 phút!"
    })
    return;
  }

  // Tạo mã OTP
  const otp = generateRandomNumber(6);

  // Lưu vào CSDL: email và otp (lưu trong 5 phút)
  const newRecord = new ForgotPassword({
    email: email,
    otp: require("crypto")
      .createHash("sha256")
      .update(otp)
      .digest("hex"),
    expireAt: Date.now() + 5 * 60 * 1000
  });
  await newRecord.save();

  // Gửi mã OTP qua email
  const title = `Mã OTP lấy lại mật khẩu`;
  const content =
    `Mã OTP của bạn là <b style="color: green; font-size: 20px;">${otp}</b>. Mã OTP có hiệu lực trong 5 phút, vui lòng không cung cấp cho bất kỳ ai.`;
  try {
    await mailHelper.sendMail(email, title, content);
  } catch (error) {
    await ForgotPassword.deleteOne({
      _id: newRecord.id
    });
    return res.status(502)
      .json({
        code: "error",
        message: "Chưa gửi được email. Vui lòng thử lại sau."
      });
  }

  res.json({
    code: "success",
    message: "Đã gửi mã OTP qua email!"
  })
}

module.exports.otpPassword = async (req, res) => {
  res.render("admin/pages/otp-password", {
    pageTitle: "Nhập mã OTP"
  });
}

module.exports.otpPasswordPost = async (req, res) => {
  const {
    email,
    otp
  } = req.body;

  // Kiểm tra email có tồn tại trong CSDL
  const existAccount = await AccountAdmin.findOne({
    email: email,
    status: "active",
    deleted: false
  })

  if(!existAccount) {
    res.json({
      code: "error",
      message: "Email không tồn tại trong hệ thống!"
    })
    return;
  }

  const otpHash = require("crypto")
    .createHash("sha256")
    .update(otp)
    .digest("hex");
  const record = await ForgotPassword.findOneAndUpdate({
    email,
    expireAt: {
      $gt: new Date()
    },
    attempts: {
      $lt: 5
    }
  }, {
    $inc: {
      attempts: 1
    }
  }, {
    new: true,
    sort: {
      createdAt: -1
    }
  });
  if(!record || record.otp !== otpHash) {
    return res.json({
      code: "error",
      message: "Mã OTP không hợp lệ hoặc đã hết hạn."
    });
  }
  const consumed = await ForgotPassword.findOneAndDelete({
    _id: record.id,
    otp: otpHash
  });
  if(!consumed) {
    return res.json({
      code: "error",
      message: "Mã OTP đã được sử dụng."
    });
  }
  const token = jwt.sign({
    id: existAccount.id,
    purpose: "reset",
    tokenVersion: existAccount.tokenVersion || 0
  }, process.env.JWT_SECRET, {
    expiresIn: "10m"
  });
  res.cookie("resetToken", token, {
    maxAge: 10 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });

  res.json({
    code: "success",
    message: "Xác thực thành công!"
  })
}

module.exports.resetPassword = async (req, res) => {
  res.render("admin/pages/reset-password", {
    pageTitle: "Đổi mật khẩu"
  });
}

module.exports.resetPasswordPost = async (req, res) => {
  const {
    password
  } = req.body;

  // Mã hóa mật khẩu
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  const result = await AccountAdmin.updateOne({
    _id: req.account.id,
    deleted: false,
    status: "active",
    $or: req.account.tokenVersion ? [{
      tokenVersion: req.account.tokenVersion
    }] : [{
      tokenVersion: 0
    }, {
      tokenVersion: {
        $exists: false
      }
    }]
  }, {
    $set: {
      password: hashPassword
    },
    $inc: {
      tokenVersion: 1
    }
  });
  if(!result.matchedCount) {
    return res.status(401)
      .json({
        code: "error",
        message: "Yêu cầu đổi mật khẩu đã được sử dụng. Vui lòng xác thực OTP lại."
      });
  }

  res.clearCookie("resetToken");
  res.clearCookie("token");
  res.json({
    code: "success",
    message: "Đã đổi mật khẩu thành công. Vui lòng đăng nhập lại!"
  })
}

module.exports.logoutPost = async (req, res) => {
  res.clearCookie("token");
  res.json({
    code: "success",
    message: "Đã đăng xuất!"
  })
}
