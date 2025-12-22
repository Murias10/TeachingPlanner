import { Request, Response, NextFunction } from "express";
import axios from "axios";
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

// Google OAuth routes
export const googleInitiate = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/google/initiate`,
        method: 'GET'
    });

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('[GATEWAY DEBUG] googleCallback invoked');
        const { code, state } = req.query;
        console.log('[GATEWAY DEBUG] Query params - code:', code ? 'present' : 'missing', 'state:', state ? 'present' : 'missing');

        const queryParams = new URLSearchParams({
            code: code as string,
            state: state as string
        }).toString();

        console.log('[GATEWAY DEBUG] Forwarding to auth_service:', `${SERVICES.AUTH}/auth/google/callback?${queryParams}`);
        const response = await axios.get(`${SERVICES.AUTH}/auth/google/callback?${queryParams}`, {
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 400
        });

        console.log('[GATEWAY DEBUG] Auth service response status:', response.status);
        console.log('[GATEWAY DEBUG] Auth service response headers:', response.headers);

        // Si el auth service devolvió una redirección
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers['location'];
            console.log('[GATEWAY DEBUG] Redirect detected, location header:', location);
            if (location) {
                console.log('[GATEWAY DEBUG] Redirecting browser to:', location);
                res.redirect(location);
                return;
            }
        }

        // Si no es redirect, pasar la respuesta normal
        console.log('[GATEWAY DEBUG] No redirect, sending response data');
        res.status(response.status).send(response.data);
    } catch (error: any) {
        console.log('[GATEWAY DEBUG] Exception caught:', error.message);
        // Manejar redirecciones de axios
        if (error.response && error.response.status >= 300 && error.response.status < 400) {
            const location = error.response.headers['location'];
            console.log('[GATEWAY DEBUG] Redirect in error handler, location:', location);
            if (location) {
                console.log('[GATEWAY DEBUG] Redirecting browser to (from error):', location);
                res.redirect(location);
                return;
            }
        }
        console.log('[GATEWAY DEBUG] Passing error to next middleware');
        next(error);
    }
};

export const googleDisconnect = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/google/disconnect`,
        method: 'POST'
    });

export const googleStatus = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.AUTH}/auth/google/status`,
        method: 'GET'
    });

// Calendar sync routes (academic calendars, not classrooms)
export const getCalendarSyncs = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar-sync`,
        method: 'GET'
    });

export const toggleCalendarSync = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar-sync/${req.params.id}/toggle`,
        method: 'PATCH'
    });

export const syncNow = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar-sync/${req.params.id}/sync-now`,
        method: 'POST',
        body: req.body
    });

export const deleteAllUserCalendarSyncs = (req: Request, res: Response, next: NextFunction) =>
    proxyRequest(req, res, next, {
        url: `${SERVICES.PLANNER}/calendar-sync/user/all`,
        method: 'DELETE',
        body: req.body
    });
