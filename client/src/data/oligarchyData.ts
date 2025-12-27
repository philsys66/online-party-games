export type SectorType = 'retail' | 'energy' | 'healthcare' | 'financial' | 'communications' | 'technology';

export interface OligarchyCompany {
    id: number;
    name: string;
    sector: SectorType;
    value: number; // Purchase Price / Asset Value
    baseRent: number; // 10%
}

export const SECTORS: Record<SectorType, { name: string, color: string, range: string }> = {
    retail: { name: 'Retail', color: '#ff9f43', range: '0-5' },         // Orange
    energy: { name: 'Energy', color: '#10ac84', range: '6-11' },        // Toxic Green
    healthcare: { name: 'Healthcare', color: '#ff6b6b', range: '12-17' }, // Red/Pink
    financial: { name: 'Financial', color: '#feca57', range: '18-23' },   // Gold
    communications: { name: 'Communications', color: '#54a0ff', range: '24-29' }, // Blue
    technology: { name: 'Technology', color: '#00d2d3', range: '30-35' }  // Cyan/Electric Blue
};

export const OLIGARCHY_BOARD: OligarchyCompany[] = [
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
