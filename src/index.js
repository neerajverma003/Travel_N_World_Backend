import 'dotenv/config';
import path from 'path';
import http from "http";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import app from "./server.js";
import connectToDatabase from "./db/db.js";

// Safe path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to the database
    await connectToDatabase();

    // create Http server
    const server = http.createServer(app);

    // create socket server
    const io = new Server(server,{
      cors:{
        origin:["http://localhost:5173","http://localhost:5174","http://192.168.1.13:5173","http://192.168.1.13:5174","https://www.travelnworld.com"],

        methods:["GET","POST"]
      }
    })

   //socket connection listener

   io.on("connection",(socket)=>{
    console.log(`Socket connected:${socket.id}`)

    socket.on("disconnect",()=>{
      console.log("socket disconnected")
    })
   })

  //  set socketio in application to acces it in routes
   app.set("socketio",io);

    // Start Express server
    server.listen(PORT, () => {
      console.log(`Server and socket  are  running on ${PORT}`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err.message);
    process.exit(1);
  }
}

// Start the server
startServer();
