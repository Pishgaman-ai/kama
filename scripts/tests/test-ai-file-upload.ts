// Test script for AI file upload functionality
import { uploadFileToStorage } from "../../src/lib/fileUpload";
import * as fs from "fs";

// Create a simple test file
const createTestFile = (): File => {
  const content = "This is a test file content for educational activities";
  const blob = new Blob([content], { type: "text/plain" });

  // Create a File object with the blob
  const file = new File([blob], "test-questions.txt", {
    type: "text/plain",
    lastModified: Date.now(),
  });

  return file;
};

async function testFileUpload() {
  try {
    console.log("Testing file upload to cloud storage...");

    // Create a test file
    const testFile = createTestFile();

    // Upload the file
    const url = await uploadFileToStorage(
      testFile,
      "educational-activities/test"
    );
    console.log("File uploaded successfully!");
    console.log("File URL:", url);

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testFileUpload();
