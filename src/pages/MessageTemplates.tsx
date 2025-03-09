
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  MessageSquare, 
  CheckCircle2,
  BrainCircuit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MessageTemplate from "@/components/Messaging/MessageTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useMessageTemplates } from "@/hooks/useMessageTemplates";

const MessageTemplates = () => {
  const { toast } = useToast();
  const { 
    templates, 
    loadTemplates, 
    addTemplate, 
    updateTemplate, 
    deleteTemplate,
    isLoading 
  } = useMessageTemplates();
  
  const [search, setSearch] = useState("");
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  
  // New template state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("marketing");
  
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
  
  const handleAddTemplate = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your template",
        variant: "destructive",
      });
      return;
    }
    
    addTemplate({
      title,
      content,
      category,
      createdAt: new Date().toISOString(),
    });
    
    // Reset form
    setTitle("");
    setContent("");
    setCategory("marketing");
    setShowNewTemplate(false);
  };
  
  const handleEditTemplate = () => {
    if (!currentTemplate || !currentTemplate.title.trim() || !currentTemplate.content.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content for your template",
        variant: "destructive",
      });
      return;
    }
    
    updateTemplate(currentTemplate.id, currentTemplate);
    setShowEditTemplate(false);
  };
  
  const handleEdit = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setCurrentTemplate({...template});
      setShowEditTemplate(true);
    }
  };
  
  const handleDelete = (id: string) => {
    deleteTemplate(id);
  };
  
  const handleUseTemplate = (id: string, content: string) => {
    // In a real app, this would store the selected template
    // and redirect to the composer with it pre-filled
    toast({
      title: "Template Selected",
      description: "Template content copied to clipboard!",
    });
    navigator.clipboard.writeText(content);
  };
  
  const filteredTemplates = templates.filter(template => 
    template.title.toLowerCase().includes(search.toLowerCase()) ||
    template.content.toLowerCase().includes(search.toLowerCase()) ||
    template.category.toLowerCase().includes(search.toLowerCase())
  );
  
  const categories = [
    { value: "marketing", label: "Marketing" },
    { value: "notification", label: "Notification" },
    { value: "reminder", label: "Reminder" },
    { value: "alert", label: "Alert" },
    { value: "other", label: "Other" }
  ];
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Message Templates</h1>
            <p className="text-muted-foreground">
              Create and manage reusable message templates for your SMS campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => loadTemplates()}
              disabled={isLoading}
            >
              <RefreshCw size={14} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm"
              className="h-9"
              onClick={() => setShowNewTemplate(true)}
            >
              <Plus size={14} className="mr-1" />
              New Template
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            defaultValue="all"
            onValueChange={(value) => {
              if (value === "all") {
                setSearch("");
              } else {
                setSearch(value);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="opacity-50 animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-5 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-20 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted rounded"></div>
                </CardContent>
                <CardFooter>
                  <div className="h-8 w-full bg-muted rounded"></div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-1">No templates found</h3>
                  <p className="text-muted-foreground mb-4">
                    {search ? "Try a different search term" : "Create your first message template to get started"}
                  </p>
                  <Button 
                    onClick={() => {
                      setSearch("");
                      setShowNewTemplate(true);
                    }}
                  >
                    <Plus size={16} className="mr-1" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <MessageTemplate
                    key={template.id}
                    id={template.id}
                    title={template.title}
                    content={template.content}
                    category={template.category}
                    createdAt={template.createdAt}
                    usageCount={template.usageCount}
                    model={template.model}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUse={handleUseTemplate}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* New Template Dialog */}
      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Name</Label>
              <Input
                id="title"
                placeholder="Enter a title for your template"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your message template content here..."
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {content.length} / 160 characters
                {content.length > 160 && (
                  <span className="text-destructive ml-1">
                    (Message will be split)
                  </span>
                )}
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 flex-1 justify-center gap-1"
                onClick={() => {
                  // In a production app, this would open the AI generator
                  toast({
                    title: "AI Generator",
                    description: "This would open the AI message generator in a real app",
                  });
                }}
              >
                <BrainCircuit size={14} />
                <span>Generate with AI</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 flex-1 justify-center gap-1"
                onClick={() => {
                  // Simulate selecting from a library
                  const examples = [
                    "Limited time offer! Get 25% off on all premium plans. Reply YES to claim.",
                    "Your appointment is scheduled for tomorrow at 2:00 PM. Reply CONFIRM to confirm.",
                    "Thank you for your purchase! Your order #12345 has been confirmed."
                  ];
                  setContent(examples[Math.floor(Math.random() * examples.length)]);
                }}
              >
                <CheckCircle2 size={14} />
                <span>Example Templates</span>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowNewTemplate(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddTemplate}
            >
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Template Dialog */}
      <Dialog open={showEditTemplate} onOpenChange={setShowEditTemplate}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {currentTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Template Name</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter a title for your template"
                  value={currentTemplate.title}
                  onChange={(e) => setCurrentTemplate({...currentTemplate, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={currentTemplate.category}
                  onValueChange={(value) => setCurrentTemplate({...currentTemplate, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content">Message Content</Label>
                <Textarea
                  id="edit-content"
                  placeholder="Enter your message template content here..."
                  rows={5}
                  value={currentTemplate.content}
                  onChange={(e) => setCurrentTemplate({...currentTemplate, content: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {currentTemplate.content.length} / 160 characters
                  {currentTemplate.content.length > 160 && (
                    <span className="text-destructive ml-1">
                      (Message will be split)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowEditTemplate(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditTemplate}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MessageTemplates;
