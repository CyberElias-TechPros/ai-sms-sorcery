
import { MessageTemplateType } from "@/hooks/useMessageTemplates";
import { safeApiCall, ApiResponse } from "@/utils/errorUtils";

const TEMPLATES_STORAGE_KEY = 'message_templates';

/**
 * Fetch all message templates from storage
 */
export const fetchTemplates = async (): Promise<ApiResponse<MessageTemplateType[]>> => {
  return safeApiCall(async () => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const storedTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (storedTemplates) {
      return JSON.parse(storedTemplates) as MessageTemplateType[];
    }
    
    // If no templates in storage yet, initialize with sample templates
    // In a real app, this would come from a backend API
    const sampleTemplates = SAMPLE_TEMPLATES;
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(sampleTemplates));
    
    return sampleTemplates;
  }, "Failed to load message templates");
};

/**
 * Create a new message template
 */
export const createTemplate = async (template: Omit<MessageTemplateType, 'id'>): Promise<ApiResponse<MessageTemplateType>> => {
  return safeApiCall(async () => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newTemplate: MessageTemplateType = {
      ...template,
      id: `template_${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    
    const templates = await fetchTemplates().then(response => response.data || []);
    const updatedTemplates = [newTemplate, ...templates];
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    
    return newTemplate;
  }, "Failed to create template");
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
  id: string, 
  updates: Partial<MessageTemplateType>
): Promise<ApiResponse<MessageTemplateType>> => {
  return safeApiCall(async () => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const templates = await fetchTemplates().then(response => response.data || []);
    let updatedTemplate: MessageTemplateType | undefined;
    
    const updatedTemplates = templates.map(template => {
      if (template.id === id) {
        updatedTemplate = { ...template, ...updates };
        return updatedTemplate;
      }
      return template;
    });
    
    if (!updatedTemplate) {
      throw new Error(`Template with ID ${id} not found`);
    }
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    
    return updatedTemplate;
  }, "Failed to update template");
};

/**
 * Delete a template by ID
 */
export const deleteTemplate = async (id: string): Promise<ApiResponse<boolean>> => {
  return safeApiCall(async () => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const templates = await fetchTemplates().then(response => response.data || []);
    const filteredTemplates = templates.filter(template => template.id !== id);
    
    // If lengths are the same, the template wasn't found
    if (templates.length === filteredTemplates.length) {
      throw new Error(`Template with ID ${id} not found`);
    }
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(filteredTemplates));
    
    return true;
  }, "Failed to delete template");
};

/**
 * Increment the usage count for a template
 */
export const incrementTemplateUsage = async (id: string): Promise<ApiResponse<boolean>> => {
  return safeApiCall(async () => {
    const templates = await fetchTemplates().then(response => response.data || []);
    
    const updatedTemplates = templates.map(template => {
      if (template.id === id) {
        return {
          ...template,
          usageCount: (template.usageCount || 0) + 1,
        };
      }
      return template;
    });
    
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    
    return true;
  });
};

// Sample templates for initial data
// This would come from a backend API in a production app
const SAMPLE_TEMPLATES: MessageTemplateType[] = [
  {
    id: 'template_1',
    title: 'Welcome Message',
    content: "Welcome to our service! We're excited to have you on board. Reply HELP for assistance or STOP to unsubscribe.",
    category: 'marketing',
    createdAt: '2023-05-15T10:30:00Z',
    usageCount: 145,
  },
  {
    id: 'template_2',
    title: 'Appointment Reminder',
    content: 'Reminder: Your appointment is scheduled for tomorrow at {{time}}. Please reply CONFIRM to confirm or RESCHEDULE to change.',
    category: 'reminder',
    createdAt: '2023-06-02T14:15:00Z',
    usageCount: 89,
  },
  {
    id: 'template_3',
    title: 'Order Confirmation',
    content: 'Your order #{{order_id}} has been confirmed! Estimated delivery: {{delivery_date}}. Track your order at {{tracking_url}}',
    category: 'notification',
    createdAt: '2023-06-10T09:45:00Z',
    usageCount: 67,
  },
  {
    id: 'template_4',
    title: 'Flash Sale',
    content: 'FLASH SALE! Get 30% off all items for the next 24 hours. Use code FLASH30 at checkout. Shop now at {{shop_url}}',
    category: 'marketing',
    createdAt: '2023-07-05T16:20:00Z',
    model: 'gpt-4',
    usageCount: 212,
  },
  {
    id: 'template_5',
    title: 'Payment Due',
    content: 'Your invoice #{{invoice_number}} is due in 3 days. Please ensure timely payment to avoid late fees. Total amount: {{amount}}',
    category: 'alert',
    createdAt: '2023-07-18T11:10:00Z',
    usageCount: 53,
  },
  {
    id: 'template_6',
    title: 'Event Invitation',
    content: "You're invited! Join us for {{event_name}} on {{event_date}} at {{event_location}}. RSVP by replying YES or NO.",
    category: 'notification',
    createdAt: '2023-08-01T13:25:00Z',
    model: 'gpt-4',
    usageCount: 34,
  },
];
