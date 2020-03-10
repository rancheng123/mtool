const config = require('./configuration')
const logger = require('./logger')
const rp = require('request-promise').defaults({
    simple: false,
    resolveWithFullResponse: true
})

let refreshAuthTokenTimer

function getJwtToken(smartOfficeUrl, userName, password, snsMode, param) {
    if ((typeof snsMode) === 'undefined') {
        snsMode = false
    }
    var requestBody = {
        loginType: 0,
        data: {
            loginName: userName,
            password: password
        }
    }
    if (snsMode) {
        requestBody = {
            loginType: 1,
            snsUserInfo: {
                snsAccountId: userName,
                snsName: 'wechat'
            },
            appType: param.appType,
            corpId: param.corpId
        }
    }

    let jtwReqOpts = {
        method: 'POST',
        uri: smartOfficeUrl + '/rest/auth/sso-jwt-tokens-with-app',
        body: requestBody,
        json: true,
        transform: function(body, response, resolveWithFullResponse) {
            if (response.statusCode === 200 && response.body) {
                let cookies = response.headers['set-cookie']
                let csrfToken = config.readSettings('csrfToken')
                let sessionId = config.readSettings('sessionId')

                let result = {
                    jwtToken: response.body.data,
                    server: response.body.server,
                    service: response.body.service,
                    sessionId: sessionId,
                    csrfToken: csrfToken
                }

                return result
            } else {
                throw new Error('get jwt token failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(jtwReqOpts)
}

function getRedirectLocation(jwtResult) {
    let serverReqOpts = {
        method: 'POST',
        uri: jwtResult.server,
        form: {
            service: jwtResult.service,
            token: jwtResult.jwtToken
        },
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36'
        },
        transform: function(body, response, resolveWithFullResponse) {
            if (response.statusCode === 302) {
                return {
                    redirectLocation: response.headers['location'],
                    jwtResult: jwtResult
                }
            } else {
                throw new Error('get redirect location failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(serverReqOpts)
}

function ssoLogin(redirectResult) {
    let loginReqOpts = {
        uri: redirectResult.redirectLocation,
        method: 'POST',
        json: true,
        transform: function(body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                logger.info(`sso login success`)
                let result = response.body

                return {
                    authToken: result.data.authToken,
                    csrfToken: redirectResult.jwtResult.csrfToken,
                    sessionId: redirectResult.jwtResult.sessionId
                }
            } else {
                throw new Error('sso login failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(loginReqOpts)
}

function getCsrfTokenAndSession(smartOfficeUrl, authToken) {
    logger.info(`get csrf info`)
    let opt = {
        uri: smartOfficeUrl + '/rest/auth/session',
        method: 'GET',
        json: true,
        headers: {
            'auth-token': authToken
        },
        transform: function(body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                logger.info(`fetch csrf token & session Id success: ${JSON.stringify(response.body)}`)
                config.saveSettings('sessionId', response.body.sid)
                config.saveSettings('csrfToken', response.body.csrf)
                return response.body
            } else {
                throw new Error('get csrfToken & Session Id failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(opt)
}

function login(smartOfficeUrl, userName, password) {
    return getCsrfTokenAndSession(smartOfficeUrl, '').then(function(result) {
        return getJwtToken(smartOfficeUrl, userName, password)
    }).then(function(result) {
        return getRedirectLocation(result)
    }).then(function(result) {
        return ssoLogin(result)
    })
}

function loginWeixin(smartOfficeUrl, openId, param) {
    return getCsrfTokenAndSession(smartOfficeUrl, '').then(function(result) {
        return getJwtToken(smartOfficeUrl, openId, undefined, true, param)
    }).then(function(result) {
        if (param.appType === 'workwx') {
            return result
        }
        return getRedirectLocation(result)
    }).then(function(result) {
        if (param.appType === 'workwx') {
            return {
                authToken: result.jwtToken
            }
        }
        return ssoLogin(result)
    })
}

function refreshAuthToken() {
    refreshAuthTokenInternal()
    if (!refreshAuthTokenTimer) {
        refreshAuthTokenTimer = setInterval(function() {
            refreshAuthTokenInternal()
        }, 1 * 60 * 60 * 1000)
    }
}

function refreshAuthTokenInternal() {
    logger.info('refresh auth token')
    let smartOfficeUrl = config.getSoUrl()
    let oldAuthToken = config.readSettings('authToken')
    let opt = {
        uri: smartOfficeUrl + '/rest/auth/refresh?hours=480',
        method: 'POST',
        json: true,
        body: {
            data: oldAuthToken
        },
        transform: function(body, response, resolveWithFullResponse) {
            if (response.statusCode === 200) {
                logger.info(`refreshAuthToken success`)
                config.saveSettings('authToken', body.data)
            } else {
                logger.error('refreshAuthToken failed, status code: ' + response.statusCode)
            }
        }
    }

    return rp(opt)
}

function getUserInfo(smartOfficeUrl, authToken) {
    return getCsrfTokenAndSession(smartOfficeUrl, authToken).then(function(result) {
        return rp({
            uri: smartOfficeUrl + '/api/account?cacheBuster=' + Date.now(),
            method: 'GET',
            json: true,
            headers: {
                'auth-token': authToken,
                'X-CSRF-TOKEN': result.csrf
            },
            transform: function(body, response, resolveWithFullResponse) {
                if (response.statusCode === 200) {
                    return response.body
                } else {
                    throw new Error('get user info failed, status code: ' + response.statusCode)
                }
            }
        })
    })
}

module.exports = {
    login: login,
    loginWeixin: loginWeixin,
    refreshAuthToken: refreshAuthToken,
    getUserInfo: getUserInfo,
    getCsrfTokenAndSession: getCsrfTokenAndSession
}
