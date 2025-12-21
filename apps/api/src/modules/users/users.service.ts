import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UserDTO } from "@one-app/types";

type StoredUser = UserDTO & { passwordHash: string };

@Injectable()
export class UsersService {
  private users: StoredUser[] = [];

  constructor() {
    const email = process.env.ADMIN_EMAIL || "admin@example.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const hash = bcrypt.hashSync(password, 10);
    this.users.push({ id: "admin-1", email, passwordHash: hash, role: "admin" });
  }

  findByEmail(email: string): StoredUser | undefined {
    return this.users.find((u) => u.email === email);
  }

  list(): UserDTO[] {
    return this.users.map(({ passwordHash, ...rest }) => rest);
  }
}
