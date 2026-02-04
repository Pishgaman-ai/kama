/**
 * Converts Persian digits to English digits
 * @param str String containing Persian digits
 * @returns String with English digits
 */
export function convertPersianToEnglishDigits(str: string): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const englishDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  let result = str;
  for (let i = 0; i < persianDigits.length; i++) {
    const persianDigit = persianDigits[i];
    const englishDigit = englishDigits[i];
    result = result.replace(new RegExp(persianDigit, "g"), englishDigit);
  }

  return result;
}

/**
 * Gets the profile image URL with fallback to default image
 * @param profilePictureUrl The user's profile picture URL
 * @returns The profile image URL or default image URL
 */
export function getProfileImageUrl(profilePictureUrl?: string): string {
  if (profilePictureUrl && profilePictureUrl.trim() !== "") {
    return profilePictureUrl;
  }
  
  // Return default profile image URL
  return "/default-profile-image.jpg";
}