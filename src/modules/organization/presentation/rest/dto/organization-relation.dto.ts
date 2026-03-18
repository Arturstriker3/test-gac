import { ApiProperty } from "@nestjs/swagger";

export class OrganizationRelationDto {
  @ApiProperty({ example: "f9f7f48e-1491-4de0-87e7-e3fd615f8026" })
  id!: string;

  @ApiProperty({ example: "Engineering" })
  name!: string;

  @ApiProperty({ example: 0 })
  depth!: number;
}
