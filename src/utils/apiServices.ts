
/**
 * API Services for messaging and AI features
 */

import { toast } from "@/hooks/use-toast";

// API configuration types
type SmsApiConfig = {
  provider: string;
  apiKey: string;
  apiSecret?: string;
  senderId?: string;
};

type AiApiConfig = {
  provider: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
};

// Message types
export type MessageRecipient = {
  phoneNumber: string;
  name?: string;
};

export type MessageContent = {
  body: string;
  mediaUrl?: string;
};

export type ScheduledMessage = MessageContent & {
  recipients: MessageRecipient[];
  scheduledTime: Date;
  status: 'scheduled' | 'sent' | 'failed' | 'draft';
  id: string;
};

export type MessageTemplate = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  usageCount?: number;
  model?: string;
};

// Default configurations
let smsConfig: SmsApiConfig = {
  provider: 'twilio',
  apiKey: '',
  apiSecret: '',
  senderId: 'SMS App'
};

let aiConfig: AiApiConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 150
};

// Storage keys
const SMS_CONFIG_KEY = 'sms_api_config';
const AI_CONFIG_KEY = 'ai_api_config';
const TEMPLATES_KEY = 'message_templates';

// Load configurations from localStorage if available
try {
  const savedSmsConfig = localStorage.getItem(SMS_CONFIG_KEY);
  if (savedSmsConfig) {
    smsConfig = { ...smsConfig, ...JSON.parse(savedSmsConfig) };
  }
  
  const savedAiConfig = localStorage.getItem(AI_CONFIG_KEY);
  if (savedAiConfig) {
    aiConfig = { ...aiConfig, ...JSON.parse(savedAiConfig) };
  }
} catch (error) {
  console.error('Error loading API configs:', error);
}

// Configuration setters
export const setSmsApiConfig = (config: Partial<SmsApiConfig>) => {
  smsConfig = { ...smsConfig, ...config };
  localStorage.setItem(SMS_CONFIG_KEY, JSON.stringify(smsConfig));
};

export const setAiApiConfig = (config: Partial<AiApiConfig>) => {
  aiConfig = { ...aiConfig, ...config };
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(aiConfig));
};

// SMS Sending functionality
export const sendSms = async (
  recipients: MessageRecipient[],
  content: MessageContent
): Promise<boolean> => {
  try {
    // This is a simulation since we don't have actual API keys
    console.log(`Sending message via ${smsConfig.provider}:`, { recipients, content });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate success (would be replaced with actual API call)
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      toast({
        title: "Message Sent",
        description: `Message sent to ${recipients.length} recipient(s)`,
      });
      return true;
    } else {
      throw new Error("Failed to send message");
    }
  } catch (error) {
    console.error("Error sending SMS:", error);
    
    toast({
      title: "Failed to Send Message",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    
    return false;
  }
};

// Schedule a message for later sending
export const scheduleMessage = async (
  recipients: MessageRecipient[],
  content: MessageContent,
  scheduledTime: Date
): Promise<string | null> => {
  try {
    // This is a simulation
    console.log(`Scheduling message via ${smsConfig.provider}:`, { 
      recipients, 
      content, 
      scheduledTime 
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a random ID for the scheduled message
    const messageId = `msg_${Math.random().toString(36).substring(2, 15)}`;
    
    toast({
      title: "Message Scheduled",
      description: `Message scheduled for ${scheduledTime.toLocaleString()}`,
    });
    
    return messageId;
  } catch (error) {
    console.error("Error scheduling message:", error);
    
    toast({
      title: "Failed to Schedule Message",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    
    return null;
  }
};

// AI message generation
export const generateAiMessage = async (
  prompt: string,
  type: string = 'marketing',
  maxLength: number = 160
): Promise<string> => {
  try {
    // This is a simulation
    console.log(`Generating AI message using ${aiConfig.provider} (${aiConfig.model}):`, {
      prompt,
      type,
      maxLength
    });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate responses based on message type
    const responses: Record<string, string[]> = {
      marketing: [
        "Limited time offer! Get 25% off on all premium plans. Upgrade now to access exclusive features and boost your productivity. Reply YES to claim your discount!",
        "Flash SALE: 30% off all services today only! Use code FLASH30 at checkout. Offer ends at midnight. Text STOP to unsubscribe.",
        "You've been selected for our VIP program! Enjoy 20% off your next purchase and free shipping. Use code VIP20 at checkout. Valid for 48 hours only."
      ],
      reminder: [
        "Friendly reminder: Your appointment is scheduled for tomorrow at 2:00 PM. Please arrive 10 minutes early. Reply CONFIRM to confirm or RESCHEDULE to change.",
        "Reminder: Your subscription will renew in 3 days. To avoid charges, cancel before June 15. Reply HELP for assistance or STOP to unsubscribe.",
        "Don't forget! Your payment is due tomorrow. Please ensure sufficient funds are available to avoid late fees. Text INFO for payment options."
      ],
      notification: [
        "Your package has been shipped and is on its way! Tracking number: TRK12345. Estimated delivery: June 10th. Track your package at example.com/track",
        "Thank you for your purchase! Your order #12345 has been confirmed and is being processed. You'll receive a shipping notification shortly.",
        "Your account has been successfully created. Welcome to the family! Check your email for next steps to get started with our service."
      ],
      alert: [
        "ALERT: We detected unusual activity on your account. If this wasn't you, please contact our security team immediately at 1-800-123-4567 or reply HELP.",
        "SECURITY ALERT: Your password was recently changed. If you didn't make this change, please contact customer support immediately at security@example.com.",
        "WEATHER ALERT: Severe thunderstorm warning for your area until 8PM. Seek shelter immediately. Stay tuned for updates. Reply INFO for emergency resources."
      ]
    };
    
    // Get response based on type, or default to marketing
    const responseOptions = responses[type] || responses.marketing;
    
    // Pick a random response from the options
    const response = responseOptions[Math.floor(Math.random() * responseOptions.length)];
    
    return response;
  } catch (error) {
    console.error("Error generating AI message:", error);
    
    toast({
      title: "Failed to Generate Message",
      description: error instanceof Error ? error.message : "AI generation failed",
      variant: "destructive",
    });
    
    return "Error generating message. Please try again.";
  }
};

// Template management functions
export const getMessageTemplates = async (): Promise<MessageTemplate[]> => {
  try {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
    if (savedTemplates) {
      return JSON.parse(savedTemplates);
    }
    
    // Return empty array if no templates found
    return [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
};

export const saveMessageTemplate = async (template: Omit<MessageTemplate, 'id'>): Promise<MessageTemplate | null> => {
  try {
    // Generate ID for new template
    const id = `template_${Date.now()}`;
    const newTemplate: MessageTemplate = {
      ...template,
      id,
      usageCount: 0
    };
    
    // Get existing templates
    const templates = await getMessageTemplates();
    templates.unshift(newTemplate);
    
    // Save to localStorage
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    
    return newTemplate;
  } catch (error) {
    console.error("Error saving template:", error);
    return null;
  }
};

export const updateMessageTemplate = async (id: string, updates: Partial<MessageTemplate>): Promise<boolean> => {
  try {
    // Get existing templates
    const templates = await getMessageTemplates();
    
    // Find and update the template
    const updatedTemplates = templates.map(template => 
      template.id === id ? { ...template, ...updates } : template
    );
    
    // Save to localStorage
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updatedTemplates));
    
    return true;
  } catch (error) {
    console.error("Error updating template:", error);
    return false;
  }
};

export const deleteMessageTemplate = async (id: string): Promise<boolean> => {
  try {
    // Get existing templates
    const templates = await getMessageTemplates();
    
    // Filter out the template to delete
    const updatedTemplates = templates.filter(template => template.id !== id);
    
    // Save to localStorage
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updatedTemplates));
    
    return true;
  } catch (error) {
    console.error("Error deleting template:", error);
    return false;
  }
};

// Test API connections
export const testSmsApiConnection = async (): Promise<boolean> => {
  if (!smsConfig.apiKey) {
    toast({
      title: "API Key Required",
      description: "Please enter an API key to test the connection",
      variant: "destructive",
    });
    return false;
  }
  
  try {
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Connection Successful",
      description: `Successfully connected to ${smsConfig.provider} API`,
    });
    
    return true;
  } catch (error) {
    toast({
      title: "Connection Failed",
      description: error instanceof Error ? error.message : "Failed to connect to SMS API",
      variant: "destructive",
    });
    
    return false;
  }
};

export const testAiApiConnection = async (): Promise<boolean> => {
  if (!aiConfig.apiKey) {
    toast({
      title: "API Key Required",
      description: "Please enter an API key to test the connection",
      variant: "destructive",
    });
    return false;
  }
  
  try {
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Connection Successful",
      description: `Successfully connected to ${aiConfig.provider} API (${aiConfig.model})`,
    });
    
    return true;
  } catch (error) {
    toast({
      title: "Connection Failed",
      description: error instanceof Error ? error.message : "Failed to connect to AI API",
      variant: "destructive",
    });
    
    return false;
  }
};

// Get current configurations
export const getSmsApiConfig = (): SmsApiConfig => ({ ...smsConfig });
export const getAiApiConfig = (): AiApiConfig => ({ ...aiConfig });
