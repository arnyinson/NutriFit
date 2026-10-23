import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { io } from "socket.io-client";

// Same server as the API, without the "/api" part
const SOCKET_URL = "https://nutrifit-backend-api-t21p.onrender.com";

// Live ticket updates. `onChange` runs when the server says a ticket of this
// user changed, after every (re)connect, and when the app returns to the
// foreground. Returns a function that stops everything.
export async function connectTicketSocket(
  onChange: () => void,
): Promise<() => void> {
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    // Called on every (re)connect, so a fresh token is always used
    auth: (cb) => {
      AsyncStorage.getItem("token")
        .then((token) => cb({ token }))
        .catch(() => cb({}));
    },
  });

  socket.on("tickets:changed", onChange);
  socket.on("connect", onChange);

  const appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") onChange();
  });

  return () => {
    appStateSub.remove();
    socket.off("tickets:changed", onChange);
    socket.off("connect", onChange);
    socket.disconnect();
  };
}
