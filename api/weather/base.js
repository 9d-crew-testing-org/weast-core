const express = require("express")
const path = require("path")

const app = new express()

const isAuthenticated = require("../../auth/exp-verify")
const isAuthorized = require("../../auth/exp-auth-lvl")

app.get("/", isAuthenticated, (req, res) => {
    res.json({collection: "Rainwater V2 api/weather", "auth": "api/weather"})
})

app.get("/main", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./cc")(req)
    res.json(data)
})

app.get("/cc", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./cc")(req)
    res.json(data)
})

app.get("/8city", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./8city")(req)
    res.json(data)
})

app.get("/satrad/:coordinates/:ts", require("./satrad"), async (req, res) => {
    res.send("you shouldn't see this lol")
})

app.get("/daily", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./daily")(req)
    res.json(data)
})

app.get("/daily/:day", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./daily")(req);
    const dayData = data.find(d => d.day == req.params.day);
    if (dayData) {
        return res.json(dayData);
    }
    return res.json({ error: "No data available for that many days in advance." });
});

app.get("/almanac", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./almanac")(req);
    const dayData = data.find(d => d.day == 0);
    if (dayData) {
        return res.json(dayData);
    }
    return res.json({ error: "No data available for that many days in advance." });
});

app.get("/hourly", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./hourly")(req)
    res.json(data)
})

app.get("/hourly/:hour", isAuthenticated, isAuthorized, async (req, res) => {
    const data = await require("./hourly")(req);
    const hourData = data.find(d => d.hoursAhead == req.params.hour);
    if (hourData) {
        return res.json(hourData);
    }
    return res.json({ error: "No data available for that many hours in advance." });
});


module.exports = app
