import { promisify } from "util";
import { client } from "../config/redis";
import {
  convertBinaryToObject,
  convertObjectToBinary
} from "../utils/binaryTransformer";

client.on("error", (err) => console.log("Redis Client Error", err));

client
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err) => {
    console.error("Error connecting to Redis:", err);
  });

const getAsync = async (key: string) => {
  try {
    const data = await promisify(client.get).bind(client)(key);

    if (!data) {
      return null;
    }

    return convertBinaryToObject(data);
  } catch (error) {
    return null;
  }
};

const setAsync = async ({ key, value }: { key: string; value: any }) => {
  try {
    const binaryValue = await convertObjectToBinary(value);
    await client.setEx(key, 3600, binaryValue);
  } catch (error) {
    console.error("Error setting data in Redis:", error);
  }
};

const timeoutStorage = new Map();
const usersViewingEvent = new Map();

export { getAsync, setAsync, timeoutStorage, usersViewingEvent };
