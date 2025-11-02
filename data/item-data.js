/**
 * ==================================================================
 * data/item-data.js
 * (已修改：移除了所有 "圣物" (relic) 相关的物品)
 * (已修改：添加橙杖和坐骑)
 * (已修改：合并了重复的戒指和饰品)
 * (已修改：移除了dungeon-data.js未引用的旧物品)
 * ==================================================================
 */

export const ITEM_DATA = {

    // --- (新增) 传说武器 (任务) ---
    "atiyeh_legendary_staff_232": {
        "name": "埃提耶什·守护者的传说之杖",
        "slot": "mainhand", // 装备槽
        "gearScore": 232,
        "rarity": "legendary", // 橙色
        "type": "collectible" // (新增) 标记为收藏品
    },

    // --- (新增) 收藏品 (坐骑) ---
    "mount_twilight_drake": {
        "name": "暮光幼龙的缰绳",
        "slot": "collectible", // (新增) 特殊槽位
        "gearScore": 80,
        "rarity": "epic",
        "type": "collectible"
    },
    "mount_azure_drake": {
        "name": "碧蓝幼龙的缰绳",
        "slot": "collectible",
        "gearScore": 80,
        "rarity": "epic",
        "type": "collectible"
    },

    // --- 新手初始装备 (装备等级 187) ---
    "starter_head": { "name": "新手头盔", "slot": "head", "gearScore": 187, "rarity": "uncommon" },
    "starter_neck": { "name": "新手项链", "slot": "neck", "gearScore": 187, "rarity": "uncommon" },
    "starter_shoulder": { "name": "新手护肩", "slot": "shoulder", "gearScore": 187, "rarity": "uncommon" },
    "starter_back": { "name": "新手披风", "slot": "back", "gearScore": 187, "rarity": "uncommon" },
    "starter_chest": { "name": "新手外衣", "slot": "chest", "gearScore": 187, "rarity": "uncommon" },
    "starter_shirt": { "name": "新手衬衣", "slot": "shirt", "gearScore": 0, "rarity": "common" },
    "starter_tabard": { "name": "新手战袍", "slot": "tabard", "gearScore": 0, "rarity": "common" },
    "starter_wrist": { "name": "新手护腕", "slot": "wrist", "gearScore": 187, "rarity": "uncommon" },
    "starter_hands": { "name": "新手手套", "slot": "hands", "gearScore": 187, "rarity": "uncommon" },
    "starter_waist": { "name": "新手腰带", "slot": "waist", "gearScore": 187, "rarity": "uncommon" },
    "starter_legs": { "name": "新手护腿", "slot": "legs", "gearScore": 187, "rarity": "uncommon" },
    "starter_feet": { "name": "新手战靴", "slot": "feet", "gearScore": 187, "rarity": "uncommon" },
    "starter_ring": { "name": "新手戒指", "slot": "finger1", "gearScore": 187, "rarity": "uncommon" },
    "starter_trinket": { "name": "新手饰品", "slot": "trinket1", "gearScore": 187, "rarity": "uncommon" },
    "starter_mainhand": { "name": "新手武器", "slot": "mainhand", "gearScore": 187, "rarity": "uncommon" },
    "starter_offhand": { "name": "新手副手", "slot": "offhand", "gearScore": 187, "rarity": "uncommon" },

    // --- 5人英雄副本T7套装 (200装等, 紫色) ---
    "t7_5man_head": { "name": "英雄之头盔", "slot": "head", "gearScore": 200, "rarity": "epic" },
    "t7_5man_shoulder": { "name": "英雄之护肩", "slot": "shoulder", "gearScore": 200, "rarity": "epic" },
    "t7_5man_chest": { "name": "英雄之胸甲", "slot": "chest", "gearScore": 200, "rarity": "epic" },
    "t7_5man_hands": { "name": "英雄之手套", "slot": "hands", "gearScore": 200, "rarity": "epic" },
    "t7_5man_legs": { "name": "英雄之护腿", "slot": "legs", "gearScore": 200, "rarity": "epic" },
    "t7_5man_feet": { "name": "英雄之长靴", "slot": "feet", "gearScore": 200, "rarity": "epic" },

    // --- 5人英雄副本 "普通" 散件 (200装等, 蓝色) ---
    "common_200_neck": { "name": "普通之项链", "slot": "neck", "gearScore": 200, "rarity": "rare" },
    "common_200_back": { "name": "普通之披风", "slot": "back", "gearScore": 200, "rarity": "rare" },
    "common_200_wrist": { "name": "普通之护腕", "slot": "wrist", "gearScore": 200, "rarity": "rare" },
    "common_200_waist": { "name": "普通之腰带", "slot": "waist", "gearScore": 200, "rarity": "rare" },
    "common_200_ring": { "name": "普通之戒指", "slot": "finger1", "gearScore": 200, "rarity": "rare" },
    "common_200_trinket": { "name": "普通之饰品", "slot": "trinket1", "gearScore": 200, "rarity": "rare" },
    "common_200_mainhand": { "name": "普通之主手武器", "slot": "mainhand", "gearScore": 199, "rarity": "rare" },
    "common_200_offhand": { "name": "普通之副手物品", "slot": "offhand", "gearScore": 200, "rarity": "rare" },

    // --- 5人英雄副本 稀有武器 (213装等, 紫色) ---
    "h_weapon_black_ice_213": { "name": "黑冰 (英雄)", "slot": "mainhand", "gearScore": 213, "rarity": "epic" },
    "h_weapon_dragonscale_213": { "name": "龙人战斗法杖 (英雄)", "slot": "mainhand", "gearScore": 213, "rarity": "epic" },
    "h_weapon_hailstorm_213": { "name": "冰雹", "slot": "mainhand", "gearScore": 213, "rarity": "epic" },

    // --- (新增) 10人团本 T7 套装 (207装等, 紫色) ---
    "t7_10_head_207": { "name": "失落者的头盔", "slot": "head", "gearScore": 207, "rarity": "epic" },
    "t7_10_shoulder_207": { "name": "失落者的护肩", "slot": "shoulder", "gearScore": 207, "rarity": "epic" },
    "t7_10_chest_207": { "name": "失落者的胸甲", "slot": "chest", "gearScore": 207, "rarity": "epic" },
    "t7_10_hands_207": { "name": "失落者的手套", "slot": "hands", "gearScore": 207, "rarity": "epic" },
    "t7_10_legs_207": { "name": "失落者的护腿", "slot": "legs", "gearScore": 207, "rarity": "epic" },
    "t7_10_neck_207": { "name": "失落者的项链", "slot": "neck", "gearScore": 207, "rarity": "epic" },
    "t7_10_back_207": { "name": "失落者的披风", "slot": "back", "gearScore": 207, "rarity": "epic" },
    "t7_10_wrist_207": { "name": "失落者的护腕", "slot": "wrist", "gearScore": 207, "rarity": "epic" },
    "t7_10_waist_207": { "name": "失落者的腰带", "slot": "waist", "gearScore": 207, "rarity": "epic" },
    "t7_10_feet_207": { "name": "失落者的长靴", "slot": "feet", "gearScore": 207, "rarity": "epic" },
    "t7_10_finger_207": { "name": "失落者的戒指", "slot": "finger1", "gearScore": 207, "rarity": "epic" }, // (已合并)
    "t7_10_trinket_207": { "name": "失落者的饰品", "slot": "trinket1", "gearScore": 207, "rarity": "epic" }, // (已合并)
    "t7_10_mainhand_207": { "name": "失落者的武器", "slot": "mainhand", "gearScore": 207, "rarity": "epic" },
    "t7_10_offhand_207": { "name": "失落者的副手", "slot": "offhand", "gearScore": 207, "rarity": "epic" },

    // --- (新增) 10人团本 T7 稀有掉落 (213装等, 紫色) ---
    "t7_10_trinket_curse_213": { "name": "消逝的诅咒", "slot": "trinket1", "gearScore": 213, "rarity": "epic" },
    "t7_10_weapon_deathbite_213": { "name": "死亡之咬", "slot": "mainhand", "gearScore": 213, "rarity": "epic" },
    "naxx_25_trinket_spider": { "name": "蜘蛛的拥抱", "slot": "trinket1", "gearScore": 213, "rarity": "epic" }, // (移自旧NAXX, 10/25均掉落)
    "naxx_25_trinket_2": { "name": "龙魂图典", "slot": "trinket2", "gearScore": 213, "rarity": "epic" }, // (移自旧NAXX, 10/25均掉落)


    // --- (新增) 25人团本 T7 套装 (213装等, 紫色) ---
    "t7_25_head_213": { "name": "失落胜利者的头盔", "slot": "head", "gearScore": 213, "rarity": "epic" },
    "t7_25_shoulder_213": { "name": "失落胜利者的护肩", "slot": "shoulder", "gearScore": 213, "rarity": "epic" },
    "t7_25_chest_213": { "name": "失落胜利者的胸甲", "slot": "chest", "gearScore": 213, "rarity": "epic" },
    "t7_25_hands_213": { "name": "失落胜利者的手套", "slot": "hands", "gearScore": 213, "rarity": "epic" },
    "t7_25_legs_213": { "name": "失落胜利者的护腿", "slot": "legs", "gearScore": 213, "rarity": "epic" },
    "t7_25_neck_213": { "name": "失落胜利者的项链", "slot": "neck", "gearScore": 213, "rarity": "epic" },
    "t7_25_back_213": { "name": "失落胜利者的披风", "slot": "back", "gearScore": 213, "rarity": "epic" },
    "t7_25_wrist_213": { "name": "失落胜利者的护腕", "slot": "wrist", "gearScore": 213, "rarity": "epic" },
    "t7_25_waist_213": { "name": "失落胜利者的腰带", "slot": "waist", "gearScore": 213, "rarity": "epic" },
    "t7_25_feet_213": { "name": "失落胜利者的长靴", "slot": "feet", "gearScore": 213, "rarity": "epic" },
    "t7_25_finger_213": { "name": "失落胜利者的戒指", "slot": "finger1", "gearScore": 213, "rarity": "epic" }, // (已合并)
    "t7_25_trinket_213": { "name": "失落胜利者的饰品", "slot": "trinket1", "gearScore": 213, "rarity": "epic" }, // (已合并)
    "t7_25_mainhand_213": { "name": "失落胜利者的武器", "slot": "mainhand", "gearScore": 213, "rarity": "epic" },
    "t7_25_offhand_213": { "name": "失落胜利者的副手", "slot": "offhand", "gearScore": 213, "rarity": "epic" },

    // --- (新增) 25人团本 T7 稀有掉落 (226装等, 紫色) ---
    "t7_25_trinket_norgannon_226": { "name": "诺甘农的印记", "slot": "trinket1", "gearScore": 226, "rarity": "epic" },
    "t7_25_weapon_smile_226": { "name": "最后的笑容", "slot": "mainhand", "gearScore": 226, "rarity": "epic" },
    "t7_25_weapon_tide_226": { "name": "逆潮", "slot": "mainhand", "gearScore": 226, "rarity": "epic" },
    "t7_25_back_flag_226": { "name": "号旗披风", "slot": "back", "gearScore": 226, "rarity": "epic" },
    "naxx_25_mainhand_sword_1": { "name": "背叛者的人性", "slot": "mainhand", "gearScore": 226, "rarity": "epic" }, // (移自旧NAXX, 25人稀有掉落)

};