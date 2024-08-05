import sharp from "sharp";
import fs from "fs";

process.on("message", async (filePath: string) => {
  const outputFilePath = filePath.replace(/(\.[\w\d_-]+)$/i, "-processed$1");
  console.log(outputFilePath, "asta i ruta");

  sharp(filePath)
    .resize(500, 500)
    .toFile(outputFilePath, (err, info) => {
      if (process?.send) {
        if (err) {
          process.send({ error: err });
        } else {
          fs.unlinkSync(filePath);
          process.send({ processedPath: outputFilePath, info });
        }
      }
    });
});
