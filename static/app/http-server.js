const http = require('http')
const fs = require('fs')
const logger = require('./logger')

let psServer = null

function createServer() {
    if (!psServer) {
        psServer = http.createServer()
        psServer.listen(6311)

        psServer.on('error', (error) => {
            logger.error(`start http psServer failed: ${error.stack}`)
        })
    }

    return psServer
}

let postServer = null
function createPostServer (serverHandler) {
  if (!postServer) {
    postServer = http.createServer(serverHandler).listen(6312)

    logger.info('start http server port 6312 ...')
    postServer.on('error', (error) => {
            logger.error(`start http postServer failed: ${error.stack}`)
        })
  }
  return postServer
}

module.exports = {
    createServer: createServer,
    createPostServer: createPostServer
}

