let app = require("express")();
let http = require("http").Server(app);

let io = require("socket.io")(http);

let users = [];

io.on("connection", socket => {
  console.log("user connected", socket.id, socket.handshake.address);
  users.push(socket.id);
  io.emit("users", users);

  socket.on("disconnect", function() {
    users = users.filter(value => {
      return value != socket.id;
    });
    io.emit("users", users);
  });

  socket.on("message", message => {
    console.log("message", message);
    io.emit("message", { type: "new-message", text: message });
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
