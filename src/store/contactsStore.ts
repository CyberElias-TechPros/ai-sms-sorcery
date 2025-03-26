
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact } from '@/components/Contacts/ContactsSearch';

interface ContactsState {
  contacts: Contact[];
  isLoading: boolean;
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, data: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  getContactById: (id: string) => Contact | undefined;
  getContactsByGroup: (group: string) => Contact[];
  getContactsByTag: (tag: string) => Contact[];
  searchContacts: (query: string) => Contact[];
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [
        { id: "1", name: "John Doe", phoneNumber: "+12025550142", email: "john@example.com", group: "Friends", tags: ["VIP", "Personal"] },
        { id: "2", name: "Jane Smith", phoneNumber: "+12025550143", email: "jane@example.com", group: "Work", tags: ["Team", "Marketing"] },
        { id: "3", name: "Michael Johnson", phoneNumber: "+12025550144", email: "michael@example.com", group: "Family", tags: ["Personal"] },
        { id: "4", name: "Emma Brown", phoneNumber: "+12025550145", email: "emma@example.com", group: "Work", tags: ["Team", "Support"] },
        { id: "5", name: "Robert Wilson", phoneNumber: "+12025550146", email: "robert@example.com", group: "Clients", tags: ["VIP", "Business"] },
      ],
      isLoading: false,
      
      addContact: (contactData) => set((state) => {
        const newContact: Contact = {
          ...contactData,
          id: `contact_${Date.now()}`,
        };
        
        return { contacts: [...state.contacts, newContact] };
      }),
      
      updateContact: (id, data) => set((state) => ({
        contacts: state.contacts.map((contact) => 
          contact.id === id ? { ...contact, ...data } : contact
        ),
      })),
      
      deleteContact: (id) => set((state) => ({
        contacts: state.contacts.filter((contact) => contact.id !== id),
      })),
      
      getContactById: (id) => {
        return get().contacts.find((contact) => contact.id === id);
      },
      
      getContactsByGroup: (group) => {
        return get().contacts.filter((contact) => contact.group === group);
      },
      
      getContactsByTag: (tag) => {
        return get().contacts.filter(
          (contact) => contact.tags && contact.tags.includes(tag)
        );
      },
      
      searchContacts: (query) => {
        const searchLower = query.toLowerCase();
        return get().contacts.filter((contact) => 
          contact.name.toLowerCase().includes(searchLower) ||
          contact.phoneNumber.includes(query) ||
          (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
          (contact.group && contact.group.toLowerCase().includes(searchLower)) ||
          (contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      },
    }),
    {
      name: 'contacts-storage',
    }
  )
);
