import jwt from "jsonwebtoken";

export const getTokenFromHeader = (
  req: Request & { headers: { [key: string]: string } | undefined }
) => {
  if (
    req?.headers["authorization"] &&
    req?.headers["authorization"].startsWith("Bearer")
  ) {
    return req?.headers["authorization"].split(" ")[1];
  }
  return null;
};

const algorithm = "HS256";
const expiresIn = "2h";

export const sign = (payload: {
  username: string;
  id: string;
  password: string;
  role: string;
}) => {
  const secret = process.env.JWT_SECRET as string;

  return jwt.sign(payload, secret, { algorithm, expiresIn });
};

export const verify = (token: string) => {
  try {
    const secret = process.env.JWT_SECRET as string;
    return jwt.verify(token, secret, { algorithms: [algorithm] });
  } catch (err) {
    throw new Error("Invalid token");
  }
};

export const decode = (token: string) => {
  return jwt.decode(token, { complete: true }) as {
    header: { alg: string };
    payload: {
      username: string;
      id: string;
      password: string;
      role: string;
    };
    signature: string;
  };
};
