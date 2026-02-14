import "dotenv/config";
import connectDB from "./db/db.js"
import app from "./app.js"
import dns from "dns";
dns.setServers(['8.8.8.8', '1.1.1.1']);

connectDB()
.then(async()=>{
    app.on("error", (error)=>{
        console.log("error occuured: ", error);
    })
    
    app.listen(process.env.PORT, ()=>{
        console.log(`started on ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("err: ", err);
})