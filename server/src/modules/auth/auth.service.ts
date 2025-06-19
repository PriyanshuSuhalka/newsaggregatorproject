import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@modules/users/user.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private loggedInUsers = new Map<string, boolean>(); // Tracks logged-in status

  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async signup(data: SignupDto) {
    const exists = await this.userRepo.findOne({ where: { email: data.email } });
    if (exists) throw new BadRequestException('User already exists');
    const user = this.userRepo.create({ ...data, role: 'user' });
    await this.userRepo.save(user);
    return { message: 'Signup successful' };
  }

  async login(data: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: data.email } });
    if (!user || user.password !== data.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.loggedInUsers.set(data.email, true);
    return { message: `${user.role} login successful` };
  }

  logout(email: string) {
    if (this.loggedInUsers.get(email)) {
      this.loggedInUsers.delete(email);
      return { message: 'Logout successful' };
    } else {
      throw new BadRequestException('User not logged in');
    }
  }

  isLoggedIn(email: string) {
    return this.loggedInUsers.get(email) || false;
  }
}
