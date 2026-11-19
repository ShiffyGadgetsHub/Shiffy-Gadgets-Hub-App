// Heuristics to tell apart the barcodes commonly printed close together on a device box:
// Serial Number, IMEI (15 digits), and eSIM EID (32 digits).

export function isImeiCode(code: string): boolean {
  return /^\d{15}$/.test(code.trim());
}

export function isEidCode(code: string): boolean {
  return /^\d{32}$/.test(code.trim());
}

export function isSerialCode(code: string): boolean {
  const v = code.trim();
  return v.length > 0 && !isImeiCode(v) && !isEidCode(v);
}

export function describeCode(code: string): 'imei' | 'eid' | 'serial' {
  if (isImeiCode(code)) return 'imei';
  if (isEidCode(code)) return 'eid';
  return 'serial';
}
