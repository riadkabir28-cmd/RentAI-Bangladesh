
export type City = 'Dhaka' | 'Chattogram' | 'Sylhet';

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  city: City;
  area: string;
  bachelorFriendly: boolean;
  verified: boolean;
  verificationStatus?: 'unverified' | 'pending' | 'verified';
  images: string[];
  bedrooms: number;
  bathrooms: number;
  type: 'Apartment' | 'Studio' | 'Shared Room';
  ownerId: string;
  features: string[];
  nearbyAmenities: string[];
  aiMatchScore?: number;
  aiReason?: string;
}

export interface Application {
  id: string;
  propertyId: string;
  tenantId: string;
  tenantName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  message?: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: 'Tenant' | 'Owner';
  lastMessage: string;
  lastTimestamp: string;
  messages: Message[];
  propertyTitle?: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Tenant' | 'Owner';
  isBachelor: boolean;
  budget: number;
  preferences: string[];
  isVerified?: boolean;
}

export interface SearchFilters {
  city: City;
  area: string;
  minPrice: number;
  maxPrice: number;
  bachelorOnly: boolean;
  type: string;
  bedrooms: number | '';
  bathrooms: number | '';
}
