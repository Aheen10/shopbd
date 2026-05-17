const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  // Kitchen Items
  { name: "Non-Stick Frying Pan", description: "24cm, granite coated, heat resistant", price: 850, oldPrice: 1100, category: "kitchen", emoji: "🍳", stock: 80 },
  { name: "Pressure Cooker 5L", description: "Stainless steel, safety valve", price: 2200, oldPrice: 2800, category: "kitchen", emoji: "🫕", stock: 60 },
  { name: "Blender Machine", description: "500W, 3 speed settings, 1.5L jar", price: 1800, oldPrice: 2200, category: "kitchen", emoji: "🥤", stock: 45 },
  { name: "Knife Set 6pcs", description: "Stainless steel, wooden block", price: 1200, category: "kitchen", emoji: "🔪", stock: 100 },
  { name: "Rice Cooker 1.8L", description: "Auto keep warm, non-stick bowl", price: 3200, oldPrice: 3800, category: "kitchen", emoji: "🍚", stock: 70 },
  { name: "Electric Kettle 1.8L", description: "Auto shut-off, boil dry protection", price: 1500, oldPrice: 1800, category: "kitchen", emoji: "🫖", stock: 90 },
  { name: "Chopping Board Set", description: "3 pcs, antibacterial plastic", price: 450, category: "kitchen", emoji: "🪵", stock: 150 },
  { name: "Mixing Bowl Set", description: "5 pcs, stainless steel with lid", price: 980, oldPrice: 1200, category: "kitchen", emoji: "🥣", stock: 85 },

  // Home Decor
  { name: "LED Fairy Lights 10m", description: "Warm white, USB powered", price: 350, category: "home", emoji: "✨", stock: 200 },
  { name: "Wall Clock Modern", description: "Silent movement, 30cm diameter", price: 750, oldPrice: 950, category: "home", emoji: "🕐", stock: 60 },
  { name: "Photo Frame Set 5pcs", description: "Wooden frame, multiple sizes", price: 680, category: "home", emoji: "🖼️", stock: 120 },
  { name: "Scented Candle Set", description: "Lavender and rose, 3 pcs", price: 420, category: "home", emoji: "🕯️", stock: 150 },
  { name: "Decorative Vase", description: "Ceramic, hand painted", price: 890, oldPrice: 1100, category: "home", emoji: "🏺", stock: 40 },
  { name: "Throw Pillow Set 4pcs", description: "Soft velvet, 45x45cm", price: 1200, oldPrice: 1500, category: "home", emoji: "🛋️", stock: 75 },
  { name: "Curtain Set 2pcs", description: "Blackout, 140x260cm", price: 1800, oldPrice: 2200, category: "home", emoji: "🪟", stock: 55 },
  { name: "Door Mat", description: "Anti-slip, 60x40cm, washable", price: 380, category: "home", emoji: "🚪", stock: 180 },

  // Bedroom
  { name: "Bed Sheet Set King", description: "100% cotton, 300 thread count", price: 2500, oldPrice: 3000, category: "bedroom", emoji: "🛏️", stock: 65 },
  { name: "Pillow Pair", description: "Memory foam, neck support", price: 1400, oldPrice: 1800, category: "bedroom", emoji: "😴", stock: 90 },
  { name: "Blanket Winter", description: "Fleece, 200x220cm, super soft", price: 1900, oldPrice: 2400, category: "bedroom", emoji: "🧣", stock: 70 },
  { name: "LED Desk Lamp", description: "Eye protection, USB charging port", price: 850, oldPrice: 1200, category: "bedroom", emoji: "💡", stock: 110 },
  { name: "Wardrobe Organizer", description: "6 shelf, foldable, 150x45x170cm", price: 3500, oldPrice: 4200, category: "bedroom", emoji: "🗄️", stock: 30 },
  { name: "Hangers Set 20pcs", description: "Non-slip, velvet coated", price: 280, category: "bedroom", emoji: "👔", stock: 300 },

  // Bathroom
  { name: "Towel Set 4pcs", description: "100% cotton, quick dry", price: 980, oldPrice: 1200, category: "bathroom", emoji: "🛁", stock: 120 },
  { name: "Shower Curtain", description: "Waterproof PEVA, 180x180cm", price: 650, category: "bathroom", emoji: "🚿", stock: 85 },
  { name: "Soap Dispenser Set", description: "3 pcs, stainless steel", price: 780, oldPrice: 950, category: "bathroom", emoji: "🧴", stock: 95 },
  { name: "Bathroom Organizer", description: "5 tier, wall mounted", price: 1100, oldPrice: 1400, category: "bathroom", emoji: "🪥", stock: 60 },
  { name: "Bath Mat Anti-Slip", description: "Memory foam, 50x80cm", price: 580, category: "bathroom", emoji: "🧼", stock: 140 },

  // Cleaning
  { name: "Vacuum Cleaner 1200W", description: "Bagless, HEPA filter", price: 4500, oldPrice: 5500, category: "cleaning", emoji: "🧹", stock: 35 },
  { name: "Mop Set with Bucket", description: "Spin mop, 360 rotation", price: 1350, oldPrice: 1700, category: "cleaning", emoji: "🪣", stock: 75 },
  { name: "Cleaning Spray Set", description: "Multi-surface, 3 bottles", price: 320, category: "cleaning", emoji: "🧽", stock: 200 },
];

async function main() {
  console.log('Seeding database...');
  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log('✅ Database seeded with 30 products!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());