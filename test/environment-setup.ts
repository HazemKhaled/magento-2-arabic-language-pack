import { GenericObject } from 'moleculer';
import dotenv from 'dotenv';

dotenv.config({ path: './docker/development/.env' });

// Use random ports during tests
const env = process.env as GenericObject;
env.PORT = 0;

jest.setTimeout(3000);
