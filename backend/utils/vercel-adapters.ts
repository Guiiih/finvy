import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Request, Response } from 'express'

export function toVercelRequest(req: Request): VercelRequest {
  return req as VercelRequest
}

export function toVercelResponse(res: Response): VercelResponse {
  const vercelResponse = Object.create(res) as VercelResponse

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vercelResponse.send = (body: any) => {
    res.send(body)
    return vercelResponse
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vercelResponse.json = (jsonBody: any) => {
    res.json(jsonBody)
    return vercelResponse
  }

  vercelResponse.status = (statusCode: number) => {
    res.status(statusCode)
    return vercelResponse
  }

  vercelResponse.redirect = (statusOrUrl: number | string, url?: string) => {
    if (typeof statusOrUrl === 'string') {
      res.redirect(statusOrUrl)
    } else if (url) {
      res.redirect(statusOrUrl, url)
    }
    return vercelResponse
  }

  vercelResponse.setHeader = (name: string, value: string | string[]) => {
    res.setHeader(name, value)
    return vercelResponse
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vercelResponse.end = (chunk?: any, encoding?: BufferEncoding | (() => void), cb?: () => void) => {
    if (typeof encoding === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(res.end as any)(chunk, encoding)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(res.end as any)(chunk, encoding, cb)
    }
    return vercelResponse
  }

  return vercelResponse
}
