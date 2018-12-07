/**
 * Log security level
 * 日志的安全级别
 */

export type LogLevel =
	| 'debug'
	| 'info'
	| 'warning'
	| 'error'
	| 'critical'
	| string;

export const DEBUG: LogLevel = 'debug';

export const INFO: LogLevel = 'info';

export const warning: LogLevel = 'warning';

export const error: LogLevel = 'error';

export const critical: LogLevel = 'critical';
