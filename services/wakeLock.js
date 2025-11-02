/**
 * ==================================================================
 * services/wakeLock.js (新文件)
 * 职责: 管理浏览器的 Wake Lock API，包括请求、释放和可见性变化。
 * (已修正：修复 NotAllowedError 和 re-acquire 逻辑)
 * ==================================================================
 */

import { addMessage } from '../ui/messageLog.js';

let wakeLock = null;

/**
 * 内部函数：实际请求唤醒锁
 */
async function requestWakeLockInternal() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock 已激活。');
            addMessage('唤醒锁已激活，屏幕将保持常亮。', 'system');
            
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock 已释放。');
                wakeLock = null; // 确保在释放时更新状态
            });

        } catch (err) {
            console.error(`Wake Lock 请求失败: ${err.name}, ${err.message}`);
            // (我们不在此处显示错误消息，以免在不支持的浏览器或不可见时打扰用户)
        }
    } else {
        console.warn('此浏览器不支持 Wake Lock API。');
    }
}

/**
 * 导出的主函数：请求锁并设置可见性监听器
 * (从 main.js 移来)
 * (已修正：添加了 document.visibilityState 检查)
 */
export async function requestAndManageWakeLock() {
    
    // 1. (修改) 仅在页面当前可见时尝试进行初始请求
    if (document.visibilityState === 'visible') {
        await requestWakeLockInternal();
    }

    // 2. 设置监听器以在页面切换回来时重新获取锁
    // (这个监听器只会设置一次)
    document.addEventListener('visibilitychange', async () => {
        
        // (修改) 检查 wakeLock 是否为 null (表示我们没有锁)
        // 并且页面已变为可见
        if (wakeLock === null && document.visibilityState === 'visible') {
            console.log("页面变为可见，尝试重新获取 Wake Lock...");
            await requestWakeLockInternal();
        }
    });
}