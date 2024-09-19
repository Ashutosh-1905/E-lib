import { v2 as cloudinary } from "cloudinary";
import { config } from "./config";

  cloudinary.config({
    cloud_name: config.cloudinaryCloud,
    api_key: config.cloudApiKey,
    api_secret: config.cloudnaryApiScrete,
  });

export default cloudinary;