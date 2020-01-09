let app = require("express")();
let http = require("http").Server(app);

let io = require("socket.io")(http);

let users = [];

io.on("connection", socket => {
  console.log("user connected", socket.id, socket.handshake.address);
  io.emit("users", users);

  socket.on("adduser", function(user) {
    users.push(user);
    io.emit("users", users);
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
    console.log(data);
  });
});

http.listen(process.env.PORT || 5000, () => {
  console.log("started port ", process.env.PORT || 5000);
});
