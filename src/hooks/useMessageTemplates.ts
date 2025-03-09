
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type MessageTemplateType = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  usageCount?: number;
  model?: string;
};

// This would come from a real API in production
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

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplateType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setTemplates(SAMPLE_TEMPLATES);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load message templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addTemplate = useCallback(async (templateData: Omit<MessageTemplateType, 'id'>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTemplate: MessageTemplateType = {
        ...templateData,
        id: `template_${Date.now()}`,
        usageCount: 0,
      };
      
      setTemplates(prev => [newTemplate, ...prev]);
      
      toast({
        title: 'Template Created',
        description: 'Your message template has been created successfully',
      });
      
      return newTemplate;
    } catch (error) {
      console.error('Error adding template:', error);
      toast({
        title: 'Error',
        description: 'Failed to create message template',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateTemplate = useCallback(async (id: string, templateData: Partial<MessageTemplateType>) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTemplates(prev => 
        prev.map(template => 
          template.id === id ? { ...template, ...templateData } : template
        )
      );
      
      toast({
        title: 'Template Updated',
        description: 'Your message template has been updated successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTemplates(prev => prev.filter(template => template.id !== id));
      
      toast({
        title: 'Template Deleted',
        description: 'Your message template has been deleted successfully',
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message template',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    templates,
    isLoading,
    loadTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
