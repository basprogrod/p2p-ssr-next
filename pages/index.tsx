import { FC, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { DataConnection, Peer } from "peerjs";
import axios from "axios";

interface HomeProps {
  init: boolean;
  electionItems: string[];
}

const getCurrent = async (setCurrent: any) => {
  const res = await axios.get(
    `${process.env.DEMO_API || "http://localhost:3000"}/api/get-users`
  );
  setCurrent(res.data);
};

const getOther = async (setOther, id) => {
  const res = await axios.get(
    `${
      process.env.DEMO_API || "http://localhost:3000"
    }/api/get-users?other&current=${id}`
  );
  setOther(res.data);
};

const reset = async () => {
  const res = await axios.get(
    `${process.env.DEMO_API || "http://localhost:3000"}/api/get-users?reset`
  );
  console.log("🚀 ~ file: index.tsx ~ line 32 ~ res", res.data);
};

const Home: FC<HomeProps> = ({ electionItems }) => {
  const [peer, setPeer] = useState<Peer | undefined>(undefined);
  const [connections, setConnections] = useState<DataConnection[] | undefined>(
    undefined
  );
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [other, setOther] = useState<string[]>([]);
  const [isOpep, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<string | undefined>();

  useEffect(() => {
    getCurrent(setCurrent);
  }, []);

  useEffect(() => {
    if (!current) return;
    getOther(setOther, current);
  }, [current]);

  useEffect(() => {
    if (!current) return;

    import("peerjs").then(({ default: Peer }) => {
      const newPeer = new Peer(current, { debug: 2 });

      newPeer.on("open", () => {
        console.log("🚀 ~ open");
        setIsOpen(true);
      });

      newPeer.on("connection", (conn) => {
        console.log("🚀 ~ ", "connection with ", conn.peer.split("-").shift());
        // getOther(setOther, current)

        conn.on("data", (data) => {
          console.log(data);
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
    const last = connectedUsers[connectedUsers.length - 1];

    if (other.some((el) => el === last)) return;

    setOther((state) => {
      const s = new Set([...state, last]);
      return [...s];
    });
  }, [connectedUsers]);

  useEffect(() => {
    if (!other.length) return;
    if (!isOpep) return;

    const conns = other.map((conId) => peer.connect(conId));

    conns.forEach((con) => {
      con.on("open", () => {
        console.log("connected to ", con.peer.split("-").shift());
        // con.send("Hi");
      });

      con.on("data", (data) => {
        console.log(data);
        // con.send("Hi");
      });
    });

    setConnections(conns);
  }, [other, isOpep]);

  const sendData = (e: SyntheticEvent<HTMLButtonElement>) => {
    if (!current) return;

    connections.forEach((c) => {
      c.send("Hello from " + current.split("-").shift());
    });
  };

  useEffect(() => {
    if (!other.length) return;
    if (!peer) return;
    (window as any).peer = peer;
  }, [peer, other]);

  return (
    <div className="Home">
      <button onClick={sendData}>Send</button>
      <button onClick={reset}>Reset</button>
      {/* {electionItems.map((name, i) => (
        <button
          key={name}
          disabled={isVoted}
          data-election-id={i}
          onClick={sendData}
        >
          {name}
        </button>
      ))}

      <h1>Result</h1>

      {result.map((item, i) => (
        <h3 key={i}>
          <span>{electionItems[i]}:</span> <span>{item || 0} %</span>
        </h3>
      ))} */}

      <h3>Current user ID</h3>
      <div>{current}</div>

      <h3>Other connected users</h3>
      {connectedUsers.map((id) => (
        <div key={id}>{id}</div>
      ))}
    </div>
  );
};

export default Home;

export async function getStaticProps() {
  return {
    props: {
      electionItems: ["One", "Two", "Three", "Four", "Five"],
    }, // will be passed to the page component as props
  };
}
