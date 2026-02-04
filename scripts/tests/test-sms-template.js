import { sendOTP } from "./src/lib/smsService.ts";

async function testSMSTemplate() {
  // Test with a sample phone number (replace with a valid one for actual testing)
  const testPhone = "09123456789";
  const testOTP = "123456";

  console.log("Testing SMS template functionality...");

  // Test sending OTP with the amoozyar-login template
  try {
    const result = await sendOTP(testPhone, testOTP, "amoozyar-login");
    console.log("SMS Template Test Result:", result);
  } catch (error) {
    console.error("Error testing SMS template:", error);
  }
}

testSMSTemplate();
