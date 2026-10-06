// TEST: FETCH

import {after, before, describe, it} from "mocha"
import http = require("node:http")
import assert = require("node:assert/strict")

const jaul = require("../src/index")

describe("JAUL Fetch Tests", function () {
    const clientOptions = {retryInterval: 1, backoffInterval: 1}
    let server: http.Server
    let baseURL: string
    let handlers: ((req: http.IncomingMessage, res: http.ServerResponse) => void)[] = []
    let requests: {method: string; url: string; headers: http.IncomingHttpHeaders; body: string}[] = []

    const reply =
        (status: number, body?: any, headers: {[key: string]: string} = {}) =>
        (_req, res) => {
            if (body && typeof body == "object") headers = {"content-type": "application/json", ...headers}
            res.writeHead(status, headers)
            res.end(body && typeof body == "object" ? JSON.stringify(body) : body)
        }
    const respond = (...list: typeof handlers) => {
        handlers = list
        requests = []
    }

    before(async function () {
        server = http.createServer((req, res) => {
            let body = ""
            req.on("data", (chunk) => (body += chunk))
            req.on("end", () => {
                requests.push({method: req.method, url: req.url, headers: req.headers, body})
                const handler = handlers.shift() || reply(500, "No handler")
                handler(req, res)
            })
        })
        await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
        baseURL = `http://127.0.0.1:${(server.address() as any).port}`
    })

    after(function () {
        server.closeAllConnections()
        server.close()
    })

    it("Applies defaults and parses JSON without mutating options", async function () {
        respond(reply(200, {ok: true}))
        const client = jaul.fetch.create({...clientOptions, userAgent: "JAUL / Test"})
        const options = {url: "/api/", baseURL: `${baseURL}/v1/`, params: {a: 1, b: [2, 3], c: undefined}, returnResponse: false}

        assert.deepEqual(await client.request(options), {ok: true})
        assert.equal(requests[0].method, "GET")
        assert.equal(requests[0].url, "/v1/api/?a=1&b=2&b=3")
        assert.equal(requests[0].headers["user-agent"], "JAUL / Test")
        assert.deepEqual(options, {url: "/api/", baseURL: `${baseURL}/v1/`, params: {a: 1, b: [2, 3], c: undefined}, returnResponse: false})
    })

    it("Sends plain objects as JSON, keeping explicit headers and other bodies", async function () {
        respond(reply(200, "a"), reply(200, "b"))
        const client = jaul.fetch.create({...clientOptions, userAgent: "Default"})

        await client.request({url: `${baseURL}/a`, method: "POST", body: {hello: "world"}, headers: {"user-agent": "Custom"}})
        await client.request({url: `${baseURL}/b`, method: "PUT", body: "plain", headers: {"Content-Type": "text/plain"}})

        assert.equal(requests[0].body, '{"hello":"world"}')
        assert.equal(requests[0].headers["content-type"], "application/json")
        assert.equal(requests[0].headers["user-agent"], "Custom")
        assert.equal(requests[1].method, "PUT")
        assert.equal(requests[1].body, "plain")
        assert.equal(requests[1].headers["content-type"], "text/plain")
    })

    it("Returns full response, true for 204, text and buffers", async function () {
        respond(reply(200, {a: 1}, {"x-custom": "yes"}), reply(204), reply(200, "text"), reply(200, "binary"))
        const client = jaul.fetch.create(clientOptions)

        const res = await client.request({url: baseURL, returnResponse: true})
        assert.equal(res.status, 200)
        assert.equal(res.headers.get("x-custom"), "yes")
        assert.deepEqual(res.data, {a: 1})
        assert.equal(await client.request({url: baseURL}), true)
        assert.equal(await client.request({url: baseURL}), "text")
        assert.deepEqual(await client.request({url: baseURL, responseType: "arraybuffer"}), Buffer.from("binary"))
    })

    it("Returns null for abort status codes", async function () {
        respond(reply(404))
        const client = jaul.fetch.create(clientOptions)

        assert.equal(await client.request({url: baseURL, abortStatus: [404]}), null)
        assert.equal(requests.length, 1)
    })

    it("Retries once on retryable status codes and timeouts", async function () {
        const client = jaul.fetch.create(clientOptions)

        respond(reply(503), reply(200, "retried"))
        assert.equal(await client.request({url: baseURL}), "retried")
        assert.equal(requests.length, 2)

        respond((req, res) => void setTimeout(() => reply(200, "late")(req, res), 200), reply(200, "retried"))
        assert.equal(await client.request({url: baseURL, timeout: 50}), "retried")
        assert.equal(requests.length, 2)

        respond((req) => req.socket.destroy(), reply(200, "retried"))
        assert.equal(await client.request({url: baseURL}), "retried")
        assert.equal(requests.length, 2)
    })

    it("Does not retry access denied or other client errors", async function () {
        const client = jaul.fetch.create(clientOptions)

        for (const status of [400, 401, 403, 404]) {
            respond(reply(status, {error: "Nope"}), reply(200))
            await assert.rejects(client.request({url: `${baseURL}/path`}), (err: any) => err.statusCode == status && err.url == `${baseURL}/path` && err.response.data.error == "Nope" && !err.isTimeout)
            assert.equal(requests.length, 1)
        }
    })

    it("Does not retry when aborted by the caller", async function () {
        respond((req, res) => void setTimeout(() => reply(200)(req, res), 200), reply(200))
        const client = jaul.fetch.create(clientOptions)

        await assert.rejects(client.request({url: baseURL, signal: AbortSignal.timeout(50)}), (err: any) => err.name == "TimeoutError")
        assert.equal(requests.length, 1)
    })

    it("Throws the second error with details when retrying fails", async function () {
        respond((req, res) => void setTimeout(() => reply(200)(req, res), 200), reply(502))
        const client = jaul.fetch.create(clientOptions)

        await assert.rejects(client.request({url: baseURL, timeout: 50}), (err: any) => err.statusCode == 502 && err.isTimeout === true && err.url == baseURL)
    })

    it("Calls onRetry with mutable options and cancels when it returns false", async function () {
        const client = jaul.fetch.create(clientOptions)

        respond(reply(500), reply(200, "ok"))
        await client.request({url: baseURL, onRetry: (options) => void (options.headers.Authorization = "Bearer new")})
        assert.equal(requests[1].headers.authorization, "Bearer new")

        respond(reply(500), reply(200, "ok"))
        await assert.rejects(client.request({url: baseURL, onRetry: () => false}), (err: any) => err.statusCode == 500)
        assert.equal(requests.length, 1)
    })

    it("Delays and logs when the API quota is almost exhausted", async function () {
        respond(reply(200, "ok", {"x-quota": "95"}))
        const logs: any[][] = []
        const client = jaul.fetch.create({...clientOptions, backoffInterval: 10, logger: {warn: (...args) => logs.push(args)}})

        const started = Date.now()
        await client.request({url: `${baseURL}/api?key=secret`, rateLimitExtractor: (res) => parseInt(res.headers.get("x-quota"))})
        assert.ok(Date.now() - started >= 70)
        assert.deepEqual(logs[0], ["Fetch.rateLimitDelay", "127.0.0.1/api", "Used 95.0% of API quota", "Delayed 75ms"])
    })

    it("Logs rate limit extractor failures without failing the request", async function () {
        respond(reply(200, "ok"))
        const logs: any[][] = []
        const client = jaul.fetch.create({...clientOptions, logger: {warn: (...args) => logs.push(args)}})

        const rateLimitExtractor = () => {
            throw new Error("Bad header")
        }
        assert.equal(await client.request({url: baseURL, rateLimitExtractor}), "ok")
        assert.equal(logs[0][2], "Failed to extract the rate limits")
    })
})
