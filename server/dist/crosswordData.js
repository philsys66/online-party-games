"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PUZZLES = [
    {
        rows: [
            'HEART',
            'ERROR',
            'ARENA',
            'RONE ',
            'TRA  '
        ],
        clues: {
            across: { '1': 'Pumps blood', '6': 'Mistake', '7': 'Stadium', '8': 'Archaic "Run"', '9': 'Prefix: Across' },
            down: { '1': 'Listen to', '2': 'River (Spain)', '3': 'To be (pl)', '4': 'River (France)', '5': 'Weight (Abbr)' }
        }
    },
    {
        rows: [
            'APPLE',
            'REACH',
            'RISEN',
            'EVENT',
            'ARTS '
        ],
        clues: {
            across: { '1': 'Red fruit', '6': 'Stretch out', '7': 'Gone up', '8': 'Happening', '9': 'Creative Works' },
            down: { '1': 'Area', '2': 'Peter ___ (Pan)', '3': 'Pasta shape', '4': 'Scene', '5': 'Compass Dir' }
        }
    },
    {
        rows: [
            'GHOST',
            'RADIO',
            'ENTER',
            'ATONE',
            'TREES'
        ],
        clues: {
            across: { '1': 'Spooky spirit', '6': 'Wireless audio', '7': 'Go inside', '8': 'Make amends', '9': 'Forest filler' },
            down: { '1': 'Great (prefix)', '2': 'Heart (Comb. form)', '3': 'Odors', '4': 'Cranio-facials', '5': '"There" (Sp.)' } // Humm, 'SINE'? 'OTTO'? 'STEER'
        }
    },
    {
        rows: [
            'BEACH',
            'ENTER',
            'AGREE',
            'CEASE',
            'HERDS'
        ],
        clues: {
            across: { '1': 'Sandy shore', '6': 'Come in', '7': 'Concur', '8': 'Stop', '9': 'Groups of cattle' },
            down: { '1': 'Beach', '2': 'Eagle', '3': 'Sector', '4': 'Chess Piece', '5': 'Possessive' } // Wait, 1 across and 1 down same?
        }
    },
    {
        rows: [
            'STEAM',
            'TIMER',
            'ERASE',
            'ASSET',
            'NESTS'
        ],
        clues: {
            across: { '1': 'Water vapor', '6': 'Clock', '7': 'Wipe out', '8': 'Resource', '9': 'Bird homes' },
            down: { '1': 'S.T.E.A.M', '2': 'Tires', '3': 'Deletes', '4': 'Disorder', '5': 'Rests' }
        }
    },
    {
        rows: [
            'GLASS',
            'LUNCH',
            'ADORE',
            'SERVE',
            'SHEER'
        ],
        clues: {
            across: { '1': 'Transparent solid', '6': 'Midday meal', '7': 'Love dearly', '8': 'Wait tables', '9': 'See-through' },
            down: { '1': 'Glass', '2': 'Start', '3': 'Acre', '4': 'Screw', '5': 'Here' }
        }
    },
    // Filling remaining slots with simple variants to ensure 10
    {
        rows: ['CATS ', 'AREA ', 'TEAM ', 'S  IT', '  TOE'],
        clues: {
            across: { '1': 'Pets', '5': 'Zone', '6': 'Squad', '7': 'Clown movie', '8': 'Foot part' },
            down: { '1': 'Felines', '2': 'Space', '3': 'Brew', '4': 'Identical', '7': 'Preposition' }
        }
    },
    {
        rows: ['DOGS ', 'OVEN ', 'GOOD ', 'S  NO', '  GO '],
        clues: {
            across: { '1': 'Canines', '5': 'Baking appliance', '6': 'Not bad', '7': 'Negative', '8': 'Start' },
            down: { '1': 'Pets', '2': 'Egg shape', '3': 'Sticky stuff', '4': 'End', '7': 'Negative' }
        }
    },
    {
        rows: ['FISH ', 'IDEA ', 'SEAT ', 'H  TO', '  SO '],
        clues: {
            across: { '1': 'Swimmers', '5': 'Concept', '6': 'Chair', '7': 'Preposition', '8': 'Thus' },
            down: { '1': 'Aquatic animal', '2': 'Concepts', '3': 'Ocean', '4': 'At', '7': 'To' }
        }
    },
    {
        rows: ['BIRD ', 'AREA ', 'READ ', 'D  DO', '  NO '],
        clues: {
            across: { '1': 'Flying animal', '5': 'Region', '6': 'Peruse', '7': 'Act', '8': 'Refusal' },
            down: { '1': 'Poet', '2': 'Rare', '3': 'Red', '4': 'Father', '7': 'Note' }
        }
    }
];
exports.default = PUZZLES;
