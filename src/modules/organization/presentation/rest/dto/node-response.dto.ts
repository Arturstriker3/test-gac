import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class NodeResponseDto {
  @ApiProperty({ example: "f9f7f48e-1491-4de0-87e7-e3fd615f8026" })
  id!: string;

  @ApiProperty({ enum: ["USER", "GROUP"] })
  type!: "USER" | "GROUP";

  @ApiProperty({ example: "Alice" })
  name!: string;

  @ApiPropertyOptional({ example: "alice@example.com", nullable: true })
  email?: string | null;
}
