import { Request, Response, NextFunction } from "express";
import { proxyRequest } from "@/utils/proxy";
import { SERVICES } from "@/config/services";

export const login = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/login`,
        method: 'POST',
        body: req.body
    });

export const validateToken = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/validate`,
        method: 'POST'
    });

export const getProfile = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/profile`,
        method: 'GET'
    });

export const logout = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/logout`,
        method: 'POST'
    });

export const forgotPassword = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/forgot-password`,
        method: 'POST',
        body: req.body
    });

export const verifyOTP = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/verify-otp`,
        method: 'POST',
        body: req.body
    });

export const resetPassword = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/reset-password`,
        method: 'POST',
        body: req.body
    });

export const activateAccount = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/activate`,
        method: 'POST',
        body: req.body
    });
