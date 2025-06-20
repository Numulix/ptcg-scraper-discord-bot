import { pino } from "pino"

const pinoConfig = process.env.NODE_ENV === 'development' 
    ? {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                ignore: 'pid,hostname',
                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
            }
        }
    } : {}

export const logger = pino(pinoConfig);