/**
 * Message Templates — live CRUD backed by the Sorcery API.
 */

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, RefreshCw, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MessageTemplate from "@/components/Messaging/MessageTemplate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useTemplateUsage } from "@/hooks/useApi";
import { ApiError } from "@/lib/api";
import type { MessageTemplateType } from "@/lib/types";

const categories = [
  { value: "marketing", label: "Marketing" },
  { value: "notification", label: "Notification" },
  { value: "reminder", label: "Reminder" },
  { value: "alert", label: "Alert" },
  { value: "other", label: "Other" },
];

const MessageTemplates = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<MessageTemplateType | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("marketing");

  const { data, isLoading, refetch, isFetching } = useTemplates({ q: debouncedSearch, category: categoryFilter });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const templateUsage = useTemplateUsage();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 280);
    return () => clearTimeout(t);
  }, [search]);

  const templates = useMemo(() => data?.items ?? [], [data]);

  const handleAddTemplate = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both a title and content");
      return;
    }
    try {
      await createTemplate.mutateAsync({ title, content, category });
      toast.success("Template created");
      setTitle(""); setContent(""); setCategory("marketing");
      setShowNewTemplate(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create template");
    }
  };

  const handleEditTemplate = async () => {
    if (!currentTemplate?.title.trim() || !currentTemplate?.content.trim()) {
      toast.error("Please provide both a title and content");
      return;
    }
    try {
      await updateTemplate.mutateAsync({
        id: currentTemplate.id,
        title: currentTemplate.title,
        content: currentTemplate.content,
        category: currentTemplate.category,
      });
      toast.success("Template updated");
      setShowEditTemplate(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update template");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success("Template deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete template");
    }
  };

  const handleUseTemplate = (id: string, templateContent: string) => {
    templateUsage.mutate(id);
    navigator.clipboard.writeText(templateContent);
    toast.success("Template content copied to clipboard");
  };

  const saving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Message Templates</h1>
            <p className="text-muted-foreground">Reusable, on-brand copy for every occasion</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-9" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={14} className={`mr-1 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" className="h-9" onClick={() => setShowNewTemplate(true)}>
              <Plus size={14} className="mr-1" /> New Template
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-56" />)}
          </div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-1 font-display">No templates found</h3>
              <p className="text-muted-foreground mb-4">
                {search || categoryFilter !== "all" ? "Try a different search term" : "Create your first message template to get started"}
              </p>
              <Button onClick={() => { setSearch(""); setCategoryFilter("all"); setShowNewTemplate(true); }}>
                <Plus size={16} className="mr-1" /> Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <MessageTemplate
                key={template.id}
                id={template.id}
                title={template.title}
                content={template.content}
                category={template.category}
                createdAt={template.createdAt}
                usageCount={template.usageCount}
                model={template.model ?? undefined}
                onEdit={(id) => {
                  const t = templates.find((x) => x.id === id);
                  if (t) { setCurrentTemplate({ ...t }); setShowEditTemplate(true); }
                }}
                onDelete={handleDelete}
                onUse={handleUseTemplate}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>Create New Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="title">Template Name</Label>
              <Input id="title" placeholder="Enter a title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea id="content" placeholder="Write your template… use {{name}} for personalization" rows={5} value={content} onChange={(e) => setContent(e.target.value)} />
              <p className="text-xs text-muted-foreground">{content.length} / 160 characters{content.length > 160 && <span className="text-warning ml-1">(will be split into segments)</span>}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewTemplate(false)}>Cancel</Button>
            <Button onClick={handleAddTemplate} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1 animate-spin" />} Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditTemplate} onOpenChange={setShowEditTemplate}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader><DialogTitle>Edit Template</DialogTitle></DialogHeader>
          {currentTemplate && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Template Name</Label>
                <Input id="edit-title" value={currentTemplate.title} onChange={(e) => setCurrentTemplate({ ...currentTemplate, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={currentTemplate.category} onValueChange={(v) => setCurrentTemplate({ ...currentTemplate, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Message Content</Label>
                <Textarea id="edit-content" rows={5} value={currentTemplate.content} onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })} />
                <p className="text-xs text-muted-foreground">
                  {currentTemplate.content.length} / 160 characters
                  {currentTemplate.content.length > 160 && <span className="text-warning ml-1">(will be split)</span>}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditTemplate(false)}>Cancel</Button>
            <Button onClick={handleEditTemplate} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default MessageTemplates;
