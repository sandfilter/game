/**
 * ==================================================================
 * core/callbackRegistry.js (新文件)
 * 职责: 导出一个共享的 'callbacks' 对象，以避免循环依赖。
 * (已修改：添加 buyProficiency 回调)
 * (已修改：添加 handleAscension 回调)
 * ==================================================================
 */

export const callbacks = {
    claimQuest: null,
    handleExchange: null,
    buyProficiency: null, // <<< (新增)
    handleAscension: null // <<< (新增)
};