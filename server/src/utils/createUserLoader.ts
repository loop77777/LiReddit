import DataLoader from "dataloader";
import { User } from "../entities/User";
import { In } from "typeorm";

// [1, 78, 8, 9]
// [{id: 1, username: 'tim'}, {}, {}, {}]
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findBy({ id: In(userIds) });
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });
    return userIds.map((userId) => userIdToUser[userId]);
  });
