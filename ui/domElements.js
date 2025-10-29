/**
 * ==================================================================
 * ui/domElements.js
 * (已修改：添加角色面板元素)
 * ==================================================================
 */

export const elements = {
    displays: {},
    progressModalCloseBtn: null,
    exchangeModalCloseBtn: null,
    exchangeModalBody: null,
    dungeon5pList: null,
    dungeon10pList: null,
    dungeon25pList: null,
    // 新增角色面板元素
    characterBtn: null,
    characterModal: null,
    characterModalCloseBtn: null,
    charGearScoreDisplay: null, // 用于角色面板中的装等显示
};

export function initElements() {
    console.log("--- initElements starting ---"); //

    // Find top-level elements and modal containers ONLY
    elements.messageContainer = document.getElementById('messageContainer'); //
    elements.questList = document.getElementById('questList'); //
    elements.dungeon5Btn = document.getElementById('dungeon5Btn'); //
    elements.dungeon10Btn = document.getElementById('dungeon10Btn'); //
    elements.dungeon25Btn = document.getElementById('dungeon25Btn'); //
    elements.viewProgressBtn = document.getElementById('viewProgressBtn'); //
    elements.progressModal = document.getElementById('progressModal'); // Modal container
    elements.exchangeBtn = document.getElementById('exchangeBtn'); //
    elements.exchangeModal = document.getElementById('exchangeModal'); // Modal container
    elements.sceneIndicator = document.getElementById('sceneIndicator'); //
    elements.displays.gearScore = document.getElementById('gearScoreDisplay'); //
    elements.displays.gold = document.getElementById('goldDisplay'); //
    elements.displays.proficiency = document.getElementById('proficiencyDisplay'); //
    elements.displays.atiyehStaffIcon = document.getElementById('atiyehStaffIcon'); //
    elements.dungeonProgressTitle = document.getElementById('dungeonProgressTitle'); //
    elements.bossList = document.getElementById('bossList'); //
    elements.settingsBtn = document.getElementById('settingsBtn'); //
    elements.settingsModal = document.getElementById('settingsModal'); // Modal container
    elements.helpModal = document.getElementById('helpModal');     // Modal container

    // Find elements within ALWAYS VISIBLE modals (settings, help)
    elements.settingsModalCloseBtn = document.getElementById('settingsModalCloseBtn'); //
    elements.gameHelpBtn = document.getElementById('gameHelpBtn'); // Inside settings modal
    elements.helpModalCloseBtn = document.getElementById('helpModalCloseBtn'); //

    // Find save buttons INSIDE settings modal now
    elements.clearSaveBtn = document.getElementById('clearSaveBtn'); //
    elements.exportSaveBtn = document.getElementById('exportSaveBtn'); //
    elements.importSaveBtn = document.getElementById('importSaveBtn'); //

    // 新增角色面板元素查找
    elements.characterBtn = document.getElementById('characterBtn'); //
    elements.characterModal = document.getElementById('characterModal'); //
    elements.characterModalCloseBtn = document.getElementById('characterModalCloseBtn'); //
    elements.charGearScoreDisplay = document.getElementById('charGearScoreDisplay'); //

    console.log("--- initElements finished (top-level only) ---"); //
}