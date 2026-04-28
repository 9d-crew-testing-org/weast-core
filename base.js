const express = require("express");
const path = require("path");
const config = require("./config.json");
const session = require("express-session");
const cors = require("cors");
const verifyToken = require("./auth/base/verify"); // should return true/false
const app = express();

app.use(cors());

async function dc_log(msg) {
    const dc_url = "";
    const data = {
        content: msg
    };
    try {
        const response = await fetch(dc_url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
    } catch (err) {
        console.error(err);
    }
}

app.use(session({
  secret: config.sessionSecret || "temp",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, httpOnly: false } // set true if using HTTPS
}));

app.use("/api", require("./api/base"));

// Serve dynamic directory based on auth
app.use("/", async (req, res, next) => {
  try {
    const authorized = await verifyToken(req); // true if token is valid
    const folder = authorized ? "private" : "public";
    express.static(path.join(__dirname, folder))(req, res, next);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

app.use(express.urlencoded({extended: true}));

loginpage = `
<html><head>
<title>Tricks and Traps</title>
</head>
<body bgcolor="#191919" text="#44cc55" link="#36d5ff" vlink="#36d5ff">
<table width="100%" border="0" cellspacing="0" cellpadding="0">
<tr>
<td valign="top">
<img src="/dresden_tricks.jpg">
</td>
<td width="5"><FONT COLOR="#191919">sp</FONT></td>
<td valign="top" width="100%">
<h1>Tricks and Traps</h1>
<table border="0"><tr><td>
<p>Your attempt to subvert security has been recorded. Please<br>stay where you are. Someone will come by to pick you up.<br><br>If you aren't supposed to have access to these pages, this<br>would be a fine time to stop trying.<br><br>Remember, the computer is your friend!</p></td></tr>
</tbody></table>
</body></html>`

successpage = `
<html><head>
<title>login success</title>
<style>
body { background-color: #191919; color: #44cc55; margin: 0; }
a:link, a:visited { color: #36d5ff; }
.container { display: flex; }
.sidebar { } 
.sidebar img { display: block; } 
.main { flex: 1; padding: 1em 1em 1em 20px; }
table { border-collapse: collapse; }
input { background-color: #444444; color: #ffdd33; caret-color: #cc9933; }
</style>

</head>
<body>
<div class="container">
<div class="sidebar"><img src="/dresden_tricks.jpg"></div>
<div class="main">
<h1>Login Success!</h1>
<table>
<tbody>
<tr><td><p></p></td></tr>
</tbody></table>
</div>
</div>
<script>
function bwah() {
  window.location.href = "/?nocache=" + Date.now();
}

setTimeout(bwah, 1500);
</script>
</body></html>`

app.post("/login", async (req, res) => {
	if(!req.body) return res.status(200).send(loginpage)
	var username = req.body.username || "No Username Provided";
	var password = req.body.password || "No Password Provided";
    const login = await require("./auth/base/auth-signin").login(username, password)
    if(login.startsWith("true-")) {
	dc_log(`Successful Login! username:${username} - password:${password}`);
        req.session.token = login.split("true-")[1]
        return res.status(200).send(successpage)//res.json({token: login.split("true-")[1]})
    } else {
    	dc_log(`Failed Login! username:${username} - password:${password}`);
	return res.status(200).send(loginpage);
    }
});

app.post("/register", async (req, res) => {
	return res.status(500).send()
});

app.use("/p", async (req, res, next) => {
  try {
    const folder = "public/encoder";
    express.static(path.join(__dirname, folder))(req, res, next);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = app;
