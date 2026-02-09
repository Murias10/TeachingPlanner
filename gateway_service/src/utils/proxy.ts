import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig } from 'axios';

interface ProxyRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  includeAuth?: boolean;
  additionalHeaders?: Record<string, string>;
}

// Headers que no deben ser copiados de la respuesta del servidor
const EXCLUDED_HEADERS = new Set(['content-encoding', 'transfer-encoding']);

/**
 * Construir headers para la request
 */
const buildRequestHeaders = (
  req: Request,
  options: ProxyRequestOptions
): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.additionalHeaders
  };

  if (options.includeAuth !== false && req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  return headers;
};

/**
 * Copiar headers relevantes de la respuesta
 */
const copyResponseHeaders = (
  responseHeaders: Record<string, any>,
  res: Response
): void => {
  for (const [key, value] of Object.entries(responseHeaders)) {
    if (value && !EXCLUDED_HEADERS.has(key.toLowerCase())) {
      res.setHeader(key, value);
    }
  }
};

/**
 * Manejar error de axios
 */
const handleAxiosError = (error: any, res: Response, next: NextFunction): void => {
  if (axios.isAxiosError(error) && error.response) {
    copyResponseHeaders(error.response.headers, res);
    res.status(error.response.status).json(error.response.data);
    return;
  }

  next(error);
};

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
    const headers = buildRequestHeaders(req, options);

    // Construir la URL con query parameters si existen
    let url = options.url;
    if (req.query && Object.keys(req.query).length > 0) {
      const queryString = new URLSearchParams(req.query as Record<string, string>).toString();
      url = `${url}?${queryString}`;
    }

    const axiosConfig: AxiosRequestConfig = {
      method: options.method || 'GET',
      url,
      headers,
      ...(options.body && { data: options.body })
    };

    const response = await axios(axiosConfig);

    copyResponseHeaders(response.headers, res);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleAxiosError(error, res, next);
  }
};

/**
 * Construir headers para binary request
 */
const buildBinaryRequestHeaders = (
  req: Request,
  options: ProxyRequestOptions
): Record<string, string> => {
  const headers: Record<string, string> = {
    ...options.additionalHeaders
  };

  if (options.includeAuth !== false && req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  return headers;
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
    const headers = buildBinaryRequestHeaders(req, options);

    const axiosConfig: AxiosRequestConfig = {
      method: options.method || 'GET',
      url: options.url,
      headers,
      responseType: 'arraybuffer',
      ...(options.body && { data: options.body })
    };

    const response = await axios(axiosConfig);

    copyResponseHeaders(response.headers, res);
    res.status(response.status).send(Buffer.from(response.data));
  } catch (error) {
    handleAxiosError(error, res, next);
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
