import { Pipeline, Redis } from 'ioredis';
import * as severity from './severity';
import { LogLevel } from './severity';
export { LogLevel } from './severity';

export default class Logger {
	private db: Redis;
	private count: number;
	private destinationGeneratorForRecent: (
		name: string,
		level: LogLevel
	) => string;
	private timeout: number;
	private destinationGeneratorForCommon: (
		name: string,
		level: LogLevel
	) => string;

	/**
   * create new instance for class Logger
   * @param db Redis instance
   * @param count count of recent saved log. DEFAULT: 100. 
   * @param destinationGeneratorForRecent destination key generator for recent log. DEFAULT: (name, level) => `recent:${name}:${level}`
   * @param timeout 
   * @param destinationGeneratorForCommon destination key generator for recent log. DEFAULT: (name, level) => `common:${name}:${level}`
   */
	constructor(
		db: Redis,
		count: number = 100,
		destinationGeneratorForRecent: (
			name: string,
			level: LogLevel
		) => string = (name: string, level: LogLevel) =>
			`recent:${name}:${level}`,
		timeout: number = 5,
		destinationGeneratorForCommon = (name: string, level: LogLevel) =>
			`common:${name}:${level}`
	) {
		this.db = db;
		this.count = count;
		this.destinationGeneratorForRecent = destinationGeneratorForRecent;
		this.timeout = timeout;
		this.destinationGeneratorForCommon = destinationGeneratorForCommon;
	}

	/**
   * logRecent to log recent log at max count
   * @param name log name
   * @param message log message
   * @param level log level
   * @param pipe used for execute actions of log
   */
	async logRecent(
		name: string,
		message: string,
		level: LogLevel = severity.INFO,
		pipe: Pipeline | null = null
	) {
		await Logger.logRecent(
			this.db,
			name,
			message,
			level,
			pipe,
			this.count,
			this.destinationGeneratorForRecent
		);
	}

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
	async logCommon(
		name: string,
		message: string,
		level: LogLevel = severity.INFO,
		pipe: Pipeline | null = null
	) {}

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
	static async logRecent(
		db: Redis,
		name: string,
		message: string,
		level: LogLevel = severity.INFO,
		pipe: Pipeline | null = null,
		count: number = 100,
		destinationGenerator = (name: string, level: LogLevel) =>
			`recent:${name}:${level}`
	) {
		const destination = destinationGenerator(name, level);
		message = new Date().toISOString() + ' ' + message;
		pipe = pipe ? pipe : db.pipeline();
		pipe.lpush(destination, message);
		pipe.ltrim(destination, 0, count - 1);
		await pipe.exec();
	}

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
	static async logCommon(
		db: Redis,
		name: string,
		message: string,
		level: LogLevel = severity.INFO,
		pipe: Pipeline | null = null,
		count: number = 100,
		timeout: number = 5,
		destinationGeneratorForCommon = (name: string, level: LogLevel) =>
			`common:${name}:${level}`,
		destinationGeneratorForRecent = (name: string, level: LogLevel) =>
			`recent:${name}:${level}`
	) {
		const destination = destinationGeneratorForCommon(name, level);
		const startKey = destination + ':start';
		pipe = pipe ? pipe : db.pipeline();
		const end = Date.now() + timeout * 1000;
		while (Date.now() < end) {
			try {
				pipe.watch(startKey);
				const hourStart = getHourTimeStrNow();
				const existing = await new Promise<
					string | undefined
				>((resolve, reject) =>
					pipe!.get(
						startKey,
						(err, res) => (err ? reject(err) : resolve(res))
					)
				);
				if (existing && existing < hourStart) {
					pipe.rename(destination, destination + ':last');
					pipe.rename(startKey, destination + ':pstart');
					pipe.set(startKey, hourStart);
				} else if (!existing) {
					pipe.set(startKey, hourStart);
				}
				pipe.zincrby(destination, 1, message);
				Logger.logRecent(
					db,
					name,
					message,
					level,
					pipe,
					count,
					destinationGeneratorForRecent
				);
				return;
			} catch (error) {
				continue;
			}
		}
	}
}

function getHourTimeStrNow(): string {
	const now = new Date();
	now.setMilliseconds(0);
	now.setSeconds(0);
	now.setMinutes(0);
	return now.toISOString();
}
