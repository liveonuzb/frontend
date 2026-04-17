// Barcode → food mapping for mock barcode scanning
export const FOOD_DATABASE = {
    "4870200340116": { name: "Coca-Cola 0.5L", emoji: "🥤", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop", cal: 210, protein: 0, carbs: 53, fat: 0, brand: "Coca-Cola", category: "Ichimliklar", unit: "ml", step: 50, defaultAmount: 100 },
    "4870200340123": { name: "Fanta 0.5L", emoji: "🍊", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop", cal: 220, protein: 0, carbs: 56, fat: 0, brand: "Coca-Cola", category: "Ichimliklar", unit: "ml", step: 50, defaultAmount: 100 },
    "4870200340130": { name: "Sprite 0.5L", emoji: "🍋", image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop", cal: 200, protein: 0, carbs: 51, fat: 0, brand: "Coca-Cola", category: "Ichimliklar", unit: "ml", step: 50, defaultAmount: 100 },
    "8690504055853": { name: "Ulker Biskuit", emoji: "🍪", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=200&auto=format&fit=crop", cal: 480, protein: 7, carbs: 67, fat: 20, brand: "Ulker", category: "Shirinliklar", unit: "g", step: 10, defaultAmount: 100 },
    "8690504012856": { name: "Ulker Cikolata", emoji: "🍫", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=200&auto=format&fit=crop", cal: 540, protein: 7, carbs: 58, fat: 31, brand: "Ulker", category: "Shirinliklar", unit: "g", step: 10, defaultAmount: 100 },
    "4607025392408": { name: "Nestle Yogurt 200g", emoji: "🥛", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=200&auto=format&fit=crop", cal: 120, protein: 4, carbs: 16, fat: 4, brand: "Nestle", category: "Sut mahsulotlari", unit: "g", step: 10, defaultAmount: 100 },
    "4870200540212": { name: "Nesquik 200ml", emoji: "🥛", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=200&auto=format&fit=crop", cal: 180, protein: 6, carbs: 24, fat: 6, brand: "Nestle", category: "Sut mahsulotlari", unit: "ml", step: 50, defaultAmount: 100 },
    "4870200120019": { name: "Non (mahalliy)", emoji: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=200&auto=format&fit=crop", cal: 275, protein: 8, carbs: 52, fat: 3, brand: "Mahalliy", category: "Un mahsulotlari", unit: "g", step: 10, defaultAmount: 100 },
    "4870200180013": { name: "Guruch 1kg", emoji: "🍚", image: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?q=80&w=200&auto=format&fit=crop", cal: 130, protein: 2.7, carbs: 28, fat: 0.3, brand: "Mahalliy", category: "Don mahsulotlari", unit: "g", step: 10, defaultAmount: 100 },
    "4870200170014": { name: "Tuxum", emoji: "🥚", image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?q=80&w=200&auto=format&fit=crop", cal: 70, protein: 6, carbs: 0.6, fat: 5, brand: "Mahalliy", category: "Sut mahsulotlari", unit: "dona", step: 1, defaultAmount: 1 },
    "4870200190012": { name: "Kartoshka", emoji: "🥔", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=200&auto=format&fit=crop", cal: 77, protein: 2, carbs: 17, fat: 0.1, brand: "Mahalliy", category: "Sabzavotlar", unit: "g", step: 10, defaultAmount: 100 },

    // BAD & Vitamins
    "supplement-omega3": {
        name: "Omega-3 Fish Oil", emoji: "💊", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop", cal: 10, protein: 0, carbs: 0, fat: 1,
        brand: "Solgar", category: "BAD", unit: "kapsula", step: 1, defaultAmount: 1,
        vitamins: { "Omega-3": "1000mg", "EPA": "300mg", "DHA": "200mg" }
    },
    "supplement-multivit": {
        name: "Multivitamin Complex", emoji: "💊", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop", cal: 5, protein: 0, carbs: 1, fat: 0,
        brand: "Optimum Nutrition", category: "Vitaminlar", unit: "dona", step: 1, defaultAmount: 1,
        vitamins: { "Vitamin C": "500mg", "Vitamin D3": "2000IU", "Zinc": "15mg", "Magnesium": "100mg" }
    },
    "supplement-whey": {
        name: "Whey Protein", emoji: "🥤", image: "https://images.unsplash.com/photo-1579722822166-afbcbd1401f8?q=80&w=200&auto=format&fit=crop", cal: 120, protein: 24, carbs: 3, fat: 1.5,
        brand: "MyProtein", category: "BAD", unit: "qoshiq", step: 1, defaultAmount: 1,
        vitamins: { "BCAA": "5g", "Glutamine": "4g" }
    },
    "vitamin-b12": {
        name: "Vitamin B12", emoji: "🧪", image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200&auto=format&fit=crop", cal: 0, protein: 0, carbs: 0, fat: 0,
        brand: "Now Foods", category: "Vitaminlar", unit: "tomchi", step: 1, defaultAmount: 1,
        vitamins: { "B12": "1000mcg" }
    },
};

// Helper to look up food by barcode
export const lookupBarcode = (barcode) => {
    return FOOD_DATABASE[barcode] || null;
};
