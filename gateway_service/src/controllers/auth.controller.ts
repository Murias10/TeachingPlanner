import { Request, Response, NextFunction } from "express";

const AUTH_SERVICE_URL = 'http://auth_service:5003';

export const login = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${AUTH_SERVICE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};

export const register = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${AUTH_SERVICE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': token })
        }
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};

export const getProfile = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    fetch(`${AUTH_SERVICE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': token })
        }
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${AUTH_SERVICE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch((error) => {
            next(error);
        });
};
