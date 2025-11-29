// controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { proxyRequest } from "@/utils/proxy";
import { SERVICES } from "@/config/services";

export const createUser = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/user`,
        method: 'POST',
        body: req.body
    });

export const getAllUsers = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/users`,
        method: 'GET'
    });

export const getUserById = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/user/${req.params.id}`,
        method: 'GET'
    });

export const updateUser = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/user/${req.params.id}`,
        method: 'PUT',
        body: req.body
    });

export const deleteUser = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/user/${req.params.id}`,
        method: 'DELETE'
    });