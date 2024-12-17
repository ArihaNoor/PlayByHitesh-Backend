import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema({},{timestamps: true});

export const Owner = mongoose.model("Owner", ownerSchema);