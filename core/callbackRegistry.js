/**
 * ==================================================================
 * core/callbackRegistry.js (新文件)
 * 职责: 导出一个共享的 'callbacks' 对象，以避免循环依赖。
 * ==================================================================
 */

export const callbacks = {
    claimQuest: null,
    handleExchange: null
};