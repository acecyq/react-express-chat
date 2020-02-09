const express = require("express");
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// mocking database
const registered = {};
app.post("/register", (req, res) => {
  const name = req.body.name;

  if (!name || registered[name]) {
    return res.sendStatus(400);
  }

  registered[name] = true;
  return res.sendStatus(200);
});

const path = require("path");
app.use(express.static(path.join(__dirname, "build")));
app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const server = require("http").createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws) {
  ws.on("message", message => {
    const { user, message: msg } = JSON.parse(message);

    if (user) {
      ws.user = user;

      wss.clients.forEach(client => {
        if (client !== ws) {
          client.send(`${user} has joined the conversation`);
        }
      });
    }

    if (msg) {
      wss.clients.forEach(client => {
        if (client !== ws) {
          client.send(`${ws.user}: ${msg}`);
        }
      });
    }
  });

  ws.on("close", () => {
    wss.clients.forEach(client => {
      client.send(`${ws.user} has disconnected`);
    });
  });
});

server.listen(5000, () => {
  console.log("server started on port 5000");
});
