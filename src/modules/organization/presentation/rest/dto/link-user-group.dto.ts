import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export class LinkUserGroupDto {
  static schema = z.object({
    groupId: z.string().uuid(),
  });

  @ApiProperty({ example: "f9f7f48e-1491-4de0-87e7-e3fd615f8026" })
  groupId!: string;
}
