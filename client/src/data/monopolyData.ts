export type SpaceType = 'property' | 'railroad' | 'utility' | 'action' | 'tax' | 'start' | 'jail' | 'parking' | 'gotojail';

export interface BoardSpace {
    id: number;
    name: string;
    type: SpaceType;
    price?: number;
    rent?: number[]; // [base, 1house, 2houses, 3houses, 4houses, hotel]
    group?: string; // Color group or type (Railroad, Utility)
    houseCost?: number;
    mortgageValue?: number;
}

export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

export const MONOPOLY_BOARD: BoardSpace[] = [
    { id: 0, name: "IPO (GO)", type: 'start' },
    // Bottom Row (0-10): WAS Brown/LightBlue -> NOW Green/DarkBlue (Short Names)
    { id: 1, name: "Stripe", type: 'property', price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'brown', houseCost: 50, mortgageValue: 30 },
    { id: 2, name: "Wikipedia", type: 'action' },
    { id: 3, name: "SpaceX", type: 'property', price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'brown', houseCost: 50, mortgageValue: 30 },
    { id: 4, name: "SEC Fine", type: 'tax', price: 200 },
    { id: 5, name: "AWS Region", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 6, name: "OpenAI", type: 'property', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue', houseCost: 50, mortgageValue: 50 },
    { id: 7, name: "Venture Capitalist", type: 'action' },
    { id: 8, name: "Nvidia", type: 'property', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue', houseCost: 50, mortgageValue: 50 },
    { id: 9, name: "Apple", type: 'property', price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'lightblue', houseCost: 50, mortgageValue: 60 },
    { id: 10, name: "Jail", type: 'jail' },

    // Left Column (11-19): WAS Pink/Orange -> NOW Red/Yellow (Long Names)
    { id: 11, name: "TikTok", type: 'property', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink', houseCost: 100, mortgageValue: 70 },
    { id: 12, name: "Starlink", type: 'utility', price: 150, group: 'utility', mortgageValue: 75 },
    { id: 13, name: "Instagram", type: 'property', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink', houseCost: 100, mortgageValue: 70 },
    { id: 14, name: "YouTube", type: 'property', price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'pink', houseCost: 100, mortgageValue: 80 },
    { id: 15, name: "Google Cloud", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 16, name: "X (Twitter)", type: 'property', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange', houseCost: 100, mortgageValue: 90 },
    { id: 17, name: "Wikipedia", type: 'action' },
    { id: 18, name: "LinkedIn", type: 'property', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange', houseCost: 100, mortgageValue: 90 },
    { id: 19, name: "Discord", type: 'property', price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'orange', houseCost: 100, mortgageValue: 100 },

    // Top Row (20-30): WAS Red/Yellow -> NOW Pink/Orange (Short Names)
    { id: 20, name: "Server Crash (Free Parking)", type: 'parking' },
    { id: 21, name: "Spotify", type: 'property', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red', houseCost: 150, mortgageValue: 110 },
    { id: 22, name: "Venture Capitalist", type: 'action' },
    { id: 23, name: "Netflix", type: 'property', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red', houseCost: 150, mortgageValue: 110 },
    { id: 24, name: "Disney+", type: 'property', price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'red', houseCost: 150, mortgageValue: 120 },
    { id: 25, name: "Azure Region", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 26, name: "Uber", type: 'property', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow', houseCost: 150, mortgageValue: 130 },
    { id: 27, name: "Airbnb", type: 'property', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow', houseCost: 150, mortgageValue: 130 },
    { id: 28, name: "GPU Cluster", type: 'utility', price: 150, group: 'utility', mortgageValue: 75 },
    { id: 29, name: "WeWork", type: 'property', price: 280, rent: [24, 120, 360, 850, 1025, 1200], group: 'yellow', houseCost: 150, mortgageValue: 140 },
    { id: 30, name: "Go To Jail", type: 'gotojail' },

    // Right Column (31-39): WAS Green/DarkBlue -> NOW Brown/LightBlue (Longer Names)
    { id: 31, name: "Substack", type: 'property', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green', houseCost: 200, mortgageValue: 150 },
    { id: 32, name: "Patreon", type: 'property', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green', houseCost: 200, mortgageValue: 150 },
    { id: 33, name: "Wikipedia", type: 'action' },
    { id: 34, name: "Snapchat", type: 'property', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'green', houseCost: 200, mortgageValue: 160 },
    { id: 35, name: "Oracle Cloud", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 36, name: "Venture Capitalist", type: 'action' },
    { id: 37, name: "Pinterest", type: 'property', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'darkblue', houseCost: 200, mortgageValue: 175 },
    { id: 38, name: "GDPR Fine", type: 'tax', price: 100 },
    { id: 39, name: "Reddit", type: 'property', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'darkblue', houseCost: 200, mortgageValue: 200 }
];

export const PROPERTY_GROUPS: Record<string, number[]> = {
    brown: [1, 3],
    lightblue: [6, 8, 9],
    pink: [11, 13, 14],
    orange: [16, 18, 19],
    red: [21, 23, 24],
    yellow: [26, 27, 29],
    green: [31, 32, 34],
    darkblue: [37, 39],
    railroad: [5, 15, 25, 35],
    utility: [12, 28]
};

export interface Card {
    text: string;
    action: 'move' | 'money' | 'jail' | 'repair' | 'move_nearest';
    value?: number; // Amount or position index
    subType?: 'utility' | 'railroad'; // For move_nearest
}

export const CHANCE_CARDS: Card[] = [
    { text: "Advance to IPO (GO) - Collect $200M Funding", action: 'move', value: 0 },
    { text: "Advance to YouTube (Viral Hit!)", action: 'move', value: 24 },
    { text: "Advance to Spotify (Podcast Deal)", action: 'move', value: 11 },
    { text: "Crypto Airdrop! Collect $50M", action: 'money', value: 50 },
    { text: "SEC Investigation! Go to Jail", action: 'jail' },
    { text: "Cloud Server Outage. Pay $15M", action: 'money', value: -15 },
    { text: "Rollback Deployment (Go back 3 spaces)", action: 'move', value: -3 },
    { text: "Host Tech Conference. Pay each player $50M", action: 'money', value: -50 },
    { text: "Series B Funding Secured! Collect $150M", action: 'money', value: 150 }
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
    { text: "Advance to IPO (GO) - Collect $200M", action: 'move', value: 0 },
    { text: "Open Source Grant Received. Collect $200M", action: 'money', value: 200 },
    { text: "Legal Fees for Patent Suit. Pay $50M", action: 'money', value: -50 },
    { text: "Sold your startup shares. Collect $50M", action: 'money', value: 50 },
    { text: "Insider Trading Caught! Go to Jail", action: 'jail' },
    { text: "Exit Strategy executed. Receive $100M", action: 'money', value: 100 },
    { text: "Tax Refund. Collect $20M", action: 'money', value: 20 },
    { text: "It is your birthday. Collect $10M from every player", action: 'money', value: 10 },
    { text: "Life Insurance Matures. Collect $100M", action: 'money', value: 100 },
    { text: "Pay Ransomware Hackers $100M", action: 'money', value: -100 },
    { text: "Pay Coding Bootcamp fees $50M", action: 'money', value: -50 },
    { text: "Receive $25M Consultancy Fee", action: 'money', value: 25 },
    { text: "Won a Hackathon! Collect $10M", action: 'money', value: 10 },
    { text: "Inherited Bitcoin Wallet. Collect $100M", action: 'money', value: 100 }
];
