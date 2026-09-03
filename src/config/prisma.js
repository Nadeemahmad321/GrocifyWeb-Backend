import {PrismaClient} from '@prisma/client';
export const prisma=globalThis.__grocifyPrisma||new PrismaClient();
if(process.env.NODE_ENV!=='production')globalThis.__grocifyPrisma=prisma;
