import { gameState } from '../core/gameState.js'; import { saveGame } from '../core/saveManager.js'; import { CHEST_LOOT_TABLE } from '../data/chest-data.js'; import { addMessage } from '../ui/messageLog.js'; import { showLootPopup } from '../ui/lootPopup.js'; import { updateStatsDisplay } from '../ui/mainDisplay.js'; import { updateChestUI } from '../ui/chestUI.js'; import { addReminder } from '../ui/reminderManager.js'; import { ITEM_DATA } from '../data/item-data.js'; import { equipItem } from '../core/equipmentManager.js';

export function openLuckyChest() {
    if ((gameState.luckyChests || 0) <= 0) { addMessage("无幸运宝箱！", "error"); return; }
    gameState.luckyChests--;

    const map = {'atiyehsuide':"埃提耶什·守护者的传说之杖", 'walanaiersuide':"瓦兰奈尔·远古王者之锤", 'lushichuanshuodesuide':"炉石传说·真尼玛好玩"};
    const pool = CHEST_LOOT_TABLE.filter(l => !(l.type==='shard' && gameState.legendaryItemsObtained[map[l.id]]));
    
    let total = 0; pool.forEach(i => total += i.weight);
    let rnd = Math.random() * total, loot = pool[0];
    for (const l of pool) { rnd -= l.weight; if (rnd <= 0) { loot = l; break; } }

    const amt = Math.floor(Math.random() * (loot.max - loot.min + 1)) + loot.min;
    let msg = "", icon = "🎁", rarity = "common";

    if (loot.type === 'gold') { gameState.gold += amt; msg = `${amt} 金币`; icon = "💰"; rarity = "uncommon"; }
    else if (loot.type === 'badge') { 
        gameState.badges[loot.id] = (gameState.badges[loot.id] || 0) + amt; msg = `${amt} x ${loot.name}`; icon = "🛡️"; rarity = "rare"; 
        // (修改) 追踪水晶
        if (loot.id === 'abyssCrystal' && gameState.daily?.stats) gameState.daily.stats.crystals = (gameState.daily.stats.crystals||0) + amt;
    }
    else if (loot.type === 'shard') { gameState.legendaryShards[loot.id] = (gameState.legendaryShards[loot.id] || 0) + amt; msg = `${amt} x ${loot.name}`; icon = "🔸"; rarity = "legendary"; }
    else if (loot.type === 'item') {
        const it = ITEM_DATA[loot.id];
        if (it) {
            msg = `[${it.name}]`; icon = it.icon || "📦"; rarity = it.rarity || "epic";
            if (it.type === 'collectible') { if (!gameState.collectibles.includes(loot.id)) gameState.collectibles.push(loot.id); else msg += " (已拥有)"; }
            else if (it.slot) equipItem(loot.id);
        }
    }

    saveGame(); updateStatsDisplay(); updateChestUI();
    addMessage(`宝箱开启：${msg}`, "reward");
    if (rarity === 'epic' || rarity === 'legendary') showLootPopup(msg, icon, rarity); else addReminder(`获得 ${msg}`, icon, rarity);
}