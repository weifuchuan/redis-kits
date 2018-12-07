import { Pipeline, Redis } from 'ioredis';
import { LogLevel } from './severity';
export { LogLevel } from './severity';
export default class Logger {
    private db;
    private count;
    private destinationGeneratorForRecent;
    private timeout;
    private destinationGeneratorForCommon;
    /**
   * create new instance for class Logger
   * @param db Redis instance
   * @param count count of recent saved log. DEFAULT: 100.
   * @param destinationGeneratorForRecent destination key generator for recent log. DEFAULT: (name, level) => `recent:${name}:${level}`
   * @param timeout
   * @param destinationGeneratorForCommon destination key generator for recent log. DEFAULT: (name, level) => `common:${name}:${level}`
   */
    constructor(db: Redis, count?: number, destinationGeneratorForRecent?: (name: string, level: LogLevel) => string, timeout?: number, destinationGeneratorForCommon?: (name: string, level: string) => string);
    /**
   * logRecent to log recent log at max count
   * @param name log name
   * @param message log message
   * @param level log level
   * @param pipe used for execute actions of log
   */
    logRecent(name: string, message: string, level?: LogLevel, pipe?: Pipeline | null): Promise<void>;
    /**
   * logCommon to log common log
   * @param db Redis instance
   * @param name log name
   * @param message log message
   * @param level log level
   * @param pipe used for execute actions of log
   * @param count count of recent saved log
   * @param timeout second
   * @param destinationGeneratorForCommon destination key generator. DEFAULT: (name, level) => `common:${name}:${level}`
   * @param destinationGeneratorForRecent destination key generator. DEFAULT: (name, level) => `recent:${name}:${level}`
   */
    logCommon(name: string, message: string, level?: LogLevel, pipe?: Pipeline | null): Promise<void>;
    /**
   * logRecent to log recent log at max count
   * @param db Redis instance
   * @param name log name
   * @param message log message
   * @param level log level
   * @param pipe used for execute actions of log
   * @param count count of recent saved log
   * @param destinationGenerator destination key generator. DEFAULT: (name, level) => `recent:${name}:${level}`
   */
    static logRecent(db: Redis, name: string, message: string, level?: LogLevel, pipe?: Pipeline | null, count?: number, destinationGenerator?: (name: string, level: string) => string): Promise<void>;
    /**
   * logCommon to log common log
   * @param db Redis instance
   * @param name log name
   * @param message log message
   * @param level log level
   * @param pipe used for execute actions of log
   * @param count count of recent saved log
   * @param timeout second
   * @param destinationGeneratorForCommon destination key generator. DEFAULT: (name, level) => `common:${name}:${level}`
   * @param destinationGeneratorForRecent destination key generator. DEFAULT: (name, level) => `recent:${name}:${level}`
   */
    static logCommon(db: Redis, name: string, message: string, level?: LogLevel, pipe?: Pipeline | null, count?: number, timeout?: number, destinationGeneratorForCommon?: (name: string, level: string) => string, destinationGeneratorForRecent?: (name: string, level: string) => string): Promise<void>;
}
