export function arrayRandom<T>(arr: T[]): T {
  return arr ? arr[Math.floor(Math.random() * arr?.length)] : null;
}
