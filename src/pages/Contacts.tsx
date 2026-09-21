/**
 * Contacts — live CRUD, filters, tags, import/export against the Sorcery API.
 */

import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui-custom/Badge";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Contact } from "@/lib/types";
import {
  useContacts, useCreateContact, useUpdateContact, useDeleteContact, useImportContacts,
} from "@/hooks/useApi";
import { api, ApiError } from "@/lib/api";
import { Reveal } from "@/lib/motion";
import {
  Search, UserPlus, Edit, Trash2, X, Tag, Users, Download, Upload, MoreHorizontal,
  User, Phone, Mail, UsersRound, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const contactTags = ["VIP", "Personal", "Business", "Team", "Marketing", "Support", "Inactive"];

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [formData, setFormData] = useState({ name: "", phoneNumber: "", email: "", group: "" });

  const { data, isLoading } = useContacts({ q: debouncedQuery, pageSize: 200 });
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const importContacts = useImportContacts();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 280);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const groups = useMemo(() => {
    const g = new Set<string>(data?.groups ?? []);
    (data?.items ?? []).forEach((c) => c.group && g.add(c.group));
    return [...g].sort();
  }, [data]);

  const filteredContacts = useMemo(() => {
    let result = data?.items ?? [];
    if (selectedGroup) result = result.filter((c) => c.group === selectedGroup);
    if (selectedTag) result = result.filter((c) => c.tags?.includes(selectedTag));
    return result;
  }, [data, selectedGroup, selectedTag]);

  const openAddContactDialog = () => {
    setIsEditMode(false);
    setCurrentContact(null);
    setFormData({ name: "", phoneNumber: "", email: "", group: "" });
    setSelectedTags([]);
    setContactDialogOpen(true);
  };

  const openEditContactDialog = (contact: Contact) => {
    setIsEditMode(true);
    setCurrentContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      email: contact.email || "",
      group: contact.group || "",
    });
    setSelectedTags(contact.tags || []);
    setContactDialogOpen(true);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
      setNewTag("");
    }
  };

  const handleSaveContact = async () => {
    if (!formData.name || !formData.phoneNumber) {
      toast.error("Name and phone number are required");
      return;
    }
    try {
      if (isEditMode && currentContact) {
        await updateContact.mutateAsync({ id: currentContact.id, ...formData, tags: selectedTags } as never);
        toast.success("Contact updated successfully");
      } else {
        await createContact.mutateAsync({ ...formData, tags: selectedTags } as never);
        toast.success("Contact added successfully");
      }
      setContactDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save contact");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContact.mutateAsync(id);
        toast.success("Contact deleted successfully");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to delete contact");
      }
    }
  };

  const exportContacts = async () => {
    try {
      const result = await api.exportContacts();
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${result.count} contacts`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to export contacts");
    }
  };

  const importFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== "string") return;
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : parsed.contacts;
        if (!Array.isArray(list)) {
          toast.error("Invalid import format — expected an array of contacts");
          return;
        }
        const result = await importContacts.mutateAsync(list);
        toast.success(`Imported ${result.created} contacts (${result.updated} updated, ${result.skipped} skipped)`);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to import contacts");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const saving = createContact.isPending || updateContact.isPending;

  return (
    <Layout>
      <div className="space-y-6 page-enter">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <Reveal>
            <h1 className="text-3xl font-bold tracking-tight font-display">Contacts</h1>
            <p className="text-muted-foreground">The people you reach — groups, tags and opt-out status</p>
          </Reveal>

          <div className="flex items-center gap-2">
            <Button onClick={openAddContactDialog}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Contact
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportContacts}>
                  <Download className="h-4 w-4 mr-2" /> Export Contacts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); document.getElementById("import-contacts")?.click(); }}>
                  <Upload className="h-4 w-4 mr-2" /> Import Contacts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Input id="import-contacts" type="file" accept=".json" className="hidden" onChange={importFromFile} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Reveal className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader><CardTitle className="text-base">Filters</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>

                <div className="space-y-2">
                  <Label>Groups</Label>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      <button
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${!selectedGroup ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                        onClick={() => setSelectedGroup(null)}
                      >
                        <UsersRound className="inline h-3.5 w-3.5 mr-1.5" />All groups
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${selectedGroup === g ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                          onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
                        >
                          <Users className="inline h-3.5 w-3.5 mr-1.5" />{g}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {contactTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        <Tag size={10} className="mr-1" />{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Reveal>

          <div className="lg:col-span-3">
            <Card variant="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User size={16} /> {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
                  {(selectedGroup || selectedTag || searchQuery) && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setSelectedGroup(null); setSelectedTag(null); setSearchQuery(""); }}>
                      Clear filters
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16" />)}</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users size={44} className="mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || selectedGroup || selectedTag
                        ? "Try adjusting your filters"
                        : "Add your first contact to start sending messages"}
                    </p>
                    <Button onClick={openAddContactDialog}><UserPlus className="h-4 w-4 mr-2" />Add Contact</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-all hover:shadow-subtle spotlight"
                        onMouseMove={(e) => {
                          const el = e.currentTarget;
                          const rect = el.getBoundingClientRect();
                          el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
                          el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
                        }}
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                          {contact.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{contact.name}</p>
                            {contact.group && <Badge variant="outline" size="sm">{contact.group}</Badge>}
                            {contact.optedOut && <Badge variant="outline" size="sm" className="text-destructive bg-destructive/10">Opted out</Badge>}
                            {(contact.tags ?? []).map((t) => (
                              <Badge key={t} variant="secondary" size="sm">{t}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 mt-0.5 text-xs text-muted-foreground">
                            <span className="flex items-center tabular"><Phone size={11} className="mr-1" />{contact.phoneNumber}</span>
                            {contact.email && <span className="flex items-center"><Mail size={11} className="mr-1" />{contact.email}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditContactDialog(contact)} aria-label={`Edit ${contact.name}`}>
                            <Edit size={15} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteContact(contact.id)} aria-label={`Delete ${contact.name}`}>
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleFormChange("name", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" value={formData.phoneNumber} onChange={(e) => handleFormChange("phoneNumber", e.target.value)} placeholder="+12025550142" className="tabular" />
              <p className="text-xs text-muted-foreground">International format with country code</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => handleFormChange("email", e.target.value)} placeholder="jane@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Input id="group" value={formData.group} onChange={(e) => handleFormChange("group", e.target.value)} placeholder="Friends, Work, Clients…" />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => setSelectedTags((p) => p.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
                      <X size={11} />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add a tag"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }} />
                <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
              {isEditMode ? "Save Changes" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Contacts;
