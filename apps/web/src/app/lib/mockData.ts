// Mock data for Ghost Companion Collections

export interface GhostPost {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  vimeoId: string;
  tags: string[];
  year: string;
  client?: string;
  category?: string;
  description: string;
  stills: string[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  intro: string;
  password?: string;
  expiryDate?: string;
  videoIds: string[];
  createdAt: string;
}

// Mock Ghost posts (video case studies)
export const mockGhostPosts: GhostPost[] = [
  {
    id: '1',
    title: 'Midnight Chronicles',
    slug: 'midnight-chronicles',
    thumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Narrative', 'Commercial'],
    year: '2024',
    client: 'Horizon Studios',
    category: 'Brand Film',
    description: 'A cinematic exploration of urban landscapes at the threshold between day and night. This piece combines documentary-style coverage with narrative structure to tell a story of transformation.',
    stills: [
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '2',
    title: 'Elevation',
    slug: 'elevation',
    thumbnail: 'https://images.unsplash.com/photo-1512070679279-8988d32161be?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Documentary', 'Mountain'],
    year: '2024',
    client: 'Alpine Ventures',
    category: 'Documentary',
    description: 'Following climbers as they ascend one of the world\'s most challenging peaks. Shot over 28 days in extreme conditions.',
    stills: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '3',
    title: 'Kinetic Energy',
    slug: 'kinetic-energy',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Music Video', 'Performance'],
    year: '2023',
    client: 'Pulse Records',
    category: 'Music Video',
    description: 'High-energy performance piece combining practical effects with dynamic camera work. All effects achieved in-camera.',
    stills: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '4',
    title: 'Silent Spaces',
    slug: 'silent-spaces',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Architecture', 'Minimal'],
    year: '2023',
    client: 'Form Studio',
    category: 'Architecture',
    description: 'An exploration of minimalist architecture through carefully composed frames and natural light.',
    stills: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '5',
    title: 'Ocean Current',
    slug: 'ocean-current',
    thumbnail: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Nature', 'Environmental'],
    year: '2024',
    client: 'Blue Planet Foundation',
    category: 'Documentary',
    description: 'Documenting the impact of ocean currents on marine ecosystems. Shot in 4K using specialized underwater equipment.',
    stills: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '6',
    title: 'Urban Pulse',
    slug: 'urban-pulse',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Timelapse', 'Urban'],
    year: '2023',
    client: 'Metro Design',
    category: 'Commercial',
    description: 'Capturing the rhythm of city life through time-lapse photography and hyper-lapse sequences.',
    stills: [
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '7',
    title: 'Solstice',
    slug: 'solstice',
    thumbnail: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Narrative', 'Atmospheric'],
    year: '2024',
    client: 'Independent',
    category: 'Short Film',
    description: 'A meditation on light and darkness set during the summer solstice in the northern hemisphere.',
    stills: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '8',
    title: 'Mechanical Dreams',
    slug: 'mechanical-dreams',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Technology', 'Abstract'],
    year: '2023',
    client: 'Tech Innovations',
    category: 'Commercial',
    description: 'Abstract visualization of technological advancement through macro photography and motion control.',
    stills: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=1600&h=900&fit=crop',
    ],
  },
  {
    id: '9',
    title: 'Desert Light',
    slug: 'desert-light',
    thumbnail: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&h=675&fit=crop',
    vimeoId: '76979871',
    tags: ['Landscape', 'Natural'],
    year: '2024',
    client: 'Wild Horizons',
    category: 'Documentary',
    description: 'Exploring the stark beauty and extreme conditions of desert environments across three continents.',
    stills: [
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1600&h=900&fit=crop',
      'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=1600&h=900&fit=crop',
    ],
  },
];

// Mock collections
export const mockCollections: Collection[] = [
  {
    id: 'c1',
    name: 'Q1 2024 Highlights',
    slug: 'q1-2024',
    intro: 'A curated selection of our most impactful work from the first quarter. From brand films to documentary features, this collection showcases our range and creative approach.',
    videoIds: ['1', '2', '5', '7'],
    createdAt: '2024-01-15',
  },
  {
    id: 'c2',
    name: 'Horizon Studios Collection',
    slug: 'horizon-studios',
    intro: 'Complete campaign work for Horizon Studios, including the award-winning Midnight Chronicles series.',
    password: 'preview',
    videoIds: ['1', '3'],
    createdAt: '2024-02-10',
  },
  {
    id: 'c3',
    name: 'Documentary Showcase',
    slug: 'documentary-showcase',
    intro: 'Long-form documentary work capturing stories from around the world.',
    videoIds: ['2', '5', '9'],
    createdAt: '2023-12-01',
  },
];
