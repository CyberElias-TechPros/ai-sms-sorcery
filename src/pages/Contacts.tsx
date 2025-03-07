
import Layout from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui-custom/Card";
import { Badge } from "@/components/ui-custom/Badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Users, UserPlus, ArrowLeft, Search, Filter, UserCircle,
  MoreVertical, Plus, Upload, Download, Tags, Phone, Mail
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { checkNumberOnWhatsApp } from "@/utils/whatsappUtils";

// Sample contacts data
const sampleContacts = [
  { id: 1, name: "John Doe", phone: "+1234567890", email: "john@example.com", group: "Customers", whatsapp: true },
  { id: 2, name: "Jane Smith", phone: "+2345678901", email: "jane@example.com", group: "Leads", whatsapp: true },
  { id: 3, name: "Robert Johnson", phone: "+3456789012", email: "robert@example.com", group: "Vendors", whatsapp: false },
  { id: 4, name: "Emily Davis", phone: "+4567890123", email: "emily@example.com", group: "Customers", whatsapp: true },
  { id: 5, name: "Michael Wilson", phone: "+5678901234", email: "michael@example.com", group: "Subscribers", whatsapp: false },
  { id: 6, name: "Sarah Brown", phone: "+6789012345", email: "sarah@example.com", group: "Leads", whatsapp: true },
  { id: 7, name: "David Miller", phone: "+7890123456", email: "david@example.com", group: "Customers", whatsapp: true },
  { id: 8, name: "Jessica Taylor", phone: "+8901234567", email: "jessica@example.com", group: "Subscribers", whatsapp: false },
  { id: 9, name: "Thomas Anderson", phone: "+9012345678", email: "thomas@example.com", group: "Vendors", whatsapp: true },
  { id: 10, name: "Jennifer Martin", phone: "+0123456789", email: "jennifer@example.com", group: "Customers", whatsapp: true },
];

// Sample groups data
const sampleGroups = [
  { id: 1, name: "Customers", count: 4 },
  { id: 2, name: "Leads", count: 2 },
  { id: 3, name: "Vendors", count: 2 },
  { id: 4, name: "Subscribers", count: 2 },
];

const Contacts = () => {
  const [contacts, setContacts] = useState(sampleContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  
  // Filter contacts based on search query and active group
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGroup = activeGroup ? contact.group === activeGroup : true;
    
    return matchesSearch && matchesGroup;
  });
  
  const handleSelectContact = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId) 
        : [...prev, contactId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };
  
  const handleGroupClick = (groupName: string) => {
    setActiveGroup(activeGroup === groupName ? null : groupName);
  };
  
  const checkWhatsAppStatus = async (contactId: number) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    try {
      const isOnWhatsApp = await checkNumberOnWhatsApp(contact.phone);
      
      setContacts(prev => prev.map(c => 
        c.id === contactId ? { ...c, whatsapp: isOnWhatsApp } : c
      ));
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                <a href="/dashboard">
                  <ArrowLeft size={16} />
                </a>
              </Button>
              <Badge variant="outline" size="sm">
                <Users size={12} className="mr-1" />
                Directory
              </Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your contacts and organize them into groups
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Upload size={14} className="mr-1.5" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-1.5" />
              Export
            </Button>
            <Button size="sm">
              <UserPlus size={14} className="mr-1.5" />
              Add Contact
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Groups Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Groups Card */}
            <Card variant="border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Groups</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Plus size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-1">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start font-normal text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveGroup(null)}
                    >
                      <Users size={16} className="mr-2" />
                      <span>All Contacts</span>
                      <Badge variant="outline" className="ml-auto h-5 px-1.5">
                        {contacts.length}
                      </Badge>
                    </Button>
                    
                    {sampleGroups.map(group => (
                      <Button 
                        key={group.id}
                        variant={activeGroup === group.name ? "secondary" : "ghost"}
                        className="w-full justify-start font-normal"
                        onClick={() => handleGroupClick(group.name)}
                      >
                        <Tags size={16} className="mr-2" />
                        <span>{group.name}</span>
                        <Badge variant="outline" className="ml-auto h-5 px-1.5">
                          {group.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card variant="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal">
                    <UserPlus size={14} className="mr-2" />
                    Create New Contact
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal">
                    <Tags size={14} className="mr-2" />
                    Create New Group  
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal">
                    <Upload size={14} className="mr-2" />
                    Import from CSV
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-normal">
                    <Phone size={14} className="mr-2" />
                    Verify WhatsApp Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Contacts Table */}
          <div className="lg:col-span-3">
            <Card variant="border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-sm font-medium">
                    {activeGroup ? `${activeGroup} Contacts` : "All Contacts"}
                  </CardTitle>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search contacts..."
                        className="pl-8 h-9 w-[180px] sm:w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Button variant="outline" size="sm" className="h-9 px-2 sm:px-3">
                      <Filter size={16} className="sm:mr-2" />
                      <span className="hidden sm:inline">Filter</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {filteredContacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <UserCircle size={48} className="text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      {searchQuery 
                        ? `No contacts matching "${searchQuery}"`
                        : "You don't have any contacts yet. Add your first contact to get started."}
                    </p>
                    <Button>
                      <UserPlus size={16} className="mr-2" />
                      Add New Contact
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="relative overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="px-4 py-3 text-left font-medium">
                              <div className="flex items-center">
                                <Checkbox 
                                  checked={selectedContacts.length > 0 && selectedContacts.length === filteredContacts.length}
                                  onCheckedChange={handleSelectAll}
                                  aria-label="Select all contacts"
                                />
                              </div>
                            </th>
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">Phone</th>
                            <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Email</th>
                            <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Group</th>
                            <th className="px-4 py-3 text-left font-medium">WhatsApp</th>
                            <th className="px-4 py-3 text-right font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredContacts.map((contact) => (
                            <tr key={contact.id} className="border-b hover:bg-muted/50">
                              <td className="px-4 py-3">
                                <Checkbox 
                                  checked={selectedContacts.includes(contact.id)}
                                  onCheckedChange={() => handleSelectContact(contact.id)}
                                  aria-label={`Select ${contact.name}`}
                                />
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {contact.name}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {contact.phone}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                                {contact.email}
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <Badge variant="outline" size="sm">
                                  {contact.group}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div 
                                  className={`w-6 h-6 rounded-full flex items-center justify-center
                                    ${contact.whatsapp 
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-muted text-muted-foreground'}
                                  `}
                                  onClick={() => checkWhatsAppStatus(contact.id)}
                                  title={contact.whatsapp ? "Available on WhatsApp" : "Not on WhatsApp"}
                                >
                                  <Phone size={14} />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical size={16} />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                                    <DropdownMenuItem>Send Message</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      Delete Contact
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {selectedContacts.length > 0 && (
                  <div className="flex items-center justify-between mt-4 bg-muted/50 p-2 rounded-md">
                    <div className="text-sm font-medium">
                      {selectedContacts.length} contacts selected
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Tags size={14} className="mr-1.5" />
                        Add to Group
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail size={14} className="mr-1.5" />
                        Send Message
                      </Button>
                      <Button variant="destructive" size="sm">
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contacts;
