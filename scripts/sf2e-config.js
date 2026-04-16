/**
 * Configurações e Constantes para Starfinder 2e
 * Baseado no Archive of Nethys (SF2e Playtest)
 */

export const RPG_AWESOME_ICONS = {
    // --- COMBATE ---
    'strike': 'ra ra-fist-raised',
    'disarm': 'ra ra-broken-shield',
    'grapple': 'ra ra-muscle-up',
    'force-open': 'ra ra-double-team',
    'shove': 'ra ra-falling',
    'trip': 'ra ra-bottom-right',
    'reposition': 'ra ra-player-teleport',
    'feint': 'ra ra-player-dodge',
    'escape': 'ra ra-feathered-wing',
    'area-fire': 'ra ra-small-fire',
    'auto-fire': 'ra ra-bullets',
    'aid': 'ra ra-clover',
    'reactive-strike': 'ra ra-broadsword',
    'steal': 'ra ra-hood',
    'conceal-an-object': 'ra ra-uncertainty',
    'palm-an-object': 'ra ra-hood',
    'point-out': 'ra ra-plain-dagger',
    'arrest-a-fall': 'ra ra-bird-claw',
    'grab-an-edge': 'ra ra-hand-emblem',

    // --- MOVIMENTAÇÃO ---
    'stride': 'ra ra-shoe-prints',
    'step': 'ra ra-player',
    'stand': 'ra ra-aura',
    'leap': 'ra ra-cat',
    'crawl': 'ra ra-snail',
    'fly': 'ra ra-feathered-wing',
    'burrow': 'ra ra-shovel',
    'mount': 'ra ra-horseshoe',
    'drop-prone': 'ra ra-player-pain',
    'push-off': 'ra ra-shoe-prints',

    // --- DEFESA & SUPORTE ---
    'seek': 'ra ra-eye-monster',
    'sense-motive': 'ra ra-eye-monster',
    'interact': 'ra ra-speech-bubble',
    'take-cover': 'ra ra-vest',
    'raise-a-shield': 'ra ra-shield',
    'avert-gaze': 'ra ra-bleeding-eye',
    'ready': 'ra ra-hourglass',
    'delay': 'ra ra-hourglass',
    'release': 'ra ra-hand',
    'dismiss': 'ra ra-cycle',
    'sustain': 'ra ra-tower',
    'sustain-a-spell': 'ra ra-clockwise-rotation',
    'sustain-an-effect': 'ra ra-tower',

    // --- PERÍCIAS & GERAL ---
    'balance': 'ra ra-player',
    'tumble-through': 'ra ra-player-pain',
    'maneuver-in-flight': 'ra ra-bird-claw',
    'squeeze': 'ra ra-player-pain',
    'climb': 'ra ra-player-lift',
    'high-jump': 'ra ra-boot-stomp',
    'long-jump': 'ra ra-player-thunder-struck',
    'swim': 'ra ra-anchor',
    'lie': 'ra ra-fox',
    'request': 'ra ra-hand',
    'recall-knowledge': 'ra ra-book',
    'disable-a-device': 'ra ra-gear-hammer',
    'demoralize': 'ra ra-monster-skull',
    'administer-first-aid': 'ra ra-medical-pack',
    'treat-poison': 'ra ra-poison-cloud',
    'treat-wounds': 'ra ra-health',
    'treat-disease': 'ra ra-pill',
    'command-an-animal': 'ra ra-pawprint',
    'perform': 'ra ra-horn-call',
    'hide': 'ra ra-uncertainty',
    'sneak': 'ra ra-shoe-prints',
    'retch': 'ra ra-player-pain',
    'pick-a-lock': 'ra ra-key',
    'search': 'ra ra-eye-monster',
    'scout': 'ra ra-eye-monster',
    'avoid-notice': 'ra ra-player-pyromaniac',
    'investigate': 'ra ra-surveillance-camera',
    'follow-the-expert': 'ra ra-archery-target',
    'identify-magic': 'ra ra-crystal-ball',
    'learn-a-spell': 'ra ra-crystal-wand',
    'decipher-writing': 'ra ra-scroll-unfurled',
    'repair': 'ra ra-gear-hammer',
    'earn-income': 'ra ra-gem',
    'subsist': 'ra ra-coffee-mug',
    'create-forgery': 'ra ra-forging',
    'navigate': 'ra ra-compass',
    'sense-direction': 'ra ra-compass',
    'cover-tracks': 'ra ra-shoe-prints',
    'track': 'ra ra-shoe-prints',
    'gather-information': 'ra ra-speech-bubble',
    'make-an-impression': 'ra ra-crown',
    'coerce': 'ra ra-monster-skull',
    'impersonate': 'ra ra-hood',
    'detect-magic': 'ra ra-crystal-ball',

    // --- TECNOLOGIA & VEÍCULOS (SF2E Specialty) ---
    'drive': 'ra ra-compass',
    'stop': 'ra ra-interdiction',
    'stunt': 'ra ra-ship-emblem',
    'take-control': 'ra ra-hand',
    'run-over': 'ra ra-player-teleport',
    'hack': 'ra ra-nuclear',
    'access-infosphere': 'ra ra-cog',
    'operate-device': 'ra ra-gear-hammer',
    'livestream': 'ra ra-broadcast',
    'recharge': 'ra ra-bolt',
    'plot-course': 'ra ra-satellite',
};

export const MANUAL_ACTIONS = {
    encounter: {
        skill_combat: [
            {
                slug: 'treat-poison',
                nameKey: 'PF2E.Actions.TreatPoison.Title',
                nameFallback: 'Treat Poison',
                descKey: "Attempt a Medicine check against the poison's DC. <br><b>Success</b> The creature gains a +2 circumstance bonus to its next saving throw against that poison.",
                traits: ['manipulate', 'medicine'],
                cost: '1'
            },
            {
                slug: 'retch',
                nameKey: 'PF2E.Actions.Retch.Title',
                nameFallback: 'Retch',
                descKey: "Attempt a Fortitude save to reduce sickened value.",
                traits: ['concentrate'],
                cost: '1'
            },
            {
                slug: 'administer-first-aid',
                nameKey: 'PF2E.Actions.AdministerFirstAid.Title',
                nameFallback: 'Administer First Aid',
                descKey: 'Stabilize a dying creature or stop bleeding.',
                traits: ['manipulate', 'medicine'],
                cost: '2'
            },
        ]
    },
    exploration: [
        {
            slug: 'treat-wounds',
            nameKey: 'PF2E.Actions.TreatWounds.Title',
            nameFallback: 'Treat Wounds',
            descKey: "You spend 10 minutes treating an injured living creature. <br><b>Critical Success</b> The target regains 4d8 HP and loses Wounded.<br><b>Success</b> The target regains 2d8 HP and loses Wounded.",
            traits: ['exploration', 'healing', 'manipulate', 'medicine'],
            cost: '2'
        },
        {
            slug: 'investigate',
            nameKey: 'PF2E.Actions.Investigate.Title',
            nameFallback: 'Investigate',
            descKey: "You seek out information and clues while exploring.",
            traits: ['exploration', 'concentrate'],
            cost: '1'
        },
        {
            slug: 'follow-the-expert',
            nameKey: 'PF2E.Actions.FollowTheExpert.Title',
            nameFallback: 'Follow the Expert',
            descKey: "Gain a bonus to skill checks by following an expert ally.",
            traits: ['exploration'],
            cost: '1'
        },
        {
            slug: 'access-infosphere',
            nameFallback: 'Access Infosphere',
            descKey: "You spend time searching the galactic digital network for information.",
            traits: ['exploration', 'digital'],
            cost: '1'
        }
    ],
    downtime: [
        {
            slug: 'craft',
            nameKey: 'PF2E.Actions.Craft.Title',
            nameFallback: 'Craft',
            descKey: "Create items using technology or magic.",
            traits: ['downtime', 'manipulate'],
            cost: 'D'
        },
        {
            slug: 'earn-income',
            nameKey: 'PF2E.Actions.EarnIncome.Title',
            nameFallback: 'Earn Income',
            descKey: "Use a skill to earn money during downtime.",
            traits: ['downtime'],
            cost: 'D'
        },
        {
            slug: 'treat-disease',
            nameKey: 'PF2E.Actions.TreatDisease.Title',
            nameFallback: 'Treat Disease',
            descKey: "Spend 8 hours treating a diseased creature.",
            traits: ['downtime', 'manipulate', 'medicine'],
            cost: 'D'
        }
    ]
};

export const ACTION_BUCKETS = {
    slugsAttack: [
        'strike', 'escape', 'disarm', 'grapple', 'shove', 'trip',
        'reposition', 'feint', 'area-fire', 'auto-fire', 'steal', 'reactive-strike', 'force-open'
    ],
    slugsMovement: [
        'stride', 'step', 'stand', 'crawl', 'leap', 'drop-prone', 'fly', 'burrow'
    ],
    slugsInteractPercept: [
        'interact', 'seek', 'sense-motive', 'point-out'
    ],
    slugsDefenseSupport: [
        'take-cover', 'raise-a-shield', 'avert-gaze', 'ready', 'aid', 'arrest-a-fall', 'grab-an-edge'
    ],
    slugsSpecialty: [
        'mount', 'push-off', 'dismiss', 'sustain', 'recharge', 'operate-device', 'drive', 'stunt', 'take-control'
    ],
    slugsSkillCombat: [
        'balance', 'tumble-through', 'maneuver-in-flight', 'climb', 'high-jump', 'long-jump', 'swim',
        'recall-knowledge', 'create-a-diversion', 'lie', 'request', 'demoralize', 'perform',
        'administer-first-aid', 'treat-poison', 'command-an-animal', 'hide', 'sneak', 'disable-a-device', 'pick-a-lock'
    ],
    slugsExploration: [
        'analyze-environment', 'livestream', 'recharge', 'access-infosphere', 'hack', 'navigate', 'plot-course',
        'avoid-notice', 'scout', 'search', 'detect-magic', 'defend', 'hustle', 'repair', 'impersonate'
    ],
    slugsDowntime: ['craft', 'earn-income', 'subsist', 'create-forgery']
};

export const SKILL_TRAITS = [
    'acrobatics', 'arcana', 'athletics', 'computers', 'crafting', 'deception', 'diplomacy',
    'intimidation', 'medicine', 'nature', 'occultism', 'performance', 'piloting',
    'religion', 'society', 'stealth', 'survival', 'thievery'
];