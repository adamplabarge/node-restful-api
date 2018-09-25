/* 
 * Primary file for API
 *
 */

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./lib/config')
const fs = require('fs')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')

// Instantiate http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res)
})

// Start http server
httpServer.listen(config.httpPort, () => {
    console.log(`The HTTP server is listening at port ${config.httpPort}`)
})

// Instantiate https server
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res)
})

// Start http server
httpsServer.listen(config.httpsPort, () => {
    console.log(`The HTTPS server is listening at port ${config.httpsPort}`)
})

// All server logic
const unifiedServer = (req, res) => {
    // get the url and parse it
    let parsedUrl = url.parse(req.url, true)

    // get the path
    let path = parsedUrl.pathname
    let trimmedPath = path.replace(/^\/+|\/+$/g,'')

    // get the query string as an object
    let queryStringObject = parsedUrl.query

    // get the http method
    let method = req.method.toLowerCase()

    // get the headers as an object
    let headers = req.headers

    // get payload
    let decoder = new StringDecoder('utf-8')

    let buffer = ''

    req.on('data', (data) => {
        buffer += decoder.write(data)
    })

    req.on('end', () => {
        buffer += decoder.end()

        // chose the handler this request should go to
        let choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound

        // construct data object to send to handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        }

        // route the reqeust to the handler
        choosenHandler(data, (statusCode, payload) => {
            // use the status code called back by the handler, or default 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            // use the payload calledback by the handler, or default {}
            payload = typeof(payload) == 'object' ? payload : {}

            // conver payload to string
            let payloadString = JSON.stringify(payload)

            // return response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString)

            // log the request
            console.log('Returning this response: ', statusCode, payloadString)
        })
    })
}

// Define a request router
const router = {
    'ping' : handlers.ping,
    'users' : handlers.users
}