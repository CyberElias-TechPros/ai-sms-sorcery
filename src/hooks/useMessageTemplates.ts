
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as templateService from '@/services/templateService';

export type MessageTemplateType = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  usageCount?: number;
  model?: string;
};

export const useMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplateType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await templateService.fetchTemplates();
      
      if (response.success && response.data) {
        setTemplates(response.data);
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to load message templates',
          variant: 'destructive',
        });
      }
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
      const response = await templateService.createTemplate(templateData);
      
      if (response.success && response.data) {
        setTemplates(prev => [response.data!, ...prev]);
        
        toast({
          title: 'Template Created',
          description: 'Your message template has been created successfully',
        });
        
        return response.data;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to create message template',
          variant: 'destructive',
        });
        return null;
      }
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
      const response = await templateService.updateTemplate(id, templateData);
      
      if (response.success && response.data) {
        setTemplates(prev => 
          prev.map(template => 
            template.id === id ? response.data! : template
          )
        );
        
        toast({
          title: 'Template Updated',
          description: 'Your message template has been updated successfully',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to update message template',
          variant: 'destructive',
        });
        return false;
      }
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
      const response = await templateService.deleteTemplate(id);
      
      if (response.success) {
        setTemplates(prev => prev.filter(template => template.id !== id));
        
        toast({
          title: 'Template Deleted',
          description: 'Your message template has been deleted successfully',
        });
        
        return true;
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to delete message template',
          variant: 'destructive',
        });
        return false;
      }
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

  // Optional: automatically load templates when the hook is first used
  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    templates,
    isLoading,
    loadTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
