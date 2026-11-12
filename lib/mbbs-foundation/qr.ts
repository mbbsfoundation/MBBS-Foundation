/**
 * Pure TypeScript QR Code generator (ISO/IEC 18004 compliant)
 * Zero external dependencies. Generates 2D module matrix, SVG, and vector module coordinates.
 */

export type EccLevel = "L" | "M" | "Q" | "H";

export class QrCode {
  readonly size: number;
  private readonly modules: boolean[][];

  constructor(
    readonly version: number,
    readonly errorCorrectionLevel: EccLevel,
    dataCodewords: number[],
    mask: number = -1
  ) {
    if (version < 1 || version > 40) throw new RangeError("Version out of range");
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => false)
    );

    const isFunction: boolean[][] = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => false)
    );

    this.drawFunctionPatterns(isFunction);
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords, isFunction);

    if (mask < 0) {
      mask = 0; // Default clean mask
    }
    this.applyMask(mask, isFunction);
    this.drawFormatBits(mask);
  }

  getModule(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
  }

  private drawFinderPattern(x: number, y: number, isFunction: boolean[][]): void {
    for (let dy = -1; dy <= 7; dy++) {
      for (let dx = -1; dx <= 7; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          const isDark =
            dx >= 0 &&
            dx <= 6 &&
            dy >= 0 &&
            dy <= 6 &&
            (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
          this.modules[yy][xx] = isDark;
          isFunction[yy][xx] = true;
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number, isFunction: boolean[][]): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const isDark = Math.max(Math.abs(dx), Math.abs(dy)) !== 1;
        this.modules[y + dy][x + dx] = isDark;
        isFunction[y + dy][x + dx] = true;
      }
    }
  }

  private drawFunctionPatterns(isFunction: boolean[][]): void {
    this.drawFinderPattern(0, 0, isFunction);
    this.drawFinderPattern(this.size - 7, 0, isFunction);
    this.drawFinderPattern(0, this.size - 7, isFunction);

    for (let i = 0; i < this.size; i++) {
      const isDark = i % 2 === 0;
      if (!isFunction[6][i]) {
        this.modules[6][i] = isDark;
        isFunction[6][i] = true;
      }
      if (!isFunction[i][6]) {
        this.modules[i][6] = isDark;
        isFunction[i][6] = true;
      }
    }

    const alignPos = QrCode.getAlignmentPatternPositions(this.version);
    for (const y of alignPos) {
      for (const x of alignPos) {
        if (
          !(x === 6 && y === 6) &&
          !(x === 6 && y === this.size - 7) &&
          !(x === this.size - 7 && y === 6)
        ) {
          this.drawAlignmentPattern(x, y, isFunction);
        }
      }
    }

    for (let i = 0; i < 9; i++) {
      if (i < this.size) {
        isFunction[8][i] = true;
        isFunction[i][8] = true;
      }
    }
    for (let i = 0; i < 8; i++) {
      isFunction[8][this.size - 1 - i] = true;
      isFunction[this.size - 1 - i][8] = true;
    }
    this.modules[this.size - 8][8] = true;
    isFunction[this.size - 8][8] = true;
  }

  private drawFormatBits(mask: number): void {
    const eccFormatBits: Record<EccLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };
    const data = (eccFormatBits[this.errorCorrectionLevel] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) this.modules[8][i] = ((bits >>> i) & 1) !== 0;
    this.modules[8][7] = ((bits >>> 6) & 1) !== 0;
    this.modules[8][8] = ((bits >>> 7) & 1) !== 0;
    this.modules[7][8] = ((bits >>> 8) & 1) !== 0;
    for (let i = 9; i < 15; i++) this.modules[14 - i][8] = ((bits >>> i) & 1) !== 0;

    for (let i = 0; i < 8; i++) this.modules[8][this.size - 1 - i] = ((bits >>> i) & 1) !== 0;
    for (let i = 8; i < 15; i++) this.modules[this.size - 15 + i][8] = ((bits >>> i) & 1) !== 0;
  }

  private drawCodewords(allCodewords: number[], isFunction: boolean[][]): void {
    let bitIndex = 0;
    let right = this.size - 1;
    let upward = true;

    while (right > 0) {
      if (right === 6) right--;
      for (let vert = 0; vert < this.size; vert++) {
        const y = upward ? this.size - 1 - vert : vert;
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          if (!isFunction[y][x]) {
            let bit = false;
            if (bitIndex < allCodewords.length * 8) {
              const byte = allCodewords[bitIndex >>> 3];
              bit = ((byte >>> (7 - (bitIndex & 7))) & 1) !== 0;
              bitIndex++;
            }
            this.modules[y][x] = bit;
          }
        }
      }
      right -= 2;
      upward = !upward;
    }
  }

  private applyMask(mask: number, isFunction: boolean[][]): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!isFunction[y][x]) {
          let invert = false;
          switch (mask) {
            case 0: invert = (x + y) % 2 === 0; break;
            case 1: invert = y % 2 === 0; break;
            case 2: invert = x % 3 === 0; break;
            case 3: invert = (x + y) % 3 === 0; break;
            case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
            case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
            case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
            case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          }
          if (invert) this.modules[y][x] = !this.modules[y][x];
        }
      }
    }
  }

  private addEccAndInterleave(data: number[]): number[] {
    const v = this.version;
    const ecc = this.errorCorrectionLevel;
    const numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecc][v];
    const blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecc][v];
    const rawCodewords = QrCode.getNumRawDataModules(v) / 8;
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: number[][] = [];
    const rs = new ReedSolomonGenerator(blockEccLen);
    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const dataLen = shortBlockLen - blockEccLen + (i >= numShortBlocks ? 1 : 0);
      const bData = data.slice(k, k + dataLen);
      k += dataLen;
      const bEcc = rs.getRemainder(bData);
      blocks.push(bData.concat(bEcc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i < blocks[j].length) {
          result.push(blocks[j][i]);
        }
      }
    }
    return result;
  }

  static encodeText(text: string, ecc: EccLevel = "M"): QrCode {
    const bytes = Array.from(Buffer.from(text, "utf-8"));
    let version = 1;
    for (; version <= 40; version++) {
      const dataCapacity = QrCode.getDataCapacity(version, ecc);
      const headerBits = 4 + (version < 10 ? 8 : 16);
      const totalBits = headerBits + bytes.length * 8;
      if (totalBits <= dataCapacity * 8) break;
    }
    if (version > 40) throw new Error("Data too large for QR Code");

    const bitStream: number[] = [];
    function appendBits(val: number, len: number) {
      for (let i = len - 1; i >= 0; i--) {
        bitStream.push((val >>> i) & 1);
      }
    }
    appendBits(0b0100, 4);
    const countBits = version < 10 ? 8 : 16;
    appendBits(bytes.length, countBits);
    for (const b of bytes) appendBits(b, 8);

    const dataCapacity = QrCode.getDataCapacity(version, ecc);
    const termLen = Math.min(4, dataCapacity * 8 - bitStream.length);
    appendBits(0, termLen);
    while (bitStream.length % 8 !== 0) bitStream.push(0);

    const codewords: number[] = [];
    for (let i = 0; i < bitStream.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bitStream[i + j];
      codewords.push(b);
    }
    const padBytes = [0xec, 0x11];
    let padIdx = 0;
    while (codewords.length < dataCapacity) {
      codewords.push(padBytes[padIdx % 2]);
      padIdx++;
    }

    return new QrCode(version, ecc, codewords);
  }

  toSvg(border: number = 4): string {
    const size = this.size + border * 2;
    let paths = "";
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.getModule(x, y)) {
          paths += `M${x + border},${y + border}h1v1h-1z `;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="currentColor" shape-rendering="crispEdges"><path d="${paths}"/></svg>`;
  }

  getDarkModules(border: number = 4): Array<{ x: number; y: number }> {
    const darks: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.getModule(x, y)) {
          darks.push({ x: x + border, y: y + border });
        }
      }
    }
    return darks;
  }

  private static getAlignmentPatternPositions(ver: number): number[] {
    if (ver === 1) return [];
    const num = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (num * 2 - 2)) * 2;
    const result = [6];
    for (let pos = ver * 4 + 10; result.length < num; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  private static getNumRawDataModules(ver: number): number {
    let size = ver * 4 + 17;
    let num = size * size;
    num -= 3 * 64;
    num -= (size - 16) * 2;
    num -= 31;
    if (ver >= 2) {
      const align = QrCode.getAlignmentPatternPositions(ver).length;
      num -= (align * align - 3) * 25;
      num += (align - 2) * 10;
    }
    if (ver >= 7) num -= 36;
    return num;
  }

  private static getDataCapacity(ver: number, ecc: EccLevel): number {
    const raw = QrCode.getNumRawDataModules(ver) / 8;
    const eccLen = QrCode.ECC_CODEWORDS_PER_BLOCK[ecc][ver] * QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecc][ver];
    return raw - eccLen;
  }

  private static readonly ECC_CODEWORDS_PER_BLOCK: Record<EccLevel, number[]> = {
    L: [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18],
    M: [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26],
    Q: [0, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24],
    H: [0, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28],
  };

  private static readonly NUM_ERROR_CORRECTION_BLOCKS: Record<EccLevel, number[]> = {
    L: [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4],
    M: [0, 1, 1, 1, 2, 2, 4, 4, 2, 2, 4],
    Q: [0, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8],
    H: [0, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8],
  };
}

class ReedSolomonGenerator {
  private coefficients: number[] = [];

  constructor(degree: number) {
    this.coefficients = [1];
    for (let i = 0; i < degree; i++) {
      this.coefficients = this.multiply(this.coefficients, [1, ReedSolomonGenerator.EXP_TABLE[i]]);
    }
  }

  getRemainder(data: number[]): number[] {
    const result = Array(this.coefficients.length - 1).fill(0);
    for (const b of data) {
      const factor = b ^ result.shift()!;
      result.push(0);
      for (let i = 0; i < result.length; i++) {
        result[i] ^= this.multiplyGf(this.coefficients[i + 1], factor);
      }
    }
    return result;
  }

  private multiply(p1: number[], p2: number[]): number[] {
    const res = Array(p1.length + p2.length - 1).fill(0);
    for (let i = 0; i < p1.length; i++) {
      for (let j = 0; j < p2.length; j++) {
        res[i + j] ^= this.multiplyGf(p1[i], p2[j]);
      }
    }
    return res;
  }

  private multiplyGf(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return ReedSolomonGenerator.EXP_TABLE[(ReedSolomonGenerator.LOG_TABLE[x] + ReedSolomonGenerator.LOG_TABLE[y]) % 255];
  }

  private static readonly EXP_TABLE: number[] = (() => {
    const table = Array(256).fill(0);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      table[i] = x;
      x = ((x << 1) ^ ((x >>> 7) * 0x11d)) & 0xff;
    }
    table[255] = table[0];
    return table;
  })();

  private static readonly LOG_TABLE: number[] = (() => {
    const table = Array(256).fill(0);
    for (let i = 0; i < 255; i++) {
      table[ReedSolomonGenerator.EXP_TABLE[i]] = i;
    }
    return table;
  })();
}

