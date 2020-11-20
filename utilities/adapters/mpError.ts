import { Errors, GenericObject } from 'moleculer';

const { MoleculerError } = Errors;

export class MpError extends MoleculerError {
  constructor(
    name: string,
    message: string,
    code: number,
    type?: string,
    data?: GenericObject
  ) {
    super(message, code, type, data);
    this.name = name;
  }
}
