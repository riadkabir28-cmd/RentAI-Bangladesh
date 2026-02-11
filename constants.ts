
import { Property } from './types';

export const AREAS_DHAKA = [
  'Banani', 'Gulshan', 'Dhanmondi', 'Mirpur', 'Uttara', 'Bashundhara', 'Mohammadpur', 'Badda', 'Aftabnagar', 'Lalbagh'
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Executive Studio in Banani (Near Metro)',
    description: 'Perfect for corporate professionals. 5 mins walk from Banani Metro Station. 24/7 security with smart NID verified owner.',
    price: 28000,
    location: 'Block F, Road 11, Banani',
    city: 'Dhaka',
    area: 'Banani',
    bachelorFriendly: true,
    verified: true,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800'],
    bedrooms: 1,
    bathrooms: 1,
    type: 'Studio',
    ownerId: 'owner1',
    features: ['WiFi', 'AC', 'Security', 'Lift', 'Near Metro'],
    nearbyAmenities: ['Unimart', 'Banani Metro', 'Road 11 Shops', 'Kemal Ataturk Avenue']
  },
  {
    id: '2',
    title: 'Dhanmondi Lake-View Family Home',
    description: 'Beautiful 3BHK overlooking Dhanmondi Lake. South facing, airy, and strictly for families. No brokers.',
    price: 55000,
    location: 'Road 32, Dhanmondi',
    city: 'Dhaka',
    area: 'Dhanmondi',
    bachelorFriendly: false,
    verified: true,
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800'],
    bedrooms: 3,
    bathrooms: 3,
    type: 'Apartment',
    ownerId: 'owner2',
    features: ['Lake View', 'Generator', 'Parking', 'CCTV'],
    nearbyAmenities: ['Dhanmondi Lake', 'Ibn Sina', 'Mastermind School', 'Rapa Plaza']
  },
  {
    id: '3',
    title: 'Aftabnagar Student Shared Flat',
    description: 'Ideal for students of EWU or NSU. Spacious rooms, friendly bachelors allowed. Zero discrimination.',
    price: 12000,
    location: 'Block C, Aftabnagar',
    city: 'Dhaka',
    area: 'Aftabnagar',
    bachelorFriendly: true,
    verified: false,
    images: ['https://images.unsplash.com/photo-1555854817-5b2260d50c47?auto=format&fit=crop&q=80&w=800'],
    bedrooms: 4,
    bathrooms: 2,
    type: 'Shared Room',
    ownerId: 'owner3',
    features: ['Students OK', 'WiFi', 'Gas Connection'],
    nearbyAmenities: ['East West University', 'NSU/IUB (Bus 5 mins)', 'Haatirjheel']
  },
  {
    id: '4',
    title: 'Heritage Apartment in Lalbagh',
    description: 'Experience the soul of Old Dhaka. Traditional vibes with modern amenities inside. Near Lalbagh Fort.',
    price: 18000,
    location: 'Lalbagh Road, Puran Dhaka',
    city: 'Dhaka',
    area: 'Lalbagh',
    bachelorFriendly: true,
    verified: true,
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800'],
    bedrooms: 2,
    bathrooms: 1,
    type: 'Apartment',
    ownerId: 'owner4',
    features: ['Traditional Decor', 'Rooftop Access', 'Market Access'],
    nearbyAmenities: ['Lalbagh Fort', 'Dhakeshwari Temple', 'Chawkbazar', 'Dhaka Medical']
  }
];
