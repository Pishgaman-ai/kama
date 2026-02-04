// Test script to verify AI file upload functionality
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const repoRoot = path.resolve(__dirname, "..", "..");
const resolveRepoPath = (...segments: string[]) =>
  path.join(repoRoot, ...segments);

async function verifyImplementation() {
  console.log("Verifying AI file upload implementation...\n");

  try {
    // Check if the database columns exist
    console.log("1. Checking database schema...");
    const { stdout: dbCheck } = await execPromise(
      "node check-table-columns.mjs",
      {
        cwd: repoRoot,
      }
    );
    console.log(dbCheck);

    // Check if API routes exist
    console.log("2. Checking API routes...");
    const apiRoutes = [
      "src/app/api/teacher/educational-activities/route.ts",
      "src/app/api/teacher/educational-activities/[id]/upload-files/route.ts",
    ];

    for (const route of apiRoutes) {
      const resolvedRoutePath = resolveRepoPath(route);
      const { stdout: fileCheck } = await execPromise(
        `dir "${resolvedRoutePath}"`,
        { shell: "cmd.exe" }
      );
      if (fileCheck.includes("File Not Found")) {
        console.log(`ƒ?? ${route} not found`);
      } else {
        console.log(`ƒ?? ${route} exists`);
      }
    }

    // Check if the frontend component has been updated
    console.log("3. Checking frontend component...");
    const frontendPath =
      "src/app/dashboard/teacher/classes/[id]/activities/[activityId]/ai-correction/page.tsx";
    const resolvedFrontendPath = resolveRepoPath(frontendPath);
    const { stdout: frontendCheck } = await execPromise(
      `dir "${resolvedFrontendPath}"`,
      { shell: "cmd.exe" }
    );
    if (frontendCheck.includes("File Not Found")) {
      console.log(`ƒ?? ${frontendPath} not found`);
    } else {
      console.log(`ƒ?? ${frontendPath} exists`);

      // Check if the file contains the upload functionality
      const { stdout: contentCheck } = await execPromise(
        `findstr /C:"ב?ב?ב?ד?ברב?ב?ה? ג?ב?ה?ג?ƒ??ג?ב?ה? ב?ב?ה?ב?" "${resolvedFrontendPath}"`,
        { shell: "cmd.exe" }
      );
      if (contentCheck) {
        console.log(`ƒ?? File upload functionality found in frontend component`);
      } else {
        console.log(
          `ƒ?? File upload functionality not found in frontend component`
        );
      }
    }

    console.log("\nƒ?? Implementation verification completed!");
  } catch (error) {
    console.error("Error during verification:", error);
  }
}

verifyImplementation();
