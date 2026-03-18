import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CreateGroupUseCase } from "../../application/use-cases/create-group.use-case";
import { CreateUserUseCase } from "../../application/use-cases/create-user.use-case";
import { GetNodeAncestorsUseCase } from "../../application/use-cases/get-node-ancestors.use-case";
import { GetNodeDescendantsUseCase } from "../../application/use-cases/get-node-descendants.use-case";
import { GetUserOrganizationsUseCase } from "../../application/use-cases/get-user-organizations.use-case";
import { LinkUserToGroupUseCase } from "../../application/use-cases/link-user-to-group.use-case";
import { CreateGroupDto } from "./dto/create-group.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { IdParamDto } from "./dto/id-param.dto";
import { LinkUserGroupDto } from "./dto/link-user-group.dto";
import { NodeResponseDto } from "./dto/node-response.dto";
import { OrganizationRelationDto } from "./dto/organization-relation.dto";

@ApiTags("Organization")
@Controller()
export class OrganizationController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly createGroupUseCase: CreateGroupUseCase,
    private readonly linkUserToGroupUseCase: LinkUserToGroupUseCase,
    private readonly getUserOrganizationsUseCase: GetUserOrganizationsUseCase,
    private readonly getNodeAncestorsUseCase: GetNodeAncestorsUseCase,
    private readonly getNodeDescendantsUseCase: GetNodeDescendantsUseCase,
  ) {}

  @Post("users")
  @ApiOperation({ summary: "Create user node" })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ type: NodeResponseDto })
  async createUser(@Body() body: CreateUserDto): Promise<NodeResponseDto> {
    const node = await this.createUserUseCase.execute(body);
    return {
      id: node.id,
      type: node.type,
      name: node.name,
      email: node.email,
    };
  }

  @Post("groups")
  @ApiOperation({ summary: "Create group node" })
  @ApiBody({ type: CreateGroupDto })
  @ApiCreatedResponse({ type: NodeResponseDto })
  async createGroup(@Body() body: CreateGroupDto): Promise<NodeResponseDto> {
    const node = await this.createGroupUseCase.execute(body);
    return {
      id: node.id,
      type: node.type,
      name: node.name,
    };
  }

  @Post("users/:id/groups")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Link user to group" })
  @ApiBody({ type: LinkUserGroupDto })
  @ApiNoContentResponse()
  async linkUserToGroup(
    @Param() params: IdParamDto,
    @Body() body: LinkUserGroupDto,
  ): Promise<void> {
    await this.linkUserToGroupUseCase.execute({
      userId: params.id,
      groupId: body.groupId,
    });
  }

  @Get("users/:id/organizations")
  @ApiOperation({ summary: "List organizations from user links" })
  @ApiOkResponse({ type: OrganizationRelationDto, isArray: true })
  async getUserOrganizations(
    @Param() params: IdParamDto,
  ): Promise<OrganizationRelationDto[]> {
    return this.getUserOrganizationsUseCase.execute(params.id);
  }

  @Get("nodes/:id/ancestors")
  @ApiOperation({ summary: "List node ancestors" })
  @ApiOkResponse({ type: OrganizationRelationDto, isArray: true })
  async getNodeAncestors(
    @Param() params: IdParamDto,
  ): Promise<OrganizationRelationDto[]> {
    return this.getNodeAncestorsUseCase.execute(params.id);
  }

  @Get("nodes/:id/descendants")
  @ApiOperation({ summary: "List node descendants" })
  @ApiOkResponse({ type: OrganizationRelationDto, isArray: true })
  async getNodeDescendants(
    @Param() params: IdParamDto,
  ): Promise<OrganizationRelationDto[]> {
    return this.getNodeDescendantsUseCase.execute(params.id);
  }
}
