
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui-custom/Button";
import { Badge } from "@/components/ui-custom/Badge";
import { CheckCircle2, Search, Plus, User2, X, UserPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  group?: string;
  tags?: string[];
};

interface ContactsSearchProps {
  onSelectContacts: (contacts: Contact[]) => void;
  selectedContacts?: Contact[];
  showSelected?: boolean;
  maxHeight?: string;
  placeholder?: string;
}

// Sample contacts data (in a real app, this would come from an API)
const sampleContacts: Contact[] = [
  { id: "1", name: "John Doe", phoneNumber: "+12025550142", email: "john@example.com", group: "Friends", tags: ["VIP", "Personal"] },
  { id: "2", name: "Jane Smith", phoneNumber: "+12025550143", email: "jane@example.com", group: "Work", tags: ["Team", "Marketing"] },
  { id: "3", name: "Michael Johnson", phoneNumber: "+12025550144", email: "michael@example.com", group: "Family", tags: ["Personal"] },
  { id: "4", name: "Emma Brown", phoneNumber: "+12025550145", email: "emma@example.com", group: "Work", tags: ["Team", "Support"] },
  { id: "5", name: "Robert Wilson", phoneNumber: "+12025550146", email: "robert@example.com", group: "Clients", tags: ["VIP", "Business"] },
  { id: "6", name: "Sarah Taylor", phoneNumber: "+12025550147", email: "sarah@example.com", group: "Friends", tags: ["Personal"] },
  { id: "7", name: "David Martinez", phoneNumber: "+12025550148", email: "david@example.com", group: "Work", tags: ["Team", "Engineering"] },
  { id: "8", name: "Jennifer Garcia", phoneNumber: "+12025550149", email: "jennifer@example.com", group: "Clients", tags: ["Business"] },
  { id: "9", name: "Thomas Rodriguez", phoneNumber: "+12025550150", email: "thomas@example.com", group: "Family", tags: ["Personal"] },
  { id: "10", name: "Lisa Lewis", phoneNumber: "+12025550151", email: "lisa@example.com", group: "Work", tags: ["Team", "Sales"] },
];

const ContactsSearch = ({
  onSelectContacts,
  selectedContacts = [],
  showSelected = true,
  maxHeight = "300px",
  placeholder = "Search contacts..."
}: ContactsSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Contact[]>(selectedContacts);
  const [contacts, setContacts] = useState<Contact[]>(sampleContacts);
  
  useEffect(() => {
    // This is where you would fetch contacts from an API in a real app
    const filteredContacts = sampleContacts.filter(contact => {
      const searchLower = searchQuery.toLowerCase();
      return (
        contact.name.toLowerCase().includes(searchLower) ||
        contact.phoneNumber.includes(searchQuery) ||
        (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
        (contact.group && contact.group.toLowerCase().includes(searchLower)) ||
        (contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    });
    
    setContacts(filteredContacts);
  }, [searchQuery]);
  
  useEffect(() => {
    // Update parent component with selected contacts
    onSelectContacts(selected);
  }, [selected, onSelectContacts]);
  
  const toggleContact = (contact: Contact) => {
    setSelected(prev => {
      // Check if contact is already selected
      const isSelected = prev.some(item => item.id === contact.id);
      
      if (isSelected) {
        // Remove contact
        return prev.filter(item => item.id !== contact.id);
      } else {
        // Add contact
        return [...prev, contact];
      }
    });
  };
  
  const removeContact = (contactId: string) => {
    setSelected(prev => prev.filter(item => item.id !== contactId));
  };
  
  const isSelected = (contactId: string) => {
    return selected.some(contact => contact.id === contactId);
  };
  
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-7 w-7 px-0"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {showSelected && selected.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
          {selected.map(contact => (
            <Badge key={contact.id} variant="secondary" className="pl-2 flex items-center gap-1">
              {contact.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1 hover:bg-secondary-foreground/10 rounded-full"
                onClick={() => removeContact(contact.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      
      <ScrollArea className="border rounded-md" style={{ maxHeight }}>
        {contacts.length > 0 ? (
          <div className="divide-y">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className={`p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors ${
                  isSelected(contact.id) ? "bg-muted/50" : ""
                }`}
                onClick={() => toggleContact(contact)}
              >
                <div className="flex items-center">
                  <Checkbox
                    id={`contact-${contact.id}`}
                    checked={isSelected(contact.id)}
                    className="mr-3"
                    onCheckedChange={() => toggleContact(contact)}
                  />
                  <div>
                    <div className="font-medium text-sm">{contact.name}</div>
                    <div className="text-xs text-muted-foreground">{contact.phoneNumber}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {contact.group && (
                    <Badge variant="outline" className="mr-2 text-xs">
                      {contact.group}
                    </Badge>
                  )}
                  {isSelected(contact.id) ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center">
            <User2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No contacts found</p>
            <Button size="sm" variant="outline" className="mt-2">
              <UserPlus className="h-4 w-4 mr-1" />
              Add New Contact
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ContactsSearch;
