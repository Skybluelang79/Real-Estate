const neighborhoods = [
  {
    slug: 'malibu',
    name: 'Malibu',
    state: 'CA',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=80',
    tagline: '21 miles of breathtaking coastline and world-class estates',
    description: 'Malibu is the quintessential California coastal enclave — where celebrities, oceanfront villas and dramatic cliffs meet. Homes here command sweeping Pacific views, private beach access and complete seclusion while remaining minutes from the culture of Los Angeles.',
    highlights: ['Private beach access', 'Ocean-view estates', 'Gated communities', 'Surf culture', 'Wine country at Malibu Hills'],
    stats: { avgPrice: '$4.2M', walkScore: 42, transitScore: 24, schools: '9/10' },
    schools: ['Malibu High School', 'Our Lady of Malibu School', 'Point Dume Marine Science School'],
    commute: 'About 45 minutes to Downtown Los Angeles',
    amenities: ['Beaches', 'Hiking trails', 'Fine dining', 'Equinox fitness', 'Private clubs'],
  },
  {
    slug: 'beverly-hills',
    name: 'Beverly Hills',
    state: 'CA',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=80',
    tagline: 'The world\'s most iconic luxury address',
    description: 'Beverly Hills is synonymous with luxury living — tree-lined boulevards, iconic mansions on the flats, and penthouse residences with panoramic city views. Home to Rodeo Drive and some of the most valuable real estate on the planet.',
    highlights: ['Rodeo Drive shopping', 'Architectural landmarks', 'Flat and Trousdale estates', 'Penthouse skyline views', 'Legendary privacy'],
    stats: { avgPrice: '$5.8M', walkScore: 68, transitScore: 40, schools: '10/10' },
    schools: ['Beverly Hills High School', 'Horace Mann School', 'Hawthorne Elementary'],
    commute: 'About 30 minutes to Downtown Los Angeles',
    amenities: ['Rodeo Drive', 'Five-star hotels', 'Michelin dining', 'Cedars-Sinai Medical', 'Beverly Gardens Park'],
  },
  {
    slug: 'santa-monica',
    name: 'Santa Monica',
    state: 'CA',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&q=80',
    tagline: 'Beachfront living with a vibrant urban soul',
    description: 'Santa Monica pairs its legendary pier and beaches with a walkable downtown, farmers markets and a creative energy that is uniquely Westside. From beachfront condos to craftsman bungalows, it offers the best of coastal and urban life.',
    highlights: ['Direct beach access', 'Third Street Promenade', 'Farmers markets', 'Blue-chip public schools', 'Cycling & ocean paths'],
    stats: { avgPrice: '$2.1M', walkScore: 92, transitScore: 61, schools: '9/10' },
    schools: ['Santa Monica High School', 'Franklin Elementary', 'John Adams Middle School'],
    commute: 'About 30 minutes to Downtown Los Angeles',
    amenities: ['The Pier', 'Palisades Park', 'Third Street Promenade', 'Santa Monica Place', 'Annenberg Community Beach House'],
  },
  {
    slug: 'downtown-la',
    name: 'Downtown LA',
    state: 'CA',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1400&q=80',
    tagline: 'Skyline towers, lofts and the new urban epicenter',
    description: 'Downtown Los Angeles is a city within a city — soaring residential towers, converted lofts, arts districts and a booming food scene. Modern penthouses here offer floor-to-ceiling city views and walkability to everything.',
    highlights: ['Skyline penthouses', 'Arts District lofts', 'Metro access', 'Fine dining scene', 'Financial district'],
    stats: { avgPrice: '$980K', walkScore: 88, transitScore: 79, schools: '7/10' },
    schools: ['Downtown High School', 'Fashion Institute', 'Percussion Arts High'],
    commute: 'Walkable & Metro-connected',
    amenities: ['Arts District', 'Grand Park', 'LA Live', 'The Broad museum', 'Crypto.com Arena'],
  },
  {
    slug: 'pasadena',
    name: 'Pasadena',
    state: 'CA',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1400&q=80',
    tagline: 'Historic charm, tree-lined streets and top schools',
    description: 'Pasadena blends historic architecture with a vibrant cultural scene — the Rose Bowl, Old Pasadena and the Huntington Library anchor a community famous for its craftsman bungalows and family-friendly atmosphere.',
    highlights: ['Historic craftsman homes', 'Old Pasadena', 'Top-ranked schools', 'Rose Bowl & parks', 'Cultural institutions'],
    stats: { avgPrice: '$1.3M', walkScore: 70, transitScore: 55, schools: '9/10' },
    schools: ['Marshall Fundamental', 'Polytechnic School', 'Eliot Arts Academy'],
    commute: 'About 25 minutes to Downtown Los Angeles',
    amenities: ['Old Pasadena', 'Rose Bowl', 'Huntington Library', 'Norton Simon Museum', 'Arroyo Seco'],
  },
  {
    slug: 'glendale',
    name: 'Glendale',
    state: 'CA',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80',
    tagline: 'A family favorite with parks, schools and convenience',
    description: 'Glendale offers suburban comfort with urban convenience — sprawling parks, top school districts and some of the region\'s most popular shopping destinations, all a short drive from Downtown LA.',
    highlights: ['Family-friendly streets', 'Excellent school districts', 'The Americana & Galleria', 'Verdugo Mountains', 'Community parks'],
    stats: { avgPrice: '$890K', walkScore: 66, transitScore: 52, schools: '8/10' },
    schools: ['Clark Magnet High School', 'Herbert Hoover High', 'Glendale High School'],
    commute: 'About 20 minutes to Downtown Los Angeles',
    amenities: ['The Americana at Brand', 'Glendale Galleria', 'Brand Park', 'Verdugo Mountains', 'Library Arts & Culture District'],
  },
];

export function getNeighborhood(slug) {
  return neighborhoods.find(n => n.slug === slug) || null;
}

export function neighborhoodForCity(city) {
  if (!city) return null;
  const c = String(city).toLowerCase();
  if (c.includes('malibu')) return neighborhoods.find(n => n.slug === 'malibu');
  if (c.includes('beverly')) return neighborhoods.find(n => n.slug === 'beverly-hills');
  if (c.includes('santa monica')) return neighborhoods.find(n => n.slug === 'santa-monica');
  if (c.includes('los angeles') || c.includes('downtown')) return neighborhoods.find(n => n.slug === 'downtown-la');
  if (c.includes('pasadena')) return neighborhoods.find(n => n.slug === 'pasadena');
  if (c.includes('glendale')) return neighborhoods.find(n => n.slug === 'glendale');
  return null;
}

export default neighborhoods;
