import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { z } from "zod";

type ZodSchemaCarrier = {
  schema?: z.ZodTypeAny;
};

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const metatype = metadata.metatype as ZodSchemaCarrier | undefined;

    if (!metatype?.schema) {
      return value;
    }

    const parsedValue = metatype.schema.safeParse(value);

    if (!parsedValue.success) {
      throw new BadRequestException({
        statusCode: 400,
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: parsedValue.error.flatten(),
      });
    }

    return parsedValue.data;
  }
}
