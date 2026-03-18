import { ApiProperty } from "@nestjs/swagger";
import { z } from "zod";

export class CreateUserDto {
  static schema = z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email(),
  });

  @ApiProperty({ example: "Alice" })
  name!: string;

  @ApiProperty({ example: "alice@example.com" })
  email!: string;
}
