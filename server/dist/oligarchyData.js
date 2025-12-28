"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NEWSFLASH_EVENTS = exports.OLIGARCHY_BOARD = exports.SECTORS = void 0;
exports.SECTORS = {
    retail: { name: 'Retail', shortName: 'RET', color: '#ff9f43', range: '0-4' }, // Orange
    energy: { name: 'Energy', shortName: 'NRG', color: '#10ac84', range: '5-9' }, // Toxic Green
    healthcare: { name: 'Healthcare', shortName: 'HLT', color: '#ff6b6b', range: '10-14' }, // Red/Pink
    financial: { name: 'Financial', shortName: 'FIN', color: '#feca57', range: '15-19' }, // Gold
    communications: { name: 'Communications', shortName: 'COM', color: '#54a0ff', range: '20-24' }, // Blue
    technology: { name: 'Technology', shortName: 'TEC', color: '#00d2d3', range: '25-29' } // Cyan/Electric Blue
};
exports.OLIGARCHY_BOARD = [
    // Retail (5) - Removed MegaMart
    { id: 0, name: "Zara", sector: 'retail', value: 70, baseRent: 7 },
    { id: 1, name: "McD's", sector: 'retail', value: 80, baseRent: 8 },
    { id: 2, name: "Steam", sector: 'retail', value: 90, baseRent: 9 },
    { id: 3, name: "Costa", sector: 'retail', value: 100, baseRent: 10 },
    { id: 4, name: "Target", sector: 'retail', value: 110, baseRent: 11 },
    // Energy (5) - Removed NukeCo
    { id: 5, name: "Solar", sector: 'energy', value: 120, baseRent: 12 },
    { id: 6, name: "BP", sector: 'energy', value: 130, baseRent: 13 },
    { id: 7, name: "Shell", sector: 'energy', value: 140, baseRent: 14 },
    { id: 8, name: "Exxon", sector: 'energy', value: 150, baseRent: 15 },
    { id: 9, name: "Tesla", sector: 'energy', value: 160, baseRent: 16 },
    // Healthcare (5) - Removed UHealth (Generic)
    { id: 10, name: "Pfizer", sector: 'healthcare', value: 180, baseRent: 18 },
    { id: 11, name: "CVS", sector: 'healthcare', value: 190, baseRent: 19 },
    { id: 12, name: "Moderna", sector: 'healthcare', value: 210, baseRent: 21 },
    { id: 13, name: "J&J", sector: 'healthcare', value: 220, baseRent: 22 },
    { id: 14, name: "BioGen", sector: 'healthcare', value: 230, baseRent: 23 },
    // Financial (5) - Removed BlkRock
    { id: 15, name: "Visa", sector: 'financial', value: 240, baseRent: 24 },
    { id: 16, name: "Amex", sector: 'financial', value: 250, baseRent: 25 },
    { id: 17, name: "Goldman", sector: 'financial', value: 260, baseRent: 26 },
    { id: 18, name: "JPM", sector: 'financial', value: 270, baseRent: 27 },
    { id: 19, name: "Crypto", sector: 'financial', value: 290, baseRent: 29 },
    // Communications (5) - Removed Starlink
    { id: 20, name: "AT&T", sector: 'communications', value: 300, baseRent: 30 },
    { id: 21, name: "Verizon", sector: 'communications', value: 310, baseRent: 31 },
    { id: 22, name: "T-Mobile", sector: 'communications', value: 320, baseRent: 32 },
    { id: 23, name: "Comcast", sector: 'communications', value: 330, baseRent: 33 },
    { id: 24, name: "Disney", sector: 'communications', value: 340, baseRent: 34 },
    // Technology (5) - Removed Oracle
    { id: 25, name: "Intel", sector: 'technology', value: 360, baseRent: 36 },
    { id: 26, name: "Meta", sector: 'technology', value: 380, baseRent: 38 },
    { id: 27, name: "Google", sector: 'technology', value: 380, baseRent: 38 },
    { id: 28, name: "Apple", sector: 'technology', value: 390, baseRent: 39 },
    { id: 29, name: "Nvidia", sector: 'technology', value: 400, baseRent: 40 },
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
