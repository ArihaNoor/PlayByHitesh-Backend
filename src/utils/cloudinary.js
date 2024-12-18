import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

//fs is our file system, which is by default nodejs library
//for reading, open, getting permissions, etc. for files

//configuring cloudinary

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    // cloudinary.v2.uploader.upload(localFilePath, {});
    if (!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log(result.url);
    return result;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export {uploadCloudinary};
