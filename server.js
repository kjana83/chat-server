let app = require("express")();
let http = require("http").Server(app);
let cors = require("cors");
let io = require("socket.io")(http);

let users = [];
let msgs = [];
let supports = [];

io.on("connection", socket => {
  console.log("user connected", socket.id, socket.handshake.address);
  io.emit("users", users);

  socket.on("adduser", function(user) {
    users.push(user);
    io.emit("users", users);
    users = distinct(users, "userName");
    console.log(users);
    if (user.role === "csr") {
      socket.join("support");
    }
  });

  socket.on("disconnect", function() {
    users = users.filter(value => {
      return value.userId != socket.id;
    });
    io.emit("users", users);
  });

  socket.on("message", message => {
    console.log("message", message);
    io.emit("message", { type: "new-message", text: message });
  });

  socket.on("support", data => {
    users.forEach(function(user) {
      if (user.role === "csr") {
        io.to(user.userId).emit("support", data);
      }
    });
    supports.push(data);
  });

  socket.on("communicate", data => {
    data.from = socket.id;

    if (data.policyNumber) {
      data.policyData = {
        policyNumber: data.policyNumber,
        status: "Due for Renewal",
        Rule: "More Claims",
        link: "/Retrieve/Policy/" + data.policyNumber
      };
      io.to(data.toUserId).emit("message", data);
      io.to(data.from).emit("message", data);
    } else io.to(data.toUserId).emit("message", data);
    msgs.push(data);
    console.log(data);
  });
});

app.use(cors());
app.get("/users", (req, res) => {
  res.send(users);
});

app.get("/msgs/:userId", (req, res) => {
  const id = req.params.userId;
  let userMsgs = users.filter(usr => {
    return usr.from === id;
  });
  res.send(userMsgs);
});

app.get("/support/:userId", (req, res) => {
  const id = req.params.userId;
  let userMsgs = supports.filter(usr => {
    return usr.from === id;
  });
  res.send(userMsgs);
});

http.listen(process.env.PORT || 5000, () => {
  console.log("started port ", process.env.PORT || 5000);
});

function distinct(users, field) {
  const map = new Map();

  let userList = [];
  for (let i = users.length - 1; i >= 0; i = i - 1) {
    if (!map.has(users[i][field])) {
      userList.push(users[i]);
      map.set(users[i][field], true);
    }
  }
  return userList;
}
