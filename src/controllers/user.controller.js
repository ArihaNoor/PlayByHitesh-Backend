import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // Register user logic
  //get user details from frontend
  //validation -- not empty
  //check if user exists
  //check for images, check for avatar
  //upload them to cloudinary
  //create user object -- create entry in DB
  //remove password and refresh token from response
  //check for user creation
  //send response
  const { fullName, userName, email, password } = req.body;
  console.log(fullName, userName, email, password);

  if (!fullName || !userName || !email || !password) {
    throw new ApiError(400, "Please fill in all fields");
  }

  // if (
  //   [fullName, userName, email, password].some(
  //     (field) => field?.trim() === undefined || field?.trim() === ""
  //   )
  // ) {
  //   throw new ApiError(400, "Please fill in all fields");
  // }

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  if (password.length > 50) {
    throw new ApiError(400, "Password must be at most 50 characters long");
  }

  if (userName.length < 3) {
    throw new ApiError(400, "Username must be at least 3 characters long");
  }

  if (email.includes("@") === false) {
    throw new ApiError(400, "Please enter a valid email address");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path; //avatar file name because it is given in the multer middleware
  // const coverLocalPath = req.files?.cover[0]?.path; //cover file name because it is given in the multer middleware

  // console.log(avatarLocalPath, coverLocalPath);

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.cover) &&
    req.files.cover.length > 0
  ) {
    coverImageLocalPath = req.files.cover[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar");
  }

  //upload images to cloudinary
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed");
  }

  // create user object
  const user = await User.create({
    fullName,
    userName: userName.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // Login user logic
  //get user details from frontend
  //validation -- not empty
  //check if user exists
  //check if password is correct
  //generate access token
  //send response
  const { userName, password } = req.body;

  if (!userName || !password) {
    throw new ApiError(400, "Please fill in all fields");
  }

  const user = await User.findOne({ userName });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const accessToken = await user.generateAccessToken();

  return res
    .status(200)
    .json(new ApiResponse(200, { accessToken }, "Login successful"));
});

export { registerUser, loginUser };
