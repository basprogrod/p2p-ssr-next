// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { v4 as uuidv4 } from "uuid";

export type PeerType = {
  peerId: string | null;
  linkedPeers: string[];
};

class Mesh {
  mesh: (PeerType | null)[][];
  sizeOfMesh: number;

  constructor(size: number = 5) {
    this.sizeOfMesh = size;
    this.mesh = [];
  }

  add(id: string): PeerType {
    const { mesh, getlinkedPeers } = this;

    let newPeer: PeerType = undefined;

    Outer: for (let i = 0; i < mesh.length; i++) {
      const row = mesh[i];

      for (let j = 0; j < row.length; j++) {
        const col = row[j];

        if (col.peerId) continue;

        const peer: PeerType = {
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
    peer: PeerType,
    mesh: Mesh["mesh"],
    i: number,
    j: number
  ): PeerType {
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

const mesh = new Mesh(5);
mesh.createMesh();


export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const uuid = uuidv4();

    if ("reset" in req.query) {
      mesh.reset();
      res.send(mesh.getMesh());

      return;
    }

    // const m = mesh.add((u++).toString());
    const m = mesh.add(uuid);
    const r = { ...m, mesh: mesh.getMesh() };
    res.send(r);
    // console.log("🚀", m);
  }
}
