import { Request, Response, NextFunction } from 'express';
import { Context } from 'moleculer';

interface MoleculerRequest extends Request {
  $ctx: Context;
}

export { NextFunction, Response, MoleculerRequest };
