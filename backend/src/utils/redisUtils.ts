import { promisify } from "util";
import client from "../config/redis";
import {
  convertBinaryToObject,
  convertObjectToBinary,
} from "../utils/binaryTransformer";

const getAsync = promisify(async (key: string) => {
  const data = await client.get(key);
  if (!data) {
    return null;
  }
  const binaryData = JSON.parse(data);
  return convertBinaryToObject(binaryData);
}).bind(client);

const setAsync = promisify(
  async ({ key, value }: { key: string; value: any }) => {
    const binaryValue = await convertObjectToBinary(value);
    return client.setEx(key, 3600, binaryValue);
  }
).bind(client);

export { getAsync, setAsync };
