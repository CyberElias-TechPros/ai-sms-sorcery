/**
 * ContactsSearch — live contact picker backed by the Sorcery API.
 */

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui-custom/Badge";
import { CheckCircle2, Search, User2, X, Users } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContacts } from "@/hooks/useApi";
import type { Contact } from "@/lib/types";

export type { Contact };

interface ContactsSearchProps {
  onSelectContacts: (contacts: Contact[]) => void;
  selectedContacts?: Contact[];
  showSelected?: boolean;
  maxHeight?: string;
  placeholder?: string;
}

const ContactsSearch = ({
  onSelectContacts,
  selectedContacts = [],
  showSelected = true,
  maxHeight = "300px",
  placeholder = "Search contacts...",
}: ContactsSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<Contact[]>(selectedContacts);
  const { data, isLoading } = useContacts({ q: searchQuery, pageSize: 100 });

  const contacts = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    setSelected(selectedContacts);
  }, [selectedContacts]);

  const toggle = (contact: Contact) => {
    const exists = selected.some((c) => c.id === contact.id);
    const next = exists ? selected.filter((c) => c.id !== contact.id) : [...selected, contact];
    setSelected(next);
    onSelectContacts(next);
  };

  const remove = (id: string) => {
    const next = selected.filter((c) => c.id !== id);
    setSelected(next);
    onSelectContacts(next);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {showSelected && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <Badge key={c.id} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
              <span className="text-xs">{c.name}</span>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="rounded-full p-0.5 hover:bg-background/60"
                aria-label={`Remove ${c.name}`}
              >
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <ScrollArea className="pr-2" style={{ maxHeight }}>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="py-10 text-center">
            <Users size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No contacts match your search" : "No contacts yet — add some from the Contacts page"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {contacts.map((contact) => {
              const isSelected = selected.some((c) => c.id === contact.id);
              return (
                <label
                  key={contact.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"
                  }`}
                >
                  <Checkbox checked={isSelected} onCheckedChange={() => toggle(contact)} />
                  <User2 size={16} className="text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate tabular">{contact.phoneNumber}</p>
                  </div>
                  {contact.group && (
                    <Badge variant="outline" size="sm" className="hidden sm:inline-flex">{contact.group}</Badge>
                  )}
                  {isSelected && <CheckCircle2 size={15} className="text-primary shrink-0" />}
                </label>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ContactsSearch;
