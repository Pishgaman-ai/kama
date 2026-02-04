import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// Initialize S3 client for Chabokan
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "irn13",
  endpoint: process.env.AWS_ENDPOINT || "https://eduhelper-minio.chbk.app",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // This prevents the bucket name from being prepended to the hostname
});

/**
 * Uploads a file to Chabokan storage
 * @param file - The file to upload
 * @param folder - The folder to upload to (optional)
 * @returns The URL of the uploaded file
 */
export async function uploadFileToStorage(
  file: File,
  folder: string = "schools"
): Promise<string> {
  try {
    // Generate a unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Chabokan
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME || "eduhelper",
      Key: key,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read" as const, // Make the file publicly readable
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Return the URL of the uploaded file through our proxy API
    // This avoids CORS and access issues with direct S3 URLs
    const proxyUrl = `/api/image?key=${encodeURIComponent(key)}`;
    console.log("Generated proxy URL:", proxyUrl);
    return proxyUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Extracts the key from a proxy URL
 * @param proxyUrl - The proxy URL to extract the key from
 * @returns The extracted key or null if invalid
 */
export function extractKeyFromProxyUrl(proxyUrl: string): string | null {
  try {
    const url = new URL(proxyUrl, "http://localhost");
    const key = url.searchParams.get("key");
    return key;
  } catch (error) {
    console.error("Error extracting key from proxy URL:", error);
    return null;
  }
}

/**
 * Deletes a file from Chabokan storage
 * @param proxyUrl - The proxy URL of the file to delete
 * @returns True if deletion was successful, false otherwise
 */
export async function deleteFileFromStorage(
  proxyUrl: string
): Promise<boolean> {
  try {
    const key = extractKeyFromProxyUrl(proxyUrl);
    if (!key) {
      console.error("Could not extract key from proxy URL:", proxyUrl);
      return false;
    }

    const deleteParams = {
      Bucket: process.env.BUCKET_NAME || "eduhelper",
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    console.log("File deleted successfully:", key);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}
