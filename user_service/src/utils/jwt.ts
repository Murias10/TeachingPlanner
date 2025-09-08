import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "supersecret";

export const generateToken = (payload: { userId: string }) =>
    jwt.sign(payload, secret, { expiresIn: "1h" });

export const verifyToken = (token: string) =>
    jwt.verify(token, secret);
