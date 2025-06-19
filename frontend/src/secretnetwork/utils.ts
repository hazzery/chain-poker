/**
 * Format a number of uSCRT as SCRT.
 *
 * @param uScrt An integer number of uScrt.
 *
 * @returns A simple string representation of `uScrt` in SCRT.
 */
function uScrtToScrt(uScrt: bigint): string {
  const wholeScrt = uScrt / 1_000_000n;
  const fractionalScrt = uScrt % 1_000_000n;
  const fractionalString = fractionalScrt
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");
  return fractionalString.length > 0
    ? `${wholeScrt}.${fractionalString}`
    : wholeScrt.toString();
}

export { uScrtToScrt };
