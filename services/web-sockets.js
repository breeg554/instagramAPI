class WebSockets {
  users = {};
  connection = (client) => {
    console.log("connect");
    client.on("disconnect", () => {
      console.log("user disconnect");
    });

    client.on("identity", (userId) => {
      this.users[userId] = client.id;
    });

    // client.on("subscribe", (room, otherUserId = "") => {
    //   this.subscribeOtherUser(room, otherUserId);
    //   client.join(room);
    // });

    // client.on("unsubscribe", (room) => { //for group chat
    //   client.leave(room);
    // });
  };

  // subscribeOtherUser(room, otherUserId) {
  //   const userSockets = this.users.filter(
  //     (user) => user.userId === otherUserId
  //   );
  //   userSockets.map((userInfo) => {
  //     const socketConn = global.io.sockets.connected(userInfo.socketId);
  //     if (socketConn) {
  //       socketConn.join(room);
  //     }
  //   });
  // }
}

module.exports = new WebSockets();
