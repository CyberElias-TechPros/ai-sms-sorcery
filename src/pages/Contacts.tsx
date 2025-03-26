
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui-custom/Card";
import { Button } from "@/components/ui-custom/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui-custom/Badge";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Contact } from "@/components/Contacts/ContactsSearch";
import { useContactsStore } from "@/store/contactsStore";
import { 
  Search, Plus, Edit, Trash2, UserPlus, X, Tag, Users, ArrowUpDown, Download, Upload, MoreHorizontal, 
  User, Phone, Mail, UsersRound, Check, Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Available contact groups
const contactGroups = ["Friends", "Family", "Work", "Clients", "Subscribers"];

// Available contact tags
const contactTags = ["VIP", "Personal", "Business", "Team", "Marketing", "Support", "Inactive"];

const Contacts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    contacts, 
    addContact, 
    updateContact, 
    deleteContact, 
    searchContacts, 
    getContactsByGroup, 
    getContactsByTag 
  } = useContactsStore();
  
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(contacts);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    group: "",
  });
  
  useEffect(() => {
    let result = contacts;
    
    // Apply filters
    if (searchQuery) {
      result = searchContacts(searchQuery);
    }
    
    if (selectedGroup) {
      result = result.filter(contact => contact.group === selectedGroup);
    }
    
    if (selectedTag) {
      result = result.filter(
        contact => contact.tags && contact.tags.includes(selectedTag)
      );
    }
    
    setFilteredContacts(result);
  }, [contacts, searchQuery, selectedGroup, selectedTag, searchContacts]);
  
  const openAddContactDialog = () => {
    setIsEditMode(false);
    setCurrentContact(null);
    setFormData({
      name: "",
      phoneNumber: "",
      email: "",
      group: "",
    });
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleAddTag = () => {
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
      setNewTag("");
    }
  };
  
  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  const handleSaveContact = () => {
    if (!formData.name || !formData.phoneNumber) {
      toast.error("Name and phone number are required");
      return;
    }
    
    // Phone validation
    const phoneRegex = /^\+\d{10,15}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error("Phone number must be in international format (e.g., +12025550142)");
      return;
    }
    
    // Email validation (if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    
    setIsLoading(true);
    
    setTimeout(() => {
      try {
        if (isEditMode && currentContact) {
          // Update existing contact
          updateContact(currentContact.id, {
            ...formData,
            tags: selectedTags,
          });
          toast.success("Contact updated successfully");
        } else {
          // Create new contact
          addContact({
            ...formData,
            tags: selectedTags,
          });
          toast.success("Contact added successfully");
        }
        
        setContactDialogOpen(false);
      } catch (error) {
        console.error("Error saving contact:", error);
        toast.error("Failed to save contact");
      } finally {
        setIsLoading(false);
      }
    }, 500); // Simulating API delay
  };
  
  const handleDeleteContact = (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteContact(id);
      toast.success("Contact deleted successfully");
    }
  };
  
  const exportContacts = () => {
    try {
      const dataString = JSON.stringify(contacts, null, 2);
      const blob = new Blob([dataString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Contacts exported successfully");
    } catch (error) {
      console.error("Error exporting contacts:", error);
      toast.error("Failed to export contacts");
    }
  };
  
  const importContacts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === "string") {
          const importedContacts = JSON.parse(result);
          
          if (Array.isArray(importedContacts)) {
            // In a real app, we would validate each contact and handle duplicates
            importedContacts.forEach(contact => {
              if (contact.name && contact.phoneNumber) {
                addContact(contact);
              }
            });
            
            toast.success(`Imported ${importedContacts.length} contacts`);
          } else {
            toast.error("Invalid import format");
          }
        }
      } catch (error) {
        console.error("Error importing contacts:", error);
        toast.error("Failed to import contacts");
      }
    };
    
    reader.readAsText(file);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your contacts for SMS campaigns
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={openAddContactDialog}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportContacts}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Contacts
                </DropdownMenuItem>
                <Label htmlFor="import-contacts" className="cursor-pointer">
                  <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Contacts
                  </DropdownMenuItem>
                </Label>
                <Input 
                  id="import-contacts" 
                  type="file" 
                  accept=".json" 
                  className="hidden" 
                  onChange={importContacts}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Filter by Group</Label>
                <ScrollArea className="h-36 border rounded-md">
                  <div className="p-2 space-y-1">
                    <div 
                      className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${selectedGroup === null ? "bg-primary/10" : ""}`}
                      onClick={() => setSelectedGroup(null)}
                    >
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>All Groups</span>
                      {selectedGroup === null && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </div>
                    {contactGroups.map(group => (
                      <div 
                        key={group} 
                        className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${selectedGroup === group ? "bg-primary/10" : ""}`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <UsersRound className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{group}</span>
                        {selectedGroup === group && <Check className="h-4 w-4 ml-auto text-primary" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="space-y-2">
                <Label>Filter by Tag</Label>
                <ScrollArea className="h-36 border rounded-md">
                  <div className="p-2 space-y-1">
                    <div 
                      className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${selectedTag === null ? "bg-primary/10" : ""}`}
                      onClick={() => setSelectedTag(null)}
                    >
                      <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>All Tags</span>
                      {selectedTag === null && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </div>
                    {contactTags.map(tag => (
                      <div 
                        key={tag} 
                        className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted/50 ${selectedTag === tag ? "bg-primary/10" : ""}`}
                        onClick={() => setSelectedTag(tag)}
                      >
                        <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{tag}</span>
                        {selectedTag === tag && <Check className="h-4 w-4 ml-auto text-primary" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
          
          {/* Right Content Area - Contact List */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{filteredContacts.length} Contacts</span>
                <Button variant="ghost" size="sm">
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Sort by Name
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No contacts found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedGroup || selectedTag
                      ? "Try adjusting your filters"
                      : "Start by adding your first contact"}
                  </p>
                  <Button onClick={openAddContactDialog}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredContacts.map((contact) => (
                    <div key={contact.id} className="py-4 flex justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          {contact.phoneNumber}
                        </div>
                        {contact.email && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 mr-1" />
                            {contact.email}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.group && (
                            <Badge variant="outline" size="sm" className="bg-muted/50">
                              <Users className="h-3 w-3 mr-1" />
                              {contact.group}
                            </Badge>
                          )}
                          {contact.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" size="sm">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditContactDialog(contact)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(contact.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Contact Add/Edit Dialog */}
        <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Contact" : "Add New Contact"}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Update the contact details" 
                  : "Fill in the contact details to add a new contact"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+12025550142"
                  value={formData.phoneNumber}
                  onChange={(e) => handleFormChange("phoneNumber", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter number in international format (e.g., +12025550142)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="group">Group</Label>
                <Select 
                  value={formData.group} 
                  onValueChange={(value) => handleFormChange("group", value)}
                >
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {contactGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 border rounded-md p-2 min-h-[42px]">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-4 w-4 p-0 hover:bg-transparent" 
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Select 
                    value={newTag} 
                    onValueChange={setNewTag}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTags
                        .filter(tag => !selectedTags.includes(tag))
                        .map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleAddTag}
                    disabled={!newTag}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setContactDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveContact}
                disabled={isLoading || !formData.name || !formData.phoneNumber}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEditMode ? "Update Contact" : "Add Contact"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Contacts;
