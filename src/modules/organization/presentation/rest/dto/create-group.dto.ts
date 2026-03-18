import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";

export class CreateGroupDto {
  static schema = z.object({
    name: z.string().trim().min(1),
    parentId: z.string().uuid().optional(),
  });

  @ApiProperty({ example: "Engineering" })
  name!: string;

  @ApiPropertyOptional({
    example: "f9f7f48e-1491-4de0-87e7-e3fd615f8026",
  })
  parentId?: string;
}
