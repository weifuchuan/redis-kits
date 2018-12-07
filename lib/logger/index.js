"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const severity = __importStar(require("./severity"));
class Logger {
    /**
   * create new instance for class Logger
   * @param db Redis instance
   * @param count count of recent saved log. DEFAULT: 100.
   * @param destinationGeneratorForRecent destination key generator for recent log. DEFAULT: (name, level) => `recent:${name}:${level}`
   * @param timeout
   * @param destinationGeneratorForCommon destination key generator for recent log. DEFAULT: (name, level) => `common:${name}:${level}`
   */
    constructor(db, count = 100, destinationGeneratorForRecent = (name, level) => `recent:${name}:${level}`, timeout = 5, destinationGeneratorForCommon = (name, level) => `common:${name}:${level}`) {
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
    logRecent(name, message, level = severity.INFO, pipe = null) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Logger.logRecent(this.db, name, message, level, pipe, this.count, this.destinationGeneratorForRecent);
        });
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
    logCommon(name, message, level = severity.INFO, pipe = null) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
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
    static logRecent(db, name, message, level = severity.INFO, pipe = null, count = 100, destinationGenerator = (name, level) => `recent:${name}:${level}`) {
        return __awaiter(this, void 0, void 0, function* () {
            const destination = destinationGenerator(name, level);
            message = new Date().toISOString() + ' ' + message;
            pipe = pipe ? pipe : db.pipeline();
            pipe.lpush(destination, message);
            pipe.ltrim(destination, 0, count - 1);
            yield pipe.exec();
        });
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
    static logCommon(db, name, message, level = severity.INFO, pipe = null, count = 100, timeout = 5, destinationGeneratorForCommon = (name, level) => `common:${name}:${level}`, destinationGeneratorForRecent = (name, level) => `recent:${name}:${level}`) {
        return __awaiter(this, void 0, void 0, function* () {
            const destination = destinationGeneratorForCommon(name, level);
            const startKey = destination + ':start';
            pipe = pipe ? pipe : db.pipeline();
            const end = Date.now() + timeout * 1000;
            while (Date.now() < end) {
                try {
                    pipe.watch(startKey);
                    const hourStart = getHourTimeStrNow();
                    const existing = yield new Promise((resolve, reject) => pipe.get(startKey, (err, res) => (err ? reject(err) : resolve(res))));
                    if (existing && existing < hourStart) {
                        pipe.rename(destination, destination + ':last');
                        pipe.rename(startKey, destination + ':pstart');
                        pipe.set(startKey, hourStart);
                    }
                    else if (!existing) {
                        pipe.set(startKey, hourStart);
                    }
                    pipe.zincrby(destination, 1, message);
                    Logger.logRecent(db, name, message, level, pipe, count, destinationGeneratorForRecent);
                    return;
                }
                catch (error) {
                    continue;
                }
            }
        });
    }
}
exports.default = Logger;
function getHourTimeStrNow() {
    const now = new Date();
    now.setMilliseconds(0);
    now.setSeconds(0);
    now.setMinutes(0);
    return now.toISOString();
}
//# sourceMappingURL=index.js.map