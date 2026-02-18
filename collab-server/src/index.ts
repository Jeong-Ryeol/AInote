import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.COLLAB_JWT_SECRET || "dev-secret";

const server = Server.configure({
  port: parseInt(process.env.PORT || "1234"),

  async onAuthenticate({ token, documentName }) {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        workspaceId: string;
      };

      // documentName format: "note:{noteId}"
      const noteId = documentName.replace("note:", "");

      // Verify user has access to this note's workspace
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { workspaceId: true },
      });

      if (!note) throw new Error("Note not found");

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: note.workspaceId,
            userId: payload.userId,
          },
        },
      });

      if (!member) throw new Error("Not a workspace member");

      return {
        user: {
          id: payload.userId,
          name: payload.userId, // Will be replaced with actual name
        },
      };
    } catch (error) {
      throw new Error("Authentication failed");
    }
  },

  extensions: [
    new Database({
      async fetch({ documentName }) {
        const noteId = documentName.replace("note:", "");
        const note = await prisma.note.findUnique({
          where: { id: noteId },
          select: { yjsState: true },
        });
        return note?.yjsState || null;
      },

      async store({ documentName, state }) {
        const noteId = documentName.replace("note:", "");
        await prisma.note.update({
          where: { id: noteId },
          data: { yjsState: Buffer.from(state) },
        });
      },
    }),
  ],
});

server.listen().then(() => {
  console.log(
    `Hocuspocus collaboration server running on port ${server.configuration.port}`
  );
});
