const socketConnection = (io)=>{
    io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    console.log(user)
    next();
  } catch (err) {
    console.log(err)
    next(new Error("Authentication error"));
  }
});
}

module.exports = socketConnection