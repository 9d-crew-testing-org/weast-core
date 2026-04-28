const express = require("express")
const path = require("path")
const schemas = require("../../schemas")

const app = new express()

const isAuthenticated = require("../../auth/exp-verify")
const isAuthorized = require("../../auth/exp-auth-lvl")

app.get("/", isAuthenticated, (req, res) => {
    res.json({collection: "Rainwater V2 api/istar", "auth": "api/istar"})
})

app.get("/satlf/main", isAuthenticated, isAuthorized, async (req, res) => {
    const data = JSON.parse(await schemas.satlf("main"), null, 2)
    res.json(data)
})

app.get("/satlf/travel", isAuthenticated, isAuthorized, async (req, res) => {
    const data = JSON.parse(await schemas.satlf("travel"), null, 2)
    res.json(data)
})

module.exports = app