const express = require("express")
const path = require("path")
const { spawn } = require("child_process");

const app = new express()
const session = require('express-session');
const config = require("../config.json")
app.use(session({
  secret: config.sessionSecret || "Rainwater_Base_Session_Secret",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
const isAuthenticated = require("../auth/exp-verify")
const bodyParser = require("body-parser")


app.use("/wx", require("./weather/base"))
app.use("/istar", require("./istar/base"))
app.use("/maps", require("./images/radar").app)
app.use("/images", require("./images/images").app)
app.use("/weather", require("./weather/base"))
app.use("/i", express.static(path.join(__dirname, "i")))
app.use(bodyParser.json())

app.post("/login", async (req, res) => {
    if(!req.body) return res.status(200).send("Please send a body")
    if(!req.body.username) return res.status(200).send("Please send a username")
    if(!req.body.password) return res.status(200).send("Please send a password")
    const login = await require("../auth/base/auth-signin").login(req.body.username, req.body.password)
    if(login.startsWith("true-")) {
        req.session.token = login.split("true-")[1]
        return res.send("OK")//res.json({token: login.split("true-")[1]})
    } else {
        return res.status(400).send("may the schwartz be with you")
    }
})

app.get("/admin", isAuthenticated, async (req, res) => {
    try {
        const params = req.query;
        const args = Object.entries(params).flatMap(
            ([key, value]) => [`--${key}`, String(value)]
        );
        const py = spawn("python3", [
            path.join(__dirname, "./admin.py"),
            ...args
        ]);
        let stdout = "";
        let stderr = "";
        py.stdout.on("data", (data) => {
            stdout += data.toString();
        });
        py.stderr.on("data", (data) => {
            stderr += data.toString();
        });
        py.on("close", (code) => {
            if (code !== 0) {
                console.error(stderr);
                return res.status(500).send(stderr || "Python script failed");
            }
            res.type("text/plain").send(stdout);
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

app.get("/", isAuthenticated, (req, res) => {
    res.send("hi the API is working")
})

module.exports = app
