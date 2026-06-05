import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Member } from '../../libs/dto/member/member';
import { JwtService } from '@nestjs/jwt';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { MemberStatus } from '../../libs/enums/member.enum';
import { Message } from '../../libs/enums/common.enum';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectModel('Member') private readonly memberModel: Model<Member>,
  ) {}

  public async hashPassword(memberPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(memberPassword, salt);
  }

  public async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  public async createToken(member: Member): Promise<string> {
    const source = member['_doc'] ? member['_doc'] : member;
    const payload = {
      _id: source._id?.toString(),
      memberType: source.memberType,
      memberStatus: source.memberStatus,
      memberAuthType: source.memberAuthType,
      memberPhone: source.memberPhone,
      memberNick: source.memberNick,
      memberFullName: source.memberFullName,
      memberImage: source.memberImage,
      memberAddress: source.memberAddress,
      memberDesc: source.memberDesc,
      memberKindergartens: source.memberKindergartens,
      memberArticles: source.memberArticles,
      memberPoints: source.memberPoints,
      memberLikes: source.memberLikes,
      memberViews: source.memberViews,
      memberWarnings: source.memberWarnings,
      memberBlocks: source.memberBlocks,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };

    return await this.jwtService.signAsync(payload);
  }

  public async verifyToken(token: string): Promise<Member> {
    const member = await this.jwtService.verifyAsync(token);
    member._id = shapeIntoMongoObjectId(member._id);

    return member;
  }

  public async authenticateToken(token: string): Promise<Member> {
    try {
      const tokenMember = await this.verifyToken(token);
      if (!tokenMember?._id) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

      const currentMember = await this.memberModel.findById(tokenMember._id).lean<Member>().exec();
      if (!currentMember || currentMember.memberStatus !== MemberStatus.ACTIVE) {
        throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
      }

      return currentMember;
    } catch (err) {
      throw new UnauthorizedException(Message.NOT_AUTHENTICATED);
    }
  }
}
