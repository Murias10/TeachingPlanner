import { Request, Response, NextFunction } from "express";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user_service:3001';

export const createUser = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${USER_SERVICE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    })
        .then(async (response) => {
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const getAllUsers = (req: Request, res: Response, next: NextFunction) => {
    fetch(`${USER_SERVICE_URL}/api/users`)
        .then(async (response) => {
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const getUserById = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`${USER_SERVICE_URL}/api/users/${id}`)
        .then(async (response) => {
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const updateUser = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`${USER_SERVICE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
    })
        .then(async (response) => {
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};

export const deleteUser = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    fetch(`${USER_SERVICE_URL}/api/users/${id}`, {
        method: 'DELETE'
    })
        .then(async (response) => {
            const body = await response.json();
            res.status(response.status).json(body);
        })
        .catch(next);
};