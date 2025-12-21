import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { UserDTO } from "@one-app/types";

@Injectable()
export class AuthService {
  private refreshTokens = new Map<string, string>();

  constructor(private usersService: UsersService, private jwt: JwtService) {}

  async validate(email: string, password: string): Promise<UserDTO> {
    const user = this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException("Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async login(email: string, password: string) {
    const user = await this.validate(email, password);
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: "15m" });
    const refreshToken = this.jwt.sign({ sub: user.id }, { expiresIn: "7d" });
    this.refreshTokens.set(user.id, refreshToken);
    return { user, accessToken, refreshToken };
  }

  refresh(token: string) {
    try {
      const payload = this.jwt.verify(token);
      const saved = this.refreshTokens.get(payload.sub);
      if (saved !== token) throw new UnauthorizedException("Invalid refresh token");
      const accessToken = this.jwt.sign({ sub: payload.sub, role: payload.role }, { expiresIn: "15m" });
      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
