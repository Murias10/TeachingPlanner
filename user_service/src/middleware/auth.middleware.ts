import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/utils/jwt";

// Define el tipo del payload del token
interface JwtPayload {
    userId: string;
}

// Extiende el tipo Request para incluir la propiedad 'user'
interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(401).json({ message: "Token requerido" });
        return;
    }
    try {
        const payload = verifyToken(token) as JwtPayload;
        req.user = payload;
        next();
    } catch {
        res.status(403).json({ message: "Token inválido" });
    }
};
