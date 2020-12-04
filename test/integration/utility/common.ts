import { throws } from 'assert';
export function protectReject(err: any) {
    throws(err.stack);
    expect(err).toBe(true);
}