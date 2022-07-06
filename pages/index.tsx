/* eslint-disable react-hooks/exhaustive-deps */
import { FC, SyntheticEvent, useEffect, useState } from "react";
import { DataConnection, Peer } from "peerjs";
import axios from "axios";

interface HomeProps {
  current: string;
  other: string[];
  initiator: string;
  init: boolean;
  electionItems: string[];
}

const Home: FC<HomeProps> = ({
  electionItems,
  current,
  other,
  initiator,
  init,
}) => {
  const [peer, setPeer] = useState<Peer | undefined>(undefined);
  const [connection, setConnection] = useState<DataConnection | undefined>(
    undefined
  );
  const [numbers, setNumbers] = useState<number[]>([]);
  const [result, setResult] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isVoted, setIsVoted] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!numbers.length) return;

    const init = electionItems.reduce<{ [field: number]: number }>(
      (acc, cur, i) => {
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
    import("peerjs").then(({ default: Peer }) => {
      const newPeer = new Peer(init ? initiator : current, { debug: 2 });

      newPeer.on("open", () => {
        console.log("🚀 ~ open");
        setIsOpen(true);
      });

      newPeer.on("connection", (conn) => {
        conn.on("data", (data) => {
          console.log(data);
          setNumbers((state) => [...state, +(data as string)]);
        });
        setConnectedUsers((state) => [...state, conn.peer]);
      });

      setPeer(newPeer);
    });
  }, []);

  useEffect(() => {
    if (!peer) return;
    if (init) return;

    const conn = peer.connect(initiator);

    conn.on("open", () => {
      console.log("connection!!!");
    });

    setConnection(conn);
  }, [isOpen]);

  const sendData = (e: SyntheticEvent<HTMLButtonElement>) => {
    setIsVoted(true);
    connection!.send(e.currentTarget.dataset.electionId);
  };

  useEffect(() => {
    if (!peer) return;
    (window as any).peer = peer;
  }, [peer]);

  return (
    <div className="Home">
      {electionItems.map((name, i) => (
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
      ))}

      {/* <h3>Initiator user ID</h3>
      <div>{initiator}</div> */}
      {/* 
      <h3>Current user ID</h3>
      <div>{init ? initiator : current}</div>

      <h3>Other connected users</h3>
      {connectedUsers.map(id => (
        <div key={id}>{id}</div>
      ))} */}
    </div>
  );
};

export default Home;

export async function getServerSideProps({ query }: any) {
  const res = await axios.get("http://localhost:3000/api/get-users");
  console.log("🚀 ~ file: index.tsx ~ line 94 ~ res", res.data);

  return {
    props: {
      ...res.data,
      init: !!query.init,
      electionItems: ["One", "Two", "Three", "Four", "Five"],
    }, // will be passed to the page component as props
  };
}
