// JAUL: fetch.ts

import {setTimeout as delay} from "node:timers/promises"

/**
 * Response returned when the returnResponse option is set.
 */
export interface FetchResponse {
    status: number
    statusText: string
    ok: boolean
    url: string
    headers: Headers
    data: any
}

/**
 * Request options, on top of the regular fetch request init.
 */
export interface FetchRequestOptions extends Omit<RequestInit, "body" | "headers"> {
    url: string
    /** Prepended to the url, if the url is not absolute. */
    baseURL?: string
    /** Query string parameters, appended to the url. */
    params?: {[key: string]: any}
    timeout?: number
    headers?: {[header: string]: any}
    /** Request body, plain objects and arrays are sent as JSON. */
    body?: any
    /** How to parse the response body, default is "auto" (JSON if the Content-Type says so, otherwise text). */
    responseType?: "auto" | "json" | "text" | "arraybuffer"
    /** Set to true to return the full response object. */
    returnResponse?: boolean
    /** Abort request (returning null) if the response has any of these status codes. */
    abortStatus?: number[]
    /** Optional callback before retrying the request, return false to cancel the retry. */
    onRetry?: (options: FetchRequestOptions) => boolean | void
    /** Optional function to extract the used API quota (0 to 100%) from the response. */
    rateLimitExtractor?: (res: FetchResponse) => number
}

/**
 * Options for [[FetchUtils.create]].
 */
export interface FetchClientOptions {
    /** Default request timeout in milliseconds, default is 120000. */
    timeout?: number
    /** Delay before retrying failed or rate limited requests in milliseconds, default is 1100. */
    retryInterval?: number
    /** Start throttling when the used API quota reaches this percentage, default is 90. */
    backoffThreshold?: number
    /** Base throttling delay in milliseconds, default is 500. */
    backoffInterval?: number
    /** Default User-Agent header, if not set on the request itself. */
    userAgent?: string
    /** Optional logger, receives the same arguments as anyhow's logger.warn(). */
    logger?: {warn: (...args: any[]) => any}
}

/**
 * Client returned by [[FetchUtils.create]].
 */
export interface FetchClient {
    /** Make a request, retrying once on timeouts, rate limits and server errors. */
    request: (options: FetchRequestOptions) => Promise<any>
    /** Delay execution if the response shows the API quota is about to be (or was) exceeded. */
    rateLimitDelay: (res: FetchResponse, logUrl: string, rateLimitExtractor?: (res: FetchResponse) => number) => Promise<void>
}

const customOptions = ["url", "baseURL", "params", "timeout", "headers", "body", "responseType", "signal", "returnResponse", "abortStatus", "onRetry", "rateLimitExtractor"]
const retryableStatus = [429, 500, 502, 503, 504, 520, 597]
const timeoutMessages = ["ECONNRESET", "ECONNABORTED", "ETIMEDOUT", "TIMEOUT", "UND_ERR_SOCKET"]

// Helper to check if a value is a plain object.
const isPlainObject = (value: any): boolean => value && typeof value == "object" && (Array.isArray(value) || [Object.prototype, null].includes(Object.getPrototypeOf(value)))

// Helper to build the full URL with query parameters.
const buildUrl = (options: FetchRequestOptions): URL => {
    const isAbsolute = /^[a-z][a-z\d+\-.]*:/i.test(options.url)
    const url = new URL(options.baseURL && !isAbsolute ? `${options.baseURL.replace(/\/+$/, "")}/${options.url.replace(/^\/+/, "")}` : options.url)

    for (const [key, value] of Object.entries(options.params || {})) {
        for (const v of [].concat(value)) {
            if (v !== undefined && v !== null) url.searchParams.append(key, v)
        }
    }

    return url
}

// Helper to read the response body based on the specified response type.
const readBody = async (res: Response, responseType: string): Promise<any> => {
    if (responseType == "arraybuffer") return Buffer.from(await res.arrayBuffer())

    const text = await res.text()
    if (!text || responseType == "text") return text
    if (responseType == "json") return JSON.parse(text)
    if (!res.headers.get("content-type")?.includes("json")) return text

    try {
        return JSON.parse(text)
    } catch (ex) {
        return text
    }
}

/**
 * Fetch Utilities
 */
export class FetchUtils {
    private static _instance: FetchUtils
    /** @hidden */
    static get Instance() {
        return this._instance || (this._instance = new this())
    }

    /**
     * Create a request client using Node's native fetch.
     * @param clientOptions Optional client options.
     * @returns Client with the request() and rateLimitDelay() helpers.
     */
    create = (clientOptions?: FetchClientOptions): FetchClient => {
        const opts = {timeout: 120000, retryInterval: 1100, backoffThreshold: 90, backoffInterval: 500, ...clientOptions}
        const warn = (...args: any[]) => opts.logger?.warn(...args)

        const rateLimitDelay = async (res: FetchResponse, logUrl: string, rateLimitExtractor?: (res: FetchResponse) => number): Promise<void> => {
            if (res.headers && rateLimitExtractor) {
                try {
                    const usedQuota = rateLimitExtractor(res)
                    const modQuota = usedQuota % 2

                    if (usedQuota > opts.backoffThreshold / 2 && modQuota == 0) {
                        warn("Fetch.rateLimitDelay", logUrl, `Used ${usedQuota.toFixed(1)}% of API quota`)
                    }
                    if (usedQuota >= opts.backoffThreshold) {
                        const multiplier = (usedQuota - opts.backoffThreshold) * 1.5
                        const ms = Math.round(opts.backoffInterval * multiplier)
                        await delay(ms)

                        if (modQuota == 1) {
                            warn("Fetch.rateLimitDelay", logUrl, `Used ${usedQuota.toFixed(1)}% of API quota`, `Delayed ${ms}ms`)
                        }
                    }
                } catch (headerEx) {
                    warn("Fetch.rateLimitDelay", logUrl, "Failed to extract the rate limits", headerEx)
                }
            }
            if (res.status == 429) {
                warn("Fetch.rateLimitDelay", logUrl, "Rate limited")
                await delay(opts.retryInterval)
            }
        }

        // Helper to extract a simplified log URL from the request options.
        const getLogUrl = (options: FetchRequestOptions): string => {
            try {
                const urlInfo = buildUrl(options)
                return `${urlInfo.hostname}${urlInfo.pathname}`
            } catch (ex) {
                return options.url
            }
        }

        // Helper to perform the actual fetch request with the given options.
        const doFetch = async (options: FetchRequestOptions): Promise<FetchResponse> => {
            const init: RequestInit = Object.fromEntries(Object.entries(options).filter(([key]) => !customOptions.includes(key)))
            const headers = new Headers()
            let body = options.body

            for (const [key, value] of Object.entries(options.headers)) {
                if (value !== undefined && value !== null) headers.set(key, value)
            }
            if (opts.userAgent && !headers.has("user-agent")) headers.set("user-agent", opts.userAgent)
            if (isPlainObject(body)) {
                body = JSON.stringify(body)
                if (!headers.has("content-type")) headers.set("content-type", "application/json")
            }

            const timeoutSignal = AbortSignal.timeout(options.timeout)
            const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal
            const res = await fetch(buildUrl(options), {...init, headers, body, signal})
            const data = await readBody(res, res.ok ? options.responseType : "auto")
            const response: FetchResponse = {status: res.status, statusText: res.statusText, ok: res.ok, url: res.url, headers: res.headers, data}

            if (!res.ok) {
                throw Object.assign(new Error(`Request failed with status code ${res.status}`), {response})
            }

            return response
        }

        const processResponse = async (res: FetchResponse, options: FetchRequestOptions, logUrl: string): Promise<any> => {
            await rateLimitDelay(res, logUrl, options.rateLimitExtractor)
            return options.returnResponse ? res : res.status == 204 ? true : res.data
        }

        const request = async (reqOptions: FetchRequestOptions): Promise<any> => {
            const options: FetchRequestOptions = {...reqOptions, headers: {...reqOptions.headers}}
            if (!options.method) options.method = "GET"
            if (!options.timeout) options.timeout = opts.timeout

            const logUrl = getLogUrl(options)

            try {
                const res = await doFetch(options)
                return await processResponse(res, options, logUrl)
            } catch (ex) {
                const response = ex.response as FetchResponse | undefined
                const statusCode = response?.status || 500
                if (!ex.statusCode) ex.statusCode = statusCode

                const message = [ex.name, ex.code, ex.message, ex.cause?.code]
                    .filter((m) => m)
                    .join(" ")
                    .toUpperCase()
                const isTimeout = timeoutMessages.some((m) => message.includes(m))
                const isRetryable = response && retryableStatus.includes(statusCode)
                const accessDenied = response && [401, 403].includes(statusCode)
                const isIdempotent = ["GET", "HEAD", "OPTIONS", "TRACE", "PUT", "DELETE"].includes(options.method.toUpperCase())

                if (response && options.abortStatus?.includes(statusCode)) {
                    warn("Fetch.request", options.method, logUrl, `Aborted with status ${statusCode}`)
                    return null
                }

                // Requests aborted by the caller's own signal are not retried.
                if ((isTimeout || isRetryable) && isIdempotent && !accessDenied && !options.signal?.aborted) {
                    if (response?.status == 429) {
                        await rateLimitDelay(response, logUrl, options.rateLimitExtractor)
                    } else {
                        await delay(opts.retryInterval)
                    }

                    if (options.onRetry && options.onRetry(options) === false) {
                        warn("Fetch.request", options.method, logUrl, ex, "Failed, and retry condition hasn't passed")
                        if (!ex.url) ex.url = options.url
                        if (isTimeout) ex.isTimeout = true
                        throw ex
                    }

                    try {
                        const res = await doFetch(options)
                        warn("Fetch.request", options.method, logUrl, ex, "Failed once, retrying worked")
                        return await processResponse(res, options, logUrl)
                    } catch (innerEx) {
                        if (!innerEx.statusCode) innerEx.statusCode = innerEx.response?.status || 500
                        if (!innerEx.url) innerEx.url = options.url
                        if (isTimeout) innerEx.isTimeout = true
                        warn("Fetch.request", options.method, logUrl, ex, "Failed twice, will not retry")
                        throw innerEx
                    }
                }

                if (!ex.url) ex.url = options.url
                if (isTimeout) ex.isTimeout = true
                throw ex
            }
        }

        return {request, rateLimitDelay}
    }
}

// Exports...
export default FetchUtils.Instance
