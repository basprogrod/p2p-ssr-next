// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

type Db = {
  users: string[]
  add: (id: string) => void
  reset: () => void
  getOther: (id: string) => string[]
  getAll: () => string[]
  getCurrent: () => string
}

const db: Db = {
  add(id: string) {
    this.users.push(id);
  },

  getOther(id: string) {
    return this.users.filter((item) => item !== id);
  },

  getAll() {
    return this.users;
  },

  getCurrent(id?: string): string {
    // if (id) return this.users.filter((item) => item === id)  
    return this.users[this.users.length - 1];
  },

  reset() {
    this.users = [];
  },
  users: [] as string[],
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const uuid = uuidv4();

    if ("reset" in req.query) {
      db.reset();

      res.send(db.getAll());
      return;
    }

    if ("other" in req.query) {
      res.send(db.getOther(req.query.current as string));

      return;
    }

    db.add(uuid);

    res.send(db.getCurrent());
  }
}
