const jwt = require("jsonwebtoken");

const JWT_SECRET = require("../config.json").sessionSecret || "This should break"
const config = require("../config.json")

module.exports = async function isAuthenticated(req, res, next) {
  if(config.auth.local == true) {
    const authenticated = await require("./base/auth-lvl")(req)
    if(authenticated == true) {
      return next()
    } else {
      return res.status(401).send({ error: "Unauthorized for API endpoint"})
    }
  } else {
    // Assume that the auth server is not local. Use prod auth server preferably, please
    const authServer = config.auth.authServer // fmt: https://auth.minnwx.com
    if(req.headers?.authorization) {
      if(req.headers?.authorization.startsWith("Bearer RNWTR-")) {
        const authReq = await fetch(`${authServer}/verify`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: req.headers?.authorization.split("Bearer RNWTR-")[1],
            level: req.baseUrl.slice(1)
          })
        })
        const authData = await authReq.json()
        if (authData.token == true) {
          return next()
        } else {
          return res.status(401).send({ error: "Invalid credentials"})
        }
      }
    } else if(req.query.apiKey) {
      const authReq = await fetch(`${authServer}/verify`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            apiKey: req.query.apiKey,
            level: req.baseUrl.slice(1)
          })
        })
        const authData = await authReq.json()
        if (authData.token == true) {
          return next()
        } else {
          return res.status(401).send({ error: "Invalid credentials"})
        }
    } else {}
  }
};
