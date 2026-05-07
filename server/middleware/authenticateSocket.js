const jwt = require("jsonwebtoken");

const authenticateSocket = (socket, next) => {
    // Client sends token via socket.handshake.auth.token
    const token = socket.handshake.auth?.token;

    // If no token is provided, reject the connection with an authentication error
    if (!token) {
        const error = new Error("Authentication error: No token provided");
        error.status = 401;
        error.code = "NO_TOKEN";
        return next(error);
    }

    try {
        // Reuse the same JWT_SECRET as your Passport strategy
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // attach verified payload to socket
        next();
    } catch (err) {
        // If token verification fails, reject the connection with an authentication error
        const error = new Error("Authentication error: Invalid or expired token");
        error.status = 401;
        error.code = "INVALID_TOKEN";
        return next(error);
    }
};

module.exports = authenticateSocket;