
/**
 * WhatsApp messaging utility functions
 */

// Function to check if a number exists on WhatsApp
// Note: This is a simplified check that just validates the number format
// In a production app, you would use the WhatsApp Business API
export const checkNumberOnWhatsApp = async (phoneNumber: string): Promise<boolean> => {
  // Sanitize phone number (remove spaces, dashes, etc.)
  const sanitizedNumber = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Validate if the number is in a proper format for WhatsApp
  // This is just a basic validation - not a true check
  if (sanitizedNumber.length < 10) {
    return false;
  }
  
  // In a real implementation, we would check with WhatsApp Business API
  // For now, we'll return true for valid-looking numbers
  // This is just for demonstration purposes
  return true;
};

// Function to generate WhatsApp link for sending message
export const generateWhatsAppLink = (phoneNumber: string, message: string = ''): string => {
  // Sanitize phone number
  const sanitizedNumber = phoneNumber.replace(/[^0-9+]/g, '');
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Create appropriate link based on platform
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // Mobile device - use intent/whatsapp URI
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      // iOS
      return `whatsapp://send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    } else {
      // Android and others
      return `intent://send?phone=${sanitizedNumber}&text=${encodedMessage}#Intent;package=com.whatsapp;end;`;
    }
  } else {
    // Desktop - use web WhatsApp
    return `https://web.whatsapp.com/send?phone=${sanitizedNumber}&text=${encodedMessage}`;
  }
};

// Smart delay function to prevent spamming
export const smartDelay = (baseDelay: number = 1000): Promise<void> => {
  // Add a random component to the delay to make it less predictable
  const randomComponent = Math.floor(Math.random() * 500);
  const totalDelay = baseDelay + randomComponent;
  
  return new Promise(resolve => setTimeout(resolve, totalDelay));
};
