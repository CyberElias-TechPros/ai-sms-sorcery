
/**
 * WhatsApp messaging utility functions with anti-spam protection
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
  
  // Ensure phone number has country code
  if (!sanitizedNumber.startsWith('+')) {
    console.warn('Phone number should include country code for better WhatsApp compatibility');
  }
  
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

// Message randomization to prevent spam detection
export const addRandomization = (message: string): string => {
  // Add slight variations to messages to avoid being flagged as spam
  const greetings = ['Hi', 'Hello', 'Greetings', 'Good day'];
  const emojis = ['👋', '✨', '🙌', '😊', '👍'];
  
  // Maybe add a greeting
  if (Math.random() > 0.7 && !message.startsWith('Hi') && !message.startsWith('Hello')) {
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    message = `${greeting}! ${message}`;
  }
  
  // Maybe add an emoji
  if (Math.random() > 0.6) {
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    if (Math.random() > 0.5) {
      // Add to beginning
      message = `${emoji} ${message}`;
    } else {
      // Add to end
      message = `${message} ${emoji}`;
    }
  }
  
  return message;
};

// Rate limiting system to prevent excessive messaging
let messageCounter = 0;
const MAX_MESSAGES_PER_HOUR = 20;
const resetTime = new Date();

export const canSendMoreMessages = (): boolean => {
  const now = new Date();
  
  // Reset counter if an hour has passed
  if ((now.getTime() - resetTime.getTime()) > 3600000) {
    messageCounter = 0;
    resetTime.setTime(now.getTime());
    return true;
  }
  
  // Check if we're under the limit
  return messageCounter < MAX_MESSAGES_PER_HOUR;
};

export const incrementMessageCounter = (): void => {
  messageCounter++;
};

// Get remaining message count
export const getRemainingMessageCount = (): number => {
  return MAX_MESSAGES_PER_HOUR - messageCounter;
};
