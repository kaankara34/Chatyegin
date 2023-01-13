import { useState, useEffect } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";
import CryptoJS from "crypto-js";
var stompClient = null;
const Chat = () => {
  const [privateSide, setPrivateSide] = useState(new Map());
  const [publicSide, setPublicSide] = useState([]);
  const [tab, setTab] = useState("OzuNero");
  const [userValue, setUserValue] = useState({
    message: "",
    username: "",
    reciever: "",
    connected: false,
    senderFullName: "",
  });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surName, setSurname] = useState("");
  useEffect(() => {
    console.log(userValue);
  }, [userValue]);

  const connect = () => {
    let Sock = new SockJS(
      "http://comozyeginchatyegin-env.eba-k63hj4ns.us-east-1.elasticbeanstalk.com/websocket"
    );
    stompClient = over(Sock);
    stompClient.connect({}, onConnected, onError);
  };
  const userJoin = () => {
    var chatMessage = {
      senderName: userValue.username,
      senderFullName: userValue.username,
      status: "JOIN",
    };
    let encData = encryptData(chatMessage);

    stompClient.send("/chatyegin/message", {}, encData);
    console.log("JOIN SENT(ENCRYPTED): " + encData);
  };
  const onConnected = () => {
    setUserValue({ ...userValue, connected: true });
    stompClient.subscribe("/ozu-nero/public", messageReceived);
    stompClient.subscribe(
      "/ozu-members/" + userValue.username + "/private",
      privateMessagereceived
    );
    userJoin();
  };
  const messageReceived = (payload) => {
    console.log("MESSAGE(PUBLIC) RECEIVE(ENCRYPTED) : " + payload);
    let decData = dcryptData(payload);

    // var payloadData = JSON.parse(decData.body);
    let payloadData = {
      message: decData["message"],
      status: decData["status"],
      senderName: decData["senderName"],
      senderFullName: decData["senderFullName"],
    };

    switch (payloadData.status) {
      case "JOIN":
        console.log("JOIN RECEIVED(DECRYPTED): " + payloadData);
        console.log(payloadData);
        if (!privateSide.get(payloadData.senderName)) {
          if (payloadData.senderName == userValue.username) {
          } else {
            privateSide.set(payloadData.senderName, []);
            setPrivateSide(new Map(privateSide));
          }
        }
        break;
      case "MESSAGE":
        console.log("MESSAGE(PUBLIC) RECEIVED(DECRYPTED): " + payloadData);
        publicSide.push(payloadData);
        console.log(payloadData);
        setPublicSide([...publicSide]);

        break;
    }
  };

  const onError = (err) => {
    console.log(err);
  };
  const privateMessagereceived = (load) => {
    console.log("MESSAGE(PRIVATE) RECEIVED(ENCRYPTED) : " + load);
    let decData = dcryptData(load);
    let loadData = {
      message: decData["message"],
      status: decData["status"],
      senderName: decData["senderName"],
      senderFullName: decData["senderFullName"],
    };
    console.log("MESSAGE(PRIVATE) RECEIVED(DECRYPTED) : " + loadData);
    console.log(loadData);
    if (privateSide.get(loadData.senderFullName)) {
      privateSide.get(loadData.senderFullName).push(loadData);
      setPrivateSide(new Map(privateSide));
    } else {
      let list = [];
      list.push(loadData);
      privateSide.set(loadData.senderFullName, list);
      setPrivateSide(new Map(privateSide));
    }
  };
  const takeMessage = (event) => {
    const { value } = event.target;
    setUserValue({ ...userValue, message: value });
  };
  const sender = () => {
    if (stompClient) {
      var chatMessage = {
        senderName: userValue.username,
        message: userValue.message,
        status: "MESSAGE",
      };
      let encData = encryptData(chatMessage);
      stompClient.send("/chatyegin/message", {}, encData);
      console.log("PUBLIC MESSAGE(ENCRYPTED) SENT: " + encData);
      setUserValue({ ...userValue, message: "" });
    }
  };
  const sendPrivate = () => {
    if (stompClient) {
      var chatMessage = {
        senderFullName: userValue.username,
        senderName: userValue.username,
        receiverName: tab,
        message: userValue.message,
        status: "MESSAGE",
      };

      if (userValue.username !== tab) {
        privateSide.get(tab).push(chatMessage);
        setPrivateSide(new Map(privateSide));
      }
      stompClient.send(
        "/chatyegin/private-message",
        {},
        encryptData(chatMessage)
      );
      console.log(
        "PRIVATE MESSAGE(ENCRYPTED) SENT: " + encryptData(chatMessage)
      );
      setUserValue({ ...userValue, message: "" });
    }
  };
  const splitName = (uName) => {
    setEmail(uName);
    let x = "";
    if (uName.endsWith("@ozu.edu.tr")) {
      uName = userValue.username.split("@")[0].split(".")[0];
      x = userValue.username.split("@")[0].split(".")[1];
      uName = "Stu. " + uName + " " + x;
      uName = uName.toUpperCase();
      return uName;
    } else {
      uName = userValue.username.split("@")[0].split(".")[0];
      x = userValue.username.split("@")[0].split(".")[1];
      uName = "Ins. " + uName + " " + x;
      uName = uName.toUpperCase();
      return uName;
    }
  };

  const reverseSplitName = (uName) => {
    uName = uName.toLowerCase();
    if (uName.startsWith("i")) {
      let ans;
      let x = uName.substring(5);
      let a = x.substring(0, uName.indexOf(" "));
      let b = x.substring(x.indexOf(" ") + 1);
      let c = "@ozyegin.edu.tr";
      ans = a + "." + b + c;
      return ans;
    } else if (uName.startsWith("s")) {
      let ans;
      let x = uName.substring(5);
      let a = x.substring(0, uName.indexOf(" "));
      let b = x.substring(x.indexOf(" ") + 1);
      let c = "@ozu.edu.tr";
      ans = a + "." + b + c;
      return ans;
    }
  };
  const handleUsername = (event) => {
    const { value } = event.target;

    if (value.endsWith("@ozu.edu.tr")) {
      setName(userValue.username.split("@")[0].split(".")[0]);
      let n = name.toUpperCase();
      setSurname(userValue.username.split("@")[0].split(".")[1]);
      let s = surName.toUpperCase();

      setUserValue({ ...userValue, username: "S' " + n + " " + s });
    } else {
      setName(userValue.username.split("@")[0].split(".")[0]);
      let n = name.toUpperCase();
      setSurname(userValue.username.split("@")[0].split(".")[1]);
      let s = name.toUpperCase();
      setUserValue({ ...userValue, username: "I' " + n + " " + s });
    }
    setUserValue({ ...userValue, username: value });
  };

  const encryptData = (data) => {
    var ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      "my-secret-key@123"
    ).toString();
    return ciphertext;
  };
  const dcryptData = (data) => {
    var bytes = CryptoJS.AES.decrypt(data.body, "my-secret-key@123");
    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  };
  const registeration = () => {
    if (
      !userValue.username.endsWith("@ozu.edu.tr") &&
      !userValue.username.endsWith("@ozyegin.edu.tr")
    ) {
      alert("ONLY OZYEGIN MEMBERS ARE ALLOWED!");
    } else {
      let name;
      let firstName;
      let lastName;
      if (userValue.username.endsWith("@ozu.edu.tr")) {
        name = userValue.username.split("@")[0];
        [firstName, lastName] = name.split(".");
        let uName = firstName + " " + lastName;
        const { value } = uName;
        setUserValue({ ...userValue, username: "S' " + uName });
        connect();
      } else {
        name = userValue.username.split("@")[0];
        [firstName, lastName] = name.split(".");
        let uName = firstName + " " + lastName;
        const { value } = uName;
        setUserValue({ ...userValue, username: "I' " + uName });
        connect();
      }
    }
  };
  return (
    <div className="container">
      {userValue.connected ? (
        <div className="baslik">
          <div className="bas"> CHAT-YEGIN </div>
          <div className="chat-box">
            <div className="member-list">
              <ul id="myUL">
                <li
                  onClick={() => {
                    setTab("OzuNero");
                  }}
                  className={`member ${tab === "OzuNero" && "active"}`}
                >
                  Ozu Nero
                </li>

                {[...privateSide.keys()].map((senderName, index) => (
                  <li
                    onClick={() => {
                      setTab(senderName);
                    }}
                    className={`member ${tab === senderName && "active"}`}
                    key={index}
                  >
                    {senderName}
                  </li>
                ))}
                <li className={"prof-avatar"}>
                  <img
                    className={"prof-avatar-img"}
                    src={require("./avatar.png")}
                  ></img>
                </li>
                <li className={"avatar-bio"}>{userValue.username}</li>
              </ul>
            </div>
            {tab === "OzuNero" && (
              <div className="chat-content">
                <ul className="chat-messages">
                  {publicSide.map((chat, index) => (
                    <li
                      className={`message ${
                        chat.senderName === userValue.username && "self"
                      }`}
                      key={index}
                    >
                      {chat.senderName !== userValue.username && (
                        <div className="avatar">{chat.senderName}</div>
                      )}
                      <div className="message-data">{chat.message}</div>
                      {chat.senderName === userValue.username && (
                        <div className="avatar self">{chat.senderName}</div>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="send-message">
                  <input
                    type="text"
                    className="input-message"
                    placeholder="enter the message"
                    value={userValue.message}
                    onChange={takeMessage}
                  />
                  <button
                    type="button"
                    className="send-button"
                    onClick={sender}
                  >
                    send
                  </button>
                </div>
              </div>
            )}
            {tab !== "OzuNero" && (
              <div className="chat-content">
                <ul className="chat-messages">
                  {[...privateSide.get(tab)].map((chat, index) => (
                    <li
                      className={`message ${
                        chat.senderName === userValue.username && "self"
                      }`}
                      key={index}
                    >
                      {chat.senderName !== userValue.username && (
                        <div className="avatar">{chat.senderName}</div>
                      )}
                      <div className="message-data">{chat.message}</div>
                      {chat.senderName === userValue.username && (
                        <div className="avatar self">{chat.senderName}</div>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="send-message">
                  <input
                    type="text"
                    className="input-message"
                    placeholder="enter the message"
                    value={userValue.message}
                    onChange={takeMessage}
                  />
                  <button
                    type="button"
                    className="send-button"
                    onClick={sendPrivate}
                  >
                    send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="register">
          <div className="logo">
            <img id="mainLogo" src={require("./logo.png")} />
          </div>
          <div className="userName">
            <input
              id="user-name"
              placeholder="Enter your OzU mail"
              name="username"
              value={userValue.username}
              onChange={handleUsername}
              margin="normal"
            />
            <button id="mainButton" type="button" onClick={registeration}>
              connect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
