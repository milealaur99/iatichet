import { createClient } from "redis";

const client = createClient({
  legacyMode: true,
  socket: {
    port: process.env.REDIS_PORT as unknown as number,
    host: process.env.REDIS_HOST as string
  }
});

client.on("error", (err, info, extra) => {
  console.log("Redis Client Error", err, info, extra);
});

client.connect().then(() => {
  console.log("Redis connected");
});

export { client };
