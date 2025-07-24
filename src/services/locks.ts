import { Verrou } from "@verrou/core"
   import { config } from "../config.ts"
   import { memoryStore } from '@verrou/core/drivers/memory'
   import { redisStore } from '@verrou/core/drivers/redis'
   import { redis } from './redis.ts'

   export const verrou = new Verrou({
       default: config.LOCK_STORE,
       stores: {
           memory: { driver: memoryStore() },
           redis: { driver: redisStore({ connection: redis }) },
       }
   })