export interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  type: string;
  status: string;
  yearBuilt: number;
  image: string | null;
  images: string[];
  agent: string;
  agentPhone: string;
  agentEmail: string;
  tags: string;
  featured: boolean;
  badge: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}
