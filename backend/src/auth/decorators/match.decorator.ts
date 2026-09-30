import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Valida que o campo anotado é igual a outro campo do mesmo objeto.
 * Uso: @Match('password', { message: 'As senhas não coincidem' })
 */
export function Match(
  relatedPropertyName: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'match',
      target: (object as { constructor: new (...args: unknown[]) => unknown }).constructor,
      propertyName: String(propertyName),
      constraints: [relatedPropertyName],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedField] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[relatedField];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedField] = args.constraints as [string];
          return `${args.property} deve ser igual a ${relatedField}`;
        },
      },
    });
  };
}
