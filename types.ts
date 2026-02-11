
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
  property_id: string;
  tenant_id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  message?: string;
  // Join data
  properties?: {
    title: string;
    area: string;
  };
  profiles?: {
    name: string;
  };
}

export interface Message {
  id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  owner_id: string;
  property_id: string;
  // UI helper fields
  participantName: string;
  participantRole: 'Tenant' | 'Owner';
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
