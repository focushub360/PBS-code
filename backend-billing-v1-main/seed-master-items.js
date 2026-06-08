const mongoose = require('mongoose');
require('dotenv').config();

// Import the Item model
const Item = require('./models/Item');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/billing-software')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const masterItems = [
  {
    code: 'NECKLES001',
    name: 'NECKLES',
    categories: ['Gold', 'Silver', 'Diamond'],
    carats: ['18K', '20K', '22K', '24K'],
    itemType: 'master'
  },
  {
    code: 'ANKLETS001',
    name: 'Anklets',
    categories: ['Gold', 'Silver'],
    carats: ['18K', '22K', '24K'],
    itemType: 'master'
  },
  {
    code: 'EARRINGS001',
    name: 'Earrings',
    categories: ['Gold', 'Silver', 'Diamond', 'Pearl'],
    carats: ['14K', '18K', '22K'],
    itemType: 'master'
  },
  {
    code: 'BRACELETS001',
    name: 'Bracelets',
    categories: ['Gold', 'Silver', 'Platinum'],
    carats: ['18K', '20K', '22K'],
    itemType: 'master'
  },
  {
    code: 'BANGLES001',
    name: 'Bangles',
    categories: ['Gold', 'Silver'],
    carats: ['22K', '24K'],
    itemType: 'master'
  },
  {
    code: 'CHAIN001',
    name: 'CHAIN',
    categories: ['Gold', 'Silver', 'Platinum'],
    carats: ['18K', '20K', '22K', '24K'],
    itemType: 'master'
  },
  {
    code: 'BABYRING001',
    name: 'BABY RING',
    categories: ['Gold', 'Silver'],
    carats: ['18K', '22K'],
    itemType: 'master'
  }
];

async function seedMasterItems() {
  try {
    // Clear existing master items
    await Item.deleteMany({ itemType: 'master' });
    console.log('Cleared existing master items');

    // Insert new master items
    const result = await Item.insertMany(masterItems);
    console.log(`Successfully inserted ${result.length} master items:`);
    result.forEach(item => {
      console.log(`- ${item.name} (${item.code}): ${item.categories.length} categories, ${item.carats.length} carats`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding master items:', error);
    process.exit(1);
  }
}

seedMasterItems();