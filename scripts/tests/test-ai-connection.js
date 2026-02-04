// Simple test script to verify AI service connection
async function testAIConnection() {
  try {
    console.log("Testing AI service connection...");

    // Test with a simple query
    const query = "سلام";
    const nationalId = "00256854";
    const role = "principal";

    console.log(
      `Sending query: ${query} with national ID: ${nationalId} and role: ${role}`
    );

    // Prepare URL with query parameter
    const endpoint = "https://n8n-new40407.chbk.app/webhook/kama_manager_v1";
    const url = new URL(endpoint);
    url.searchParams.append("query", query);

    console.log("Full URL:", url.toString());

    // Send POST request to AI assistant with empty body
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept:
          "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
        national_code: nationalId,
      },
      body: JSON.stringify({}),
    });

    console.log("Response status:", response.status);

    // Get the response text first
    const responseText = await response.text();
    console.log("Response text:", responseText);

    // Check if the request was successful
    if (!response.ok) {
      console.error(`❌ AI request failed with status: ${response.status}`);
      return;
    }

    // If response is empty, return an appropriate message
    if (!responseText.trim()) {
      console.log("Empty response received from AI service");
      return;
    }

    // Try to parse JSON response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log("Parsed response data:", responseData);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", responseText);
      return;
    }

    // Extract the output from the response
    if (responseData && responseData.output) {
      console.log("✅ AI response received successfully");
      console.log("Response:", responseData.output);
    } else {
      console.error("❌ Invalid AI response format");
      console.log(
        "Response data structure:",
        JSON.stringify(responseData, null, 2)
      );
    }
  } catch (error) {
    console.error("❌ Failed to communicate with AI assistant:", error);
  }
}

// Run the test
testAIConnection().catch(console.error);
