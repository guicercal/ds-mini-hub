import { PrismaClient } from '@prisma/client'

/**
 * Instantiates the Prisma ORM Client.
 * Wrapped in a singleton pattern to prevent multiple active
 * database connections from crashing Node in Hot-Reload dev mode.
 */
const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
