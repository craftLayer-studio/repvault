/** Current time in epoch ms. One seam, so pages read the clock outside component render rules. */
export const currentTime = (): number => Date.now();
