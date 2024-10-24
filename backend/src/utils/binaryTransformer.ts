import { promisify } from "util";
import zlib from "zlib";

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

export const convertObjectToBinary = async (obj: any): Promise<string> => {
  try {
    const json = typeof obj === 'object' ? JSON.stringify(obj) : obj;
    const compressed = await gzip(json);
    const base64 = compressed.toString('base64');
    return base64;
  } catch (error) {
    throw error;
  }
};

export const convertBinaryToObject = async (binary: string): Promise<any> => {
  try {
    const buffer = Buffer.from(binary, 'base64');

    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Decoded data is not a valid buffer');
    }

    const decompressed = await gunzip(buffer);
    const json = decompressed.toString();
    return JSON.parse(json);
  } catch (error) {
    throw error;
  }
};