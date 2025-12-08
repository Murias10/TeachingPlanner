// controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { proxyRequest, getProxyHeaders } from "@/utils/proxy";
import { SERVICES } from "@/config/services";
import axios from "axios";
import FormData from "form-data";

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

export const updatePassword = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/user/${req.params.id}/password`,
        method: 'PATCH',
        body: req.body
    });

export const sendActivationEmail = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.USER}/user/${req.params.id}/send-activation`,
        method: 'POST'
    });

export const importUsers = async (req: Request, res: Response) => {
    try {
        const file = req.file as Express.Multer.File;

        if (!file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded'
            });
        }

        // Create FormData to forward to user service
        const formData = new FormData();
        formData.append('file', file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype,
        });

        // Forward sendEmail parameter if present
        if (req.body.sendEmail !== undefined) {
            formData.append('sendEmail', req.body.sendEmail.toString());
        }

        // Forward to user service using axios
        const headers = getProxyHeaders(req, formData.getHeaders());
        const response = await axios.post(
            `${SERVICES.USER}/user/import`,
            formData,
            { headers }
        );

        res.status(response.status).json(response.data);
    } catch (error: any) {
        console.error('Error importing users:', error);
        res.status(error.response?.status || 500).json(
            error.response?.data || { status: 'error', message: 'Failed to import users' }
        );
    }
};