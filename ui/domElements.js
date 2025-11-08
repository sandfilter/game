/**
 * ==================================================================
 * ui/domElements.js
 * (已修改：添加收藏品弹窗元素)
 * (已修正：initElements 现在会查找所有元素，修复 'null' 错误)
 * (已修改：添加 reminderContainer)
 * (已修改：添加 ascendBtn)
 * (已修改：替换 atiyehStaffIcon 为 specialItemsContainer)
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
    characterBtn: null,
    characterModal: null,
    characterModalCloseBtn: null, 
    charGearScoreDisplay: null,
    charProficiencyDisplay: null,
    
    // --- 角色面板详细属性元素 ---
    charGoldDisplay: null,
    charAbyssCrystalDisplay: null,
    charHeroismDisplay: null,
    charValorDisplay: null,
    charConquestDisplay: null,
    charTriumphDisplay: null,
    charFrostDisplay: null,
    charAtiyehsuideDisplay: null,
    charWalanaiersuideDisplay: null,
    charLushichuanshuodesuideDisplay: null,
    charYingzhisuideDisplay: null,
    charShuangzhisuideDisplay: null,
    
    itemTooltip: null,
    characterModalBody: null,

    // --- 收藏品弹窗 ---
    collectiblesBtn: null,
    collectiblesModal: null,
    collectiblesModalCloseBtn: null,
    collectiblesModalBody: null,
    
    // --- (新增) 设置弹窗内部元素 ---
    settingsBtn: null,
    settingsModal: null,
    settingsModalCloseBtn: null,
    helpModal: null,
    gameHelpBtn: null,
    helpModalCloseBtn: null,
    clearSaveBtn: null,
    exportSaveBtn: null,
    importSaveBtn: null,
    ascendBtn: null,

    // --- (新增) 提醒容器 ---
    reminderContainer: null,

    // --- (新增) 特殊物品状态栏容器 ---
    specialItemsContainer: null, 
};

export function initElements() {
    console.log("--- initElements starting ---");

    // Top-level & Modal Containers
    elements.messageContainer = document.getElementById('messageContainer');
    elements.questList = document.getElementById('questList');
    elements.dungeon5Btn = document.getElementById('dungeon5Btn');
    elements.dungeon10Btn = document.getElementById('dungeon10Btn');
    elements.dungeon25Btn = document.getElementById('dungeon25Btn');
    elements.viewProgressBtn = document.getElementById('viewProgressBtn');
    elements.progressModal = document.getElementById('progressModal');
    elements.exchangeBtn = document.getElementById('exchangeBtn');
    elements.exchangeModal = document.getElementById('exchangeModal');
    elements.sceneIndicator = document.getElementById('sceneIndicator');
    elements.displays.gearScore = document.getElementById('gearScoreDisplay');
    elements.displays.gold = document.getElementById('goldDisplay');
    elements.displays.proficiency = document.getElementById('proficiencyDisplay');
    
    // (修改) 移除了 atiyehStaffIcon，添加了 specialItemsContainer
    elements.specialItemsContainer = document.getElementById('specialItemsContainer');

    elements.dungeonProgressTitle = document.getElementById('dungeonProgressTitle');
    elements.bossList = document.getElementById('bossList');
    elements.characterBtn = document.getElementById('characterBtn');
    elements.characterModal = document.getElementById('characterModal');
    elements.collectiblesBtn = document.getElementById('collectiblesBtn');
    elements.collectiblesModal = document.getElementById('collectiblesModal');
    elements.itemTooltip = document.getElementById('itemTooltip');
    
    // (新增) 提醒容器
    elements.reminderContainer = document.getElementById('reminderContainer');

    // --- (修正) 查找所有弹窗内部的元素 ---
    
    // 设置/帮助 弹窗
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.settingsModal = document.getElementById('settingsModal');
    elements.settingsModalCloseBtn = document.getElementById('settingsModalCloseBtn');
    elements.helpModal = document.getElementById('helpModal');
    elements.gameHelpBtn = document.getElementById('gameHelpBtn');
    elements.helpModalCloseBtn = document.getElementById('helpModalCloseBtn');
    elements.clearSaveBtn = document.getElementById('clearSaveBtn');
    elements.exportSaveBtn = document.getElementById('exportSaveBtn');
    elements.importSaveBtn = document.getElementById('importSaveBtn');
    elements.ascendBtn = document.getElementById('ascendBtn'); 

    // 收藏品 弹窗 (内部)
    elements.collectiblesModalCloseBtn = document.getElementById('collectiblesModalCloseBtn'); 
    elements.collectiblesModalBody = document.getElementById('collectiblesModalBody'); 

    // 角色 弹窗 (内部)
    elements.characterModalCloseBtn = document.getElementById('characterModalCloseBtn'); 
    elements.characterModalBody = document.querySelector('#characterModal .character-detailed-layout');
    
    // 进度 弹窗 (内部)
    elements.progressModalCloseBtn = document.getElementById('progressModalCloseBtn');
    elements.dungeon5pList = document.getElementById('dungeon5pList');
    elements.dungeon10pList = document.getElementById('dungeon10pList');
    elements.dungeon25pList = document.getElementById('dungeon25pList');
    
    // 兑换 弹窗 (内部)
    elements.exchangeModalCloseBtn = document.getElementById('exchangeModalCloseBtn');
    elements.exchangeModalBody = document.getElementById('exchangeModalBody');

    // 角色面板详细属性元素查找
    elements.charGearScoreDisplay = document.getElementById('charGearScoreDisplay');
    elements.charProficiencyDisplay = document.getElementById('charProficiencyDisplay');
    elements.charGoldDisplay = document.getElementById('charGoldDisplay');
    
    elements.charAbyssCrystalDisplay = document.getElementById('charAbyssCrystalDisplay');
    elements.charHeroismDisplay = document.getElementById('charHeroismDisplay');
    elements.charValorDisplay = document.getElementById('charValorDisplay');
    elements.charConquestDisplay = document.getElementById('charConquestDisplay');
    elements.charTriumphDisplay = document.getElementById('charTriumphDisplay');
    elements.charFrostDisplay = document.getElementById('charFrostDisplay');
    
    elements.charAtiyehsuideDisplay = document.getElementById('charAtiyehsuideDisplay');
    elements.charWalanaiersuideDisplay = document.getElementById('charWalanaiersuideDisplay');
    elements.charLushichuanshuodesuideDisplay = document.getElementById('charLushichuanshuodesuideDisplay');
    elements.charYingzhisuideDisplay = document.getElementById('charYingzhisuideDisplay');
    elements.charShuangzhisuideDisplay = document.getElementById('charShuangzhisuideDisplay');


    console.log("--- initElements finished (finding ALL elements) ---");
}