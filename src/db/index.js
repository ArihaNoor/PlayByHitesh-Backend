import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_Name}`
    );
    console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`)
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
