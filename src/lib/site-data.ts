import { getImageUrl } from "@/lib/media";

export const siteConfig = {
  name: "Ms Ginko",
  shortName: "Ginko",
  description:
    "Ms Ginko is a modern dining experience in Annecy style: seasonal plates, intimate ambience, and curated reservations.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: "+1 (415) 555-0143",
  email: "hello@msginko.com",
  address: "18 Willow Harbor Lane, Downtown District",
  social: {
    instagram: "https://www.instagram.com",
    zomato: "https://www.zomato.com",
    swiggy: "https://www.swiggy.com",
  },
};

export type MenuCategory =
  | "small-plates"
  | "mains"
  | "chef-specials"
  | "desserts"
  | "beverages";

export type MenuItem = {
  id: string;
  name: string;
  category: MenuCategory;
  description: string;
  price: number;
  isVegetarian: boolean;
  isPopular?: boolean;
};

export const menuCategoryLabels: Record<MenuCategory, string> = {
  "small-plates": "Small Plates",
  mains: "Mains",
  "chef-specials": "Chef Specials",
  desserts: "Desserts",
  beverages: "Beverages",
};

export const menuItems: MenuItem[] = [
  {
    id: "sp-charred-broccolini",
    name: "Charred Broccolini",
    category: "small-plates",
    description: "Smoked sesame, lemon salt, crispy shallots.",
    price: 12,
    isVegetarian: true,
  },
  {
    id: "sp-ginko-bruschetta",
    name: "Ginko Bruschetta",
    category: "small-plates",
    description: "Heirloom tomatoes, basil oil, sourdough crunch.",
    price: 11,
    isVegetarian: true,
    isPopular: true,
  },
  {
    id: "mn-truffle-risotto",
    name: "Forest Truffle Risotto",
    category: "mains",
    description: "Arborio rice, parmesan cloud, roasted mushrooms.",
    price: 26,
    isVegetarian: true,
    isPopular: true,
  },
  {
    id: "mn-seared-salmon",
    name: "Seared Citrus Salmon",
    category: "mains",
    description: "Orange glaze, fennel slaw, herb potatoes.",
    price: 29,
    isVegetarian: false,
  },
  {
    id: "cs-firewood-lamb",
    name: "Firewood Lamb Cutlets",
    category: "chef-specials",
    description: "House jus, roasted garlic mash, microgreens.",
    price: 38,
    isVegetarian: false,
    isPopular: true,
  },
  {
    id: "cs-ginko-pasta",
    name: "Ms Ginko Signature Pasta",
    category: "chef-specials",
    description: "Chili butter, basil foam, parmesan shards.",
    price: 31,
    isVegetarian: false,
  },
  {
    id: "ds-vanilla-creme",
    name: "Vanilla Bean Creme Brulee",
    category: "desserts",
    description: "Caramel crack top, candied orange zest.",
    price: 10,
    isVegetarian: true,
  },
  {
    id: "ds-dark-choco",
    name: "Dark Chocolate Mousse",
    category: "desserts",
    description: "70% cacao, berry compote, almond crumble.",
    price: 11,
    isVegetarian: true,
  },
  {
    id: "bv-smoked-negroni",
    name: "Smoked Negroni",
    category: "beverages",
    description: "Classic bitter profile with orange smoke.",
    price: 15,
    isVegetarian: true,
  },
  {
    id: "bv-cold-brew-tonic",
    name: "Cold Brew Tonic",
    category: "beverages",
    description: "Single origin cold brew, tonic, citrus peel.",
    price: 8,
    isVegetarian: true,
  },
];

const galleryItemSources = [
  {
    id: "gallery-1",
    title: "Dining Hall",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    alt: "Warmly lit fine-dining interior",
  },
  {
    id: "gallery-2",
    title: "Signature Dish",
    image:
      "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1600&q=80",
    alt: "Chef plated gourmet dish",
  },
  {
    id: "gallery-3",
    title: "Chef Counter",
    image:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1600&q=80",
    alt: "Chef preparing meals in open kitchen",
  },
  {
    id: "gallery-4",
    title: "Evening Service",
    image:
      "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=1600&q=80",
    alt: "Restaurant tables during dinner hours",
  },
  {
    id: "gallery-5",
    title: "Dessert Course",
    image:
      "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=1600&q=80",
    alt: "Artisanal dessert plating",
  },
  {
    id: "gallery-6",
    title: "Private Booth",
    image:
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1600&q=80",
    alt: "Cozy booth seating in restaurant",
  },
];

export const galleryItems = galleryItemSources.map((item) => ({
  ...item,
  image: getImageUrl(item.image),
}));

export const testimonials = [
  {
    id: "review-1",
    name: "Aarav Patel",
    quote:
      "One of the most balanced tasting menus I have had in years. Service felt premium but never rigid.",
    rating: 5,
  },
  {
    id: "review-2",
    name: "Lea Martin",
    quote:
      "The signature pasta is worth planning the evening around. Beautiful room and excellent pacing.",
    rating: 5,
  },
  {
    id: "review-3",
    name: "Nina Walker",
    quote:
      "Perfect date-night spot. Staff handled our allergy request with confidence and care.",
    rating: 4,
  },
];
