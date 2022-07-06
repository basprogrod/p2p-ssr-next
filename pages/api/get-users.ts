// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'

const db = {
  setInitiator(id: string) {
    this.initiator = id
  },

  getInitiator() {
    return this.initiator
  },

  add(id: string) {
    this.users.push(id)
  },

  getOther(id: string) {
    return this.users.filter(item => item !== id)
  },

  getCurrent(): string {
    return this.users[this.users.length - 1]
  },

  reset() {
    this.users = []
    this.initiator = undefined
  },
  initiator: undefined as string | undefined,
  users: [] as string[],
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const uuid = uuidv4()

    if (req.query.reset) {
      db.reset()

      res.send('OK')
      return
    }

    if(!db.initiator) db.setInitiator(uuid)

    db.add(uuid)

    res.send({
      current: db.getCurrent(),
      other: db.getOther(db.getCurrent()),
      initiator: db.getInitiator(),
    })
  }
}
