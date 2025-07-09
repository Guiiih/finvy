import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Request, Response } from "express";

export function toVercelRequest(req: Request): VercelRequest {
  return {
    query: req.query,
    cookies: req.cookies,
    body: req.body,
    method: req.method,
    url: req.url,
    headers: req.headers,
  } as VercelRequest;
}

export function toVercelResponse(res: Response): VercelResponse {
  return {
    send: res.send.bind(res),
    json: res.json.bind(res),
    status: res.status.bind(res),
    redirect: res.redirect.bind(res),
    setHeader: res.setHeader.bind(res),
  } as VercelResponse;
}
