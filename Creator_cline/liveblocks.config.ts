import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

type Presence = {
  cursor: { x: number; y: number } | null;
};

type UserMeta = {
  id: string;
  info: {
    name: string;
  };
};

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useMyPresence,
} = createRoomContext<Presence, {}, UserMeta>(client);
