// @ts-check
import https from "https";

// Test URL
const url =
  "https://eduhelper-minio.chbk.app/eduhelper/users/profile_pictures/1384ade0-ff05-4e25-b84d-47e6474c31dc.jpg";

console.log("Testing image access...");

https
  .get(url, (res) => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.headers);

    if (res.statusCode === 200) {
      console.log("Image is accessible");
    } else {
      console.log("Image is not accessible");
    }

    // Check CORS headers
    if (res.headers["access-control-allow-origin"]) {
      console.log(
        "CORS headers present:",
        res.headers["access-control-allow-origin"]
      );
    } else {
      console.log("No CORS headers found");
    }

    res.on("data", (chunk) => {
      // Just consume the data
    });

    res.on("end", () => {
      console.log("Request completed");
      process.exit(0);
    });
  })
  .on("error", (err) => {
    console.error("Error accessing image:", err.message);
    process.exit(1);
  });
