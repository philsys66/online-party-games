"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEWSFLASH_EVENTS = exports.OLIGARCHY_BOARD = exports.SECTORS = void 0;
exports.SECTORS = {
    retail: { name: 'Retail', shortName: 'RET', color: '#ff9f43', range: '0-5' }, // Orange
    energy: { name: 'Energy', shortName: 'NRG', color: '#10ac84', range: '6-11' }, // Toxic Green
    healthcare: { name: 'Healthcare', shortName: 'HLT', color: '#ff6b6b', range: '12-17' }, // Red/Pink
    financial: { name: 'Financial', shortName: 'FIN', color: '#feca57', range: '18-23' }, // Gold
    communications: { name: 'Communications', shortName: 'COM', color: '#54a0ff', range: '24-29' }, // Blue
    technology: { name: 'Technology', shortName: 'TEC', color: '#00d2d3', range: '30-35' } // Cyan/Electric Blue
};
exports.OLIGARCHY_BOARD = [
    // Retail ($60 - $110)
    { id: 0, name: "MegaMart", sector: 'retail', value: 60, baseRent: 6 },
    { id: 1, name: "Zara", sector: 'retail', value: 70, baseRent: 7 },
    { id: 2, name: "McD's", sector: 'retail', value: 80, baseRent: 8 },
    { id: 3, name: "Steam", sector: 'retail', value: 90, baseRent: 9 },
    { id: 4, name: "Costa", sector: 'retail', value: 100, baseRent: 10 },
    { id: 5, name: "Target", sector: 'retail', value: 110, baseRent: 11 },
    // Energy ($120 - $170)
    { id: 6, name: "Solar", sector: 'energy', value: 120, baseRent: 12 },
    { id: 7, name: "BP", sector: 'energy', value: 130, baseRent: 13 },
    { id: 8, name: "Shell", sector: 'energy', value: 140, baseRent: 14 },
    { id: 9, name: "Exxon", sector: 'energy', value: 150, baseRent: 15 },
    { id: 10, name: "Tesla", sector: 'energy', value: 160, baseRent: 16 },
    { id: 11, name: "NukeCo", sector: 'energy', value: 170, baseRent: 17 },
    // Healthcare ($180 - $230)
    { id: 12, name: "Pfizer", sector: 'healthcare', value: 180, baseRent: 18 },
    { id: 13, name: "CVS", sector: 'healthcare', value: 190, baseRent: 19 },
    { id: 14, name: "UHealth", sector: 'healthcare', value: 200, baseRent: 20 },
    { id: 15, name: "Moderna", sector: 'healthcare', value: 210, baseRent: 21 },
    { id: 16, name: "J&J", sector: 'healthcare', value: 220, baseRent: 22 },
    { id: 17, name: "BioGen", sector: 'healthcare', value: 230, baseRent: 23 },
    // Financial ($240 - $290)
    { id: 18, name: "Visa", sector: 'financial', value: 240, baseRent: 24 },
    { id: 19, name: "Amex", sector: 'financial', value: 250, baseRent: 25 },
    { id: 20, name: "Goldman", sector: 'financial', value: 260, baseRent: 26 },
    { id: 21, name: "JPM", sector: 'financial', value: 270, baseRent: 27 },
    { id: 22, name: "BlkRock", sector: 'financial', value: 280, baseRent: 28 },
    { id: 23, name: "Crypto", sector: 'financial', value: 290, baseRent: 29 },
    // Communications ($300 - $350)
    { id: 24, name: "AT&T", sector: 'communications', value: 300, baseRent: 30 },
    { id: 25, name: "Verizon", sector: 'communications', value: 310, baseRent: 31 },
    { id: 26, name: "T-Mobile", sector: 'communications', value: 320, baseRent: 32 },
    { id: 27, name: "Comcast", sector: 'communications', value: 330, baseRent: 33 },
    { id: 28, name: "Disney", sector: 'communications', value: 340, baseRent: 34 },
    { id: 29, name: "Starlink", sector: 'communications', value: 350, baseRent: 35 },
    // Technology ($360 - $400)
    { id: 30, name: "Intel", sector: 'technology', value: 360, baseRent: 36 },
    { id: 31, name: "Oracle", sector: 'technology', value: 370, baseRent: 37 },
    { id: 32, name: "Meta", sector: 'technology', value: 380, baseRent: 38 },
    { id: 33, name: "Google", sector: 'technology', value: 380, baseRent: 38 },
    { id: 34, name: "Apple", sector: 'technology', value: 390, baseRent: 39 },
    { id: 35, name: "Nvidia", sector: 'technology', value: 400, baseRent: 40 },
];
exports.NEWSFLASH_EVENTS = [
    {
        title: "Data Breach Scandal!",
        description: "Communications sector crashed. Value -30%.",
        type: 'crash',
        sectors: ['communications'],
        valueChange: 0.7
    },
    {
        title: "Global Energy Crisis!",
        description: "Energy rents +50%. Retail rents -10%.",
        type: 'crisis',
        sectors: ['energy', 'retail'],
        valueChange: 1.5 // Simplified: Energy booms, logic can handle split if needed but keeping simple for now
    },
    {
        title: "AI Revolution",
        description: "Technology shares surge +40%. Dividends paid to owners.",
        type: 'boom',
        sectors: ['technology'],
        valueChange: 1.4,
        cashEffect: 50 // $50M per share dividend
    },
    {
        title: "Pandemic Warning",
        description: "Healthcare profits up 20%.",
        type: 'shift',
        sectors: ['healthcare'],
        valueChange: 1.2
    },
    {
        title: "Interest Rate Hike",
        description: "Financial sector booming +25%. Loans expensive.",
        type: 'shift',
        sectors: ['financial'],
        valueChange: 1.25
    },
    {
        title: "Supply Chain Collapse",
        description: "Retail and Tech hit hard (-20%). Pay maintenance costs.",
        type: 'crash',
        sectors: ['retail', 'technology'],
        valueChange: 0.8,
        cashEffect: -30 // Pay $30M per share
    }
];
