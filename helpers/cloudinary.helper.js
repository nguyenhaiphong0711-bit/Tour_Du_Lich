const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports.storage = {
  _handleFile(req, file, callback) {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image", folder: "tour" }, (error, result) => {
      if(error) return callback(error);
      callback(null, { path: result.secure_url, filename: result.public_id, size: result.bytes });
    });
    file.stream.on("error", error => stream.destroy(error));
    file.stream.pipe(stream);
  },
  _removeFile(req, file, callback) {
    cloudinary.uploader.destroy(file.filename).then(() => callback(null)).catch(callback);
  }
};

module.exports.options = {
  storage: module.exports.storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 11 },
  fileFilter(req, file, callback) {
    if(!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      return callback(new Error("Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF."));
    }
    callback(null, true);
  }
};
