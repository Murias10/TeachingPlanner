// controllers/user.controller.ts
import { Request, Response, NextFunction } from "express";

const USER_SERVICE_URL = `http://user_service:5002`;

export const createUser = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${USER_SERVICE_URL}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const getAllUsers = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${USER_SERVICE_URL}/users`)
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const getUserById = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`${USER_SERVICE_URL}/user/${id}`)
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const updateUser = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`${USER_SERVICE_URL}/user/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const deleteUser = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`${USER_SERVICE_URL}/user/${id}`, {
        method: 'DELETE'
    })
        .then(async (response) => {
            response.headers.forEach((value, key) => {
                res.setHeader(key, value);
            });
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};