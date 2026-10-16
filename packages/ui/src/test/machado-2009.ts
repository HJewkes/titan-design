/**
 * Machado, Oliveira and Fernandes (2009), "A Physiologically-based Model for Simulation of Color
 * Vision Deficiency", severity 1.0 table, applied to linear RGB. Pinned here, outside `src/theme`,
 * so `theme/color-checks.ts` stays the only place under `src/theme` that holds the matrices.
 */
export const MACHADO_2009_SEVERITY_1 = {
  deutan: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
  ],
  protan: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
  ],
  tritan: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733, 0.691367, 0.3039,
  ],
} as const
