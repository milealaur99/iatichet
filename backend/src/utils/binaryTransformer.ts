import { Transform } from "stream";
import { createGzip, createGunzip, gzipSync, gunzipSync } from "zlib";
import * as JSONStream from "jsonstream";
const SIZE_THRESHOLD = 1024 * 1024;

export const convertObjectToBinary = (obj: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const jsonString = JSON.stringify(obj);
    const jsonSize = Buffer.byteLength(jsonString);

    if (jsonSize > SIZE_THRESHOLD) {
      const jsonStream = JSONStream.stringify();
      const gzip = createGzip();
      const bufferChunks: Buffer[] = [];

      const transformStream = new Transform({
        transform(chunk, encoding, callback) {
          bufferChunks.push(chunk);
          callback();
        },
        flush(callback) {
          const binaryData = Buffer.concat(bufferChunks);
          resolve(binaryData);
          callback();
        },
      });

      jsonStream.on("error", reject);
      gzip.on("error", reject);
      transformStream.on("error", reject);

      jsonStream.pipe(gzip).pipe(transformStream);

      jsonStream.write(obj);
      jsonStream.end();
    } else {
      try {
        const compressedData = gzipSync(jsonString);
        resolve(compressedData);
      } catch (error) {
        reject(
          new Error(
            `Failed to convert object to binary: ${(error as Error)?.message}`
          )
        );
      }
    }
  });
};

export const convertBinaryToObject = (binaryData: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (binaryData.length > SIZE_THRESHOLD) {
      const gunzip = createGunzip();
      const jsonStream = JSONStream.parse("*");
      const chunks: Buffer[] = [];

      gunzip.on("data", (chunk) => {
        chunks.push(chunk);
      });

      gunzip.on("end", () => {
        try {
          const decompressedData = Buffer.concat(chunks).toString();
          const jsonObject = JSON.parse(decompressedData);
          resolve(jsonObject);
        } catch (error) {
          reject(
            new Error(
              `Failed to parse decompressed data: ${(error as Error)?.message}`
            )
          );
        }
      });

      gunzip.on("error", reject);
      jsonStream.on("error", reject);

      gunzip.write(binaryData);
      gunzip.end();
    } else {
      try {
        const decompressedData = gunzipSync(binaryData);
        const jsonObject = JSON.parse(decompressedData.toString());
        resolve(jsonObject);
      } catch (error) {
        reject(
          new Error(
            `Failed to convert binary to object: ${(error as Error)?.message}`
          )
        );
      }
    }
  });
};
