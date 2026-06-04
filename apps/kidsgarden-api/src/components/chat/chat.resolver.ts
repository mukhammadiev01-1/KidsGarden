import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Conversation } from '../../libs/dto/conversation/conversation';
import { Message, Messages } from '../../libs/dto/message/message';
import { MessagesInquiry, SendMessageInput } from '../../libs/dto/message/message.input';
import { Member } from '../../libs/dto/member/member';
import { MemberType } from '../../libs/enums/member.enum';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Resolver()
export class ChatResolver {
	constructor(private readonly chatService: ChatService) {}

	@Roles(MemberType.PARENT, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Conversation)
	public async getOrCreateApplicationConversation(
		@Args('applicationId') input: string,
		@AuthMember() authMember: Member,
	): Promise<Conversation> {
		console.log('Mutation: getOrCreateApplicationConversation');
		const applicationId = shapeIntoMongoObjectId(input);
		return await this.chatService.getOrCreateApplicationConversation(authMember, applicationId);
	}

	@Roles(MemberType.PARENT, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Conversation)
	public async getConversation(
		@Args('conversationId') input: string,
		@AuthMember() authMember: Member,
	): Promise<Conversation> {
		console.log('Query: getConversation');
		const conversationId = shapeIntoMongoObjectId(input);
		return await this.chatService.getConversation(authMember, conversationId);
	}

	@Roles(MemberType.PARENT, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Messages)
	public async getMessages(
		@Args('input') input: MessagesInquiry,
		@AuthMember() authMember: Member,
	): Promise<Messages> {
		console.log('Query: getMessages');
		input.search.conversationId = shapeIntoMongoObjectId(input.search.conversationId);
		return await this.chatService.getMessages(authMember, input);
	}

	@Roles(MemberType.PARENT, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Message)
	public async sendMessage(
		@Args('input') input: SendMessageInput,
		@AuthMember() authMember: Member,
	): Promise<Message> {
		console.log('Mutation: sendMessage');
		input.conversationId = shapeIntoMongoObjectId(input.conversationId);
		return await this.chatService.sendMessage(authMember, input);
	}

	@Roles(MemberType.PARENT, MemberType.KINDERGARTEN_ADMIN, MemberType.SUPER_ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Boolean)
	public async markConversationRead(
		@Args('conversationId') input: string,
		@AuthMember() authMember: Member,
	): Promise<boolean> {
		console.log('Mutation: markConversationRead');
		const conversationId = shapeIntoMongoObjectId(input);
		return await this.chatService.markConversationRead(authMember, conversationId);
	}
}
