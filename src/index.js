import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/index.js";
import {app} from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(error);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is Running on PORT: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

//First Approach for database connection
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error", (error)=>{
//         console.log(error)
//     })
//     app.listen(
//         console.log(`App is listening on PORT: ${process.env.PORT}`)
//     )
//   } catch (error) {
//     console.log(error);
//   }
// })();
