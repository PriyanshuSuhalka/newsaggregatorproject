import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@modules/users/user.entity";
import { Controller, Post, Body, Get, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly authService: AuthService // Inject AuthService
  ) {}

  @Post("signup")
  async signup(@Body() dto: SignupDto) {
    const user = this.userRepository.create(dto);
    return await this.userRepository.save(user);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("logout")
  logout(@Query("email") email: string) {
    return this.authService.logout(email);
  }

  @Get("status")
  status(@Query("email") email: string) {
    return { loggedIn: this.authService.isLoggedIn(email) };
  }
}
