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
    { id: 0, name: "GO", type: 'start' },
    { id: 1, name: "Old Kent Road", type: 'property', price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'brown', houseCost: 50, mortgageValue: 30 },
    { id: 2, name: "Community Chest", type: 'action' },
    { id: 3, name: "Whitechapel Road", type: 'property', price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'brown', houseCost: 50, mortgageValue: 30 },
    { id: 4, name: "Income Tax", type: 'tax', price: 200 },
    { id: 5, name: "Kings Cross Station", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 6, name: "The Angel Islington", type: 'property', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue', houseCost: 50, mortgageValue: 50 },
    { id: 7, name: "Chance", type: 'action' },
    { id: 8, name: "Euston Road", type: 'property', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue', houseCost: 50, mortgageValue: 50 },
    { id: 9, name: "Pentonville Road", type: 'property', price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'lightblue', houseCost: 50, mortgageValue: 60 },
    { id: 10, name: "Jail", type: 'jail' },
    { id: 11, name: "Pall Mall", type: 'property', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink', houseCost: 100, mortgageValue: 70 },
    { id: 12, name: "Electric Company", type: 'utility', price: 150, group: 'utility', mortgageValue: 75 },
    { id: 13, name: "Whitehall", type: 'property', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink', houseCost: 100, mortgageValue: 70 },
    { id: 14, name: "Northumberland Avenue", type: 'property', price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'pink', houseCost: 100, mortgageValue: 80 },
    { id: 15, name: "Marylebone Station", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 16, name: "Bow Street", type: 'property', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange', houseCost: 100, mortgageValue: 90 },
    { id: 17, name: "Community Chest", type: 'action' },
    { id: 18, name: "Marlborough Street", type: 'property', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange', houseCost: 100, mortgageValue: 90 },
    { id: 19, name: "Vine Street", type: 'property', price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'orange', houseCost: 100, mortgageValue: 100 },
    { id: 20, name: "Free Parking", type: 'parking' },
    { id: 21, name: "Strand", type: 'property', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red', houseCost: 150, mortgageValue: 110 },
    { id: 22, name: "Chance", type: 'action' },
    { id: 23, name: "Fleet Street", type: 'property', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red', houseCost: 150, mortgageValue: 110 },
    { id: 24, name: "Trafalgar Square", type: 'property', price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'red', houseCost: 150, mortgageValue: 120 },
    { id: 25, name: "Fenchurch St. Station", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 26, name: "Leicester Square", type: 'property', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow', houseCost: 150, mortgageValue: 130 },
    { id: 27, name: "Coventry Street", type: 'property', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow', houseCost: 150, mortgageValue: 130 },
    { id: 28, name: "Water Works", type: 'utility', price: 150, group: 'utility', mortgageValue: 75 },
    { id: 29, name: "Piccadilly", type: 'property', price: 280, rent: [24, 120, 360, 850, 1025, 1200], group: 'yellow', houseCost: 150, mortgageValue: 140 },
    { id: 30, name: "Go To Jail", type: 'gotojail' },
    { id: 31, name: "Regent Street", type: 'property', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green', houseCost: 200, mortgageValue: 150 },
    { id: 32, name: "Oxford Street", type: 'property', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green', houseCost: 200, mortgageValue: 150 },
    { id: 33, name: "Community Chest", type: 'action' },
    { id: 34, name: "Bond Street", type: 'property', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'green', houseCost: 200, mortgageValue: 160 },
    { id: 35, name: "Liverpool St. Station", type: 'railroad', price: 200, rent: [25, 50, 100, 200], group: 'railroad', mortgageValue: 100 },
    { id: 36, name: "Chance", type: 'action' },
    { id: 37, name: "Park Lane", type: 'property', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'darkblue', houseCost: 200, mortgageValue: 175 },
    { id: 38, name: "Super Tax", type: 'tax', price: 100 },
    { id: 39, name: "Mayfair", type: 'property', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'darkblue', houseCost: 200, mortgageValue: 200 }
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
    { text: "Advance to GO (Collect £200)", action: 'move', value: 0 },
    { text: "Advance to Trafalgar Square", action: 'move', value: 24 },
    { text: "Advance to Pall Mall", action: 'move', value: 11 },
    { text: "Bank pays you dividend of £50", action: 'money', value: 50 },
    { text: "Go to Jail", action: 'jail' },
    { text: "Speeding fine £15", action: 'money', value: -15 },
    { text: "Go back 3 spaces", action: 'move', value: -3 }, // Special handling needed for relative move
    { text: "You have been elected Chairman of the Board. Pay each player £50", action: 'money', value: -50 }, // Logic for paying players? Or just simple money deduction.
    { text: "Your building loan matures. Collect £150", action: 'money', value: 150 }
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
    { text: "Advance to GO (Collect £200)", action: 'move', value: 0 },
    { text: "Bank error in your favour. Collect £200", action: 'money', value: 200 },
    { text: "Doctor's fees. Pay £50", action: 'money', value: -50 },
    { text: "From sale of stock you get £50", action: 'money', value: 50 },
    { text: "Go to Jail", action: 'jail' },
    { text: "Holiday Fund matures. Receive £100", action: 'money', value: 100 },
    { text: "Income tax refund. Collect £20", action: 'money', value: 20 },
    { text: "It is your birthday. Collect £10 from every player", action: 'money', value: 10 }, // Logic needed
    { text: "Life insurance matures. Collect £100", action: 'money', value: 100 },
    { text: "Pay hospital fees of £100", action: 'money', value: -100 },
    { text: "Pay school fees of £50", action: 'money', value: -50 },
    { text: "Receive £25 consultancy fee", action: 'money', value: 25 },
    { text: "You have won second prize in a beauty contest. Collect £10", action: 'money', value: 10 },
    { text: "You inherit £100", action: 'money', value: 100 }
];
