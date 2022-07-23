// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

type Db = {};

type Peer = {
  peerId: string | null;
  linkedPeers: string[];
};
[
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
];

class Mesh {
  mesh: (Peer | null)[][];
  sizeOfMesh: number;

  constructor(size: number = 5) {
    this.sizeOfMesh = size;
    this.mesh = [];
  }

  add(id: string): (Peer | null)[][] {
    const { mesh, getlinkedPeers } = this;

    let newPeer = undefined;

    Outer: for (let i = 0; i < mesh.length; i++) {
      const row = mesh[i];

      for (let j = 0; j < row.length; j++) {
        const col = row[j];

        if (col.peerId) continue;

        const peer: Peer = {
          peerId: id,
          linkedPeers: [],
        };

        mesh[i][j] = peer;

        newPeer = getlinkedPeers(mesh[i][j], mesh, i, j);

        break Outer;
      }
    }

    return newPeer;
  }

  reset() {
    this.createMesh();
  }
  getMesh() {
    return this.mesh;
  }

  createMesh() {
    for (let row = 0; row < this.sizeOfMesh; row++) {
      this.mesh[row] = [];

      for (let col = 0; col < this.sizeOfMesh; col++) {
        this.mesh[row][col] = {
          peerId: null,
          linkedPeers: [],
        };
      }
    }
  }

  private getlinkedPeers(
    peer: Peer,
    mesh: Mesh["mesh"],
    i: number,
    j: number
  ): Peer {
    for (const [row, col] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      if (!mesh[i + row]) continue;
      if (!mesh[i + row][j + col]) continue;

      const relatedPeer = mesh[i + row][j + col]?.peerId;

      if (relatedPeer) peer.linkedPeers.push(relatedPeer);
    }

    return peer;
  }
}

const mesh = new Mesh(3);
mesh.createMesh();

let u = 0;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const uuid = uuidv4();

    if ("reset" in req.query) {
      mesh.reset();
      u = 0;
      res.send(mesh.getMesh());

      return;
    }

    // const m = mesh.add((u++).toString());
    const m = mesh.add(uuid);
    res.send(m || 'the list of participants is filled');
    // console.log("🚀", m);
  }
}
