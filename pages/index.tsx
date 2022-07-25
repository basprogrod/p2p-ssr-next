import { FC, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { DataConnection, Peer } from "peerjs";
import axios, { AxiosResponse } from "axios";
import { PeerType } from "./api/get-peer";

interface HomeProps {
  init: boolean;
  electionItems: string[];
  DEMO_API: string;
}

const Home: FC<HomeProps> = ({ electionItems, DEMO_API }) => {
  const [peer, setPeer] = useState<Peer | undefined>(undefined);
  const [current, setCurrent] = useState<PeerType | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const [isVoted, setIsVoted] = useState(false);

  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [result, setResult] = useState<string[]>([]);
  const [connections, setConnections] = useState<DataConnection[]>([]);

  const [numbers, setNumbers] = useState<number[]>([]);

  const getCurrent = async (setCurrent: any) => {
    const res = await axios.get<PeerType>(`${DEMO_API}/api/get-peer`);
    setCurrent(res.data);
  };

  const reset = async () => {
    const res = await axios.get(`${DEMO_API}/api/get-peer?reset`);
    console.log("🚀 ~ file: index.tsx ~ line 32 ~ res", res.data);
  };

  useEffect(() => {
    getCurrent(setCurrent);
  }, []);

  useEffect(() => {
    if (!current) return;

    import("peerjs").then(({ default: Peer }) => {
      const newPeer = new Peer(current.peerId, { debug: 2 });

      newPeer.on("open", () => {
        console.log("🚀 ~ open");
        setIsOpen(true);
      });

      newPeer.on("connection", (conn) => {
        console.log("🚀 ~ ", "connection with ", conn.peer.split("-").shift());

        conn.on("data", (data) => {
          console.log('🚀 ~ data', data)
          if (typeof data === "string") {
            setNumbers(JSON.parse(data as string));
          }
        });

        setConnectedUsers((state) => {
          const s = new Set([...state, conn.peer]);
          return [...s];
        });
      });

      setPeer(newPeer);
    });
  }, [current]);

  useEffect(() => {
    if (!current?.linkedPeers.length) return;
    if (!isOpen) return;

    const conns = current.linkedPeers.map((peerId) => {
      return peer.connect(peerId);
    });

    setConnections((state) => {
      const s = new Set([...state, ...conns]);
      return [...s];
    });
  }, [current?.linkedPeers, isOpen]);

  useEffect(() => {
    if (!connectedUsers.length) return;

    const lastConnectedUser = connectedUsers[connectedUsers.length - 1];

    const linksSet = new Set(current.linkedPeers);

    if (linksSet.has(lastConnectedUser)) return;

    const conns = [];

    for (const peerId of connectedUsers) {
      if (linksSet.has(peerId)) continue;
      conns.push(peer.connect(peerId));
    }

    peer.connect(lastConnectedUser);

    setConnections((state) => {
      const s = new Set([...state, ...conns]);
      return [...s];
    });
  }, [connectedUsers]);

  useEffect(() => {
    if (!peer) return;
    (window as any).peer = peer;
  }, [peer]);

  useEffect(() => {
    const init = electionItems.reduce<{ [field: number]: number }>(
      (acc, _cur, i) => {
        acc[i] = 0;
        return acc;
      },
      {}
    );

    const preparedData = numbers.reduce<{ [field: number]: number }>(
      (acc, cur) => {
        if (!!acc[cur]) acc[cur]++;
        else acc[cur] = 1;
        return acc;
      },
      init
    );

    const r = Object.keys(preparedData).map((key) => {
      return ((preparedData[+key] / numbers.length) * 100).toFixed(2);
    });

    setResult(r);
  }, [numbers]);

  useEffect(() => {
    connections.forEach((c) => {
      c.send(JSON.stringify(numbers));
    });
  }, [result.toString()]);

  return (
    <div className="Home">
      <div>
        {/* <button onClick={sendData}>Send</button> */}
        <button onClick={reset}>Reset</button>
      </div>

      <div style={{ margin: "30px" }}>
        {electionItems.map((name, i) => (
          <button
            key={name}
            data-election-id={i}
            style={{ background: `#9c${i}`, margin: "10px", padding: "5px" }}
            disabled={isVoted}
            onClick={(e: SyntheticEvent<HTMLButtonElement>) => {
              if (!current) return;
              setNumbers((state) => [...state, i]);
              setIsVoted(true);
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <i>Result</i>

      <div>Number of votes {numbers.length}</div>

      {result.map((item, i) => (
        <div key={i}>
          <span>{electionItems[i]}:</span> <span>{+item || 0} %</span>
          <div
            style={{
              background: "#0003",
              height: "10px",
              width: `${(+item || 0) * 2}px`,
              transition: "all .2s",
            }}
          />
        </div>
      ))}
      <hr />
      <div>
        <i>Current user ID</i>
        <div>{current?.peerId}</div>
      </div>
      <hr />
      <div>
        <i>Connested users</i>
        {connectedUsers.map((id) => (
          <button
            onClick={() => {
              const conn = peer.connect(id);

              setConnections((state) => {
                const s = new Set([...state, conn]);
                return [...s];
              });
            }}
            key={id}
          >
            {id}
          </button>
        ))}
      </div>
      <hr />
      <div>
        <i>Linked users</i>
        {current?.linkedPeers.map((it) => (
          <div key={it}>{it}</div>
        ))}
      </div>
    </div>
  );
};

export default Home;

export async function getStaticProps() {
  return {
    props: {
      DEMO_API: process.env.DEMO_API || "https://p2p-voting.netlify.app",
      electionItems: ["One", "Two", "Three"],
    }, // will be passed to the page component as props
  };
}
