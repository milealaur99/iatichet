const sharp = require("sharp");
const fs = require("fs");

process.on("message", async (filePath) => {
  if (typeof filePath !== "string") {
    throw new Error("filePath must be a string");
  }
  const outputFilePath = filePath.replace(/(\.[\w\d_-]+)$/i, "-processed$1");

  sharp(filePath)
    .resize(500, 500)
    .toFile(outputFilePath, (err, info) => {
      if (process && process.send) {
        if (err) {
          process.send({ error: err });
        } else {
          fs.unlinkSync(filePath);
          process.send({
            processedPath: outputFilePath.replace("backend/", ""),
            info
          });
        }
      }
    });
});
