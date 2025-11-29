import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig } from 'axios';

interface ProxyRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  includeAuth?: boolean;
  additionalHeaders?: Record<string, string>;
}

/**
 * Centralizado proxy request handler
 * Maneja:
 * - Llamadas a microservicios
 * - Propagación de headers (especialmente Authorization)
 * - Transformación de respuestas
 * - Manejo consistente de errores
 */
export const proxyRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
  options: ProxyRequestOptions
) => {
  try {
    // Construir headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.additionalHeaders || {})
    };

    // Incluir Authorization si está disponible y se solicita
    if (options.includeAuth !== false && req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    // Configurar opciones de axios
    const axiosConfig: AxiosRequestConfig = {
      method: options.method || 'GET',
      url: options.url,
      headers,
      ...(options.body && { data: options.body })
    };

    // Realizar la request
    const response = await axios(axiosConfig);

    // Copiar headers relevantes de la respuesta
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value && !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Enviar respuesta
    res.status(response.status).json(response.data);
  } catch (error) {
    // Si es error de axios, preservar status y datos
    if (axios.isAxiosError(error)) {
      if (error.response) {
        Object.entries(error.response.headers).forEach(([key, value]) => {
          if (value && !['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
            res.setHeader(key, value);
          }
        });
        res.status(error.response.status).json(error.response.data);
        return;
      }
    }

    // Pasar al error handler
    next(error);
  }
};

/**
 * Handler para descarga de archivos (binary response)
 */
export const proxyBinaryRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
  options: ProxyRequestOptions
) => {
  try {
    const headers: Record<string, string> = {
      ...(options.additionalHeaders || {})
    };

    if (options.includeAuth !== false && req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    const axiosConfig: AxiosRequestConfig = {
      method: options.method || 'GET',
      url: options.url,
      headers,
      responseType: 'arraybuffer',
      ...(options.body && { data: options.body })
    };

    const response = await axios(axiosConfig);

    // Copiar headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value) {
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(Buffer.from(response.data));
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
      return;
    }
    next(error);
  }
};

/**
 * Helper para obtener headers de proxy con soporte a Authorization
 */
export const getProxyHeaders = (req: Request, additionalHeaders: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = { ...additionalHeaders };
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  return headers;
};
