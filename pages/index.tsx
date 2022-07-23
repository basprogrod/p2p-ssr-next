import { FC, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { DataConnection, Peer } from "peerjs";
import axios from "axios";

interface HomeProps {
  init: boolean;
  electionItems: string[];
  DEMO_API: string;
}

const Home: FC<HomeProps> = ({ electionItems, DEMO_API }) => {
  const [peer, setPeer] = useState<Peer | undefined>(undefined);
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [result, setResult] = useState<string[]>([]);
  const [other, setOther] = useState<string[]>([]);
  const [isOpep, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<string | undefined>();
  const [numbers, setNumbers] = useState<number[]>([]);
  const [isVoted, setIsVoted] = useState(false);

  const getCurrent = async (setCurrent: any) => {
    const res = await axios.get(`${DEMO_API}/api/get-reer`);
    setCurrent(res.data);
  };

  const getOther = async (setOther, id) => {
    const res = await axios.get(
      `${DEMO_API}/api/get-users?other&current=${id}`
    );
    setOther(res.data);
  };

  const reset = async () => {
    const res = await axios.get(`${DEMO_API}/api/get-reer?reset`);
    console.log("🚀 ~ file: index.tsx ~ line 32 ~ res", res.data);
  };

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

        conn.on("data", (data) => {
          console.log(data);
          setNumbers((state) => [...state, +(data as string)]);
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

    const d = () => {
      return {
        a: 'kek'
      }
    }
    const s = () => ({
      a: 'kek'
    })

    conns.forEach((con) => {
      con.on("open", () => {
        console.log("connected to ", con.peer.split("-").shift());
      });
    });

    setConnections(conns);
  }, [other, isOpep]);

  useEffect(() => {
    if (!other.length) return;
    if (!peer) return;
    (window as any).peer = peer;
  }, [peer, other]);

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
      c.send(numbers[numbers.length - 1]);
    });
  }, [isVoted]);

  return (
    <div className="Home">
      <div>
        {/* <button onClick={sendData}>Send</button> */}
        <button onClick={reset}>Reset</button>
      </div>

      {electionItems.map((name, i) => (
        <button
          key={name}
          disabled={isVoted}
          data-election-id={i}
          onClick={(e: SyntheticEvent<HTMLButtonElement>) => {
            if (!current) return;
            setNumbers((state) => [...state, i]);
            setIsVoted(true);
          }}
        >
          {name}
        </button>
      ))}

      <h5>Result</h5>

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

      {/* <h3>Current user ID</h3>
      <div>{current}</div>

      <h3>Other connected users</h3>
      {connectedUsers.map((id) => (
        <div style={{ fontSize: "5px" }} key={id}>
          {id}
        </div>
      ))} */}
    </div>
  );
};

export default Home;

export async function getStaticProps() {
  return {
    props: {
      DEMO_API: process.env.DEMO_API || 'https://p2p-voting.netlify.app',
      electionItems: ["One", "Two", "Three"],
    }, // will be passed to the page component as props
  };
}
