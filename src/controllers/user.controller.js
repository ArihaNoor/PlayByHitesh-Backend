import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccesAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = await user.generateJWT();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something Went Wrong, while Token generation");
  }
};

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

  // console.log(req.files);

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

  // console.log(avatar, coverImage);

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

  const { accessToken, refreshToken } = await generateAccesAndRefreshTokens(
    user._id
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "User creation failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(200,{
      user: createdUser,
      accessToken,
    }, "User created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, password } = req.body;
  console.log("Email", req.body);

  if (!email) {
    throw new ApiError(400, "email is required");
  }


  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccesAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
          email
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Logout user logic
  //clear cookies
  //send response
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: { refreshToken: undefined },
  });
  const options = {
    httpOnly: true,
    secure: true, //can be accessible through client but not modifiable only modifiable by server
  };

  return res
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .status(200)
    .json(new ApiResponse(200, {}, "Logout successful"));
});

export { registerUser, loginUser, logoutUser };
