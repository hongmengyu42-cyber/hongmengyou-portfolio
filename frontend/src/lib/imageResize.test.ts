import { afterEach, describe, expect, it, vi } from 'vitest';
import { fitWithin, prepareImage, type PrepareOptions } from './imageResize';

const photo: PrepareOptions = { maxDimension: 1200, output: 'jpeg' };
const auto: PrepareOptions = { maxDimension: 2000, output: 'auto' };
const jpegFile = (bytes = 100, name = 'IMG_0001.JPG') => new File([new Uint8Array(bytes)], name, { type: 'image/jpeg' });
const pngFile = (bytes = 100, name = 'shot.png') => new File([new Uint8Array(bytes)], name, { type: 'image/png' });

/** Simulates a browser: decodes to the given size, draws on a canvas and encodes to whatever type is asked for. */
function stubBrowser({ width = 4000, height = 3000, encodeAs }: { width?: number; height?: number; encodeAs?: string } = {}) {
  const close = vi.fn();
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width, height, close }));
  const context = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,AAAA');
  const sizes: Array<[number, number]> = [];
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback, type) {
    sizes.push([this.width, this.height]);
    callback(new Blob([new Uint8Array(150_000)], { type: encodeAs ?? type }));
  });
  return { close, context, sizes };
}

afterEach(() => vi.unstubAllGlobals());

describe('fitWithin', () => {
  it('shrinks the longest side to the limit and keeps the proportions', () => {
    expect(fitWithin(4000, 3000, 1200)).toEqual({ width: 1200, height: 900 });
    expect(fitWithin(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 });
  });

  it('never enlarges a small image', () => {
    expect(fitWithin(800, 600, 2000)).toEqual({ width: 800, height: 600 });
  });
});

describe('prepareImage', () => {
  it('turns a large phone photo into a small JPEG within the size limit, and frees the decoded bitmap', async () => {
    const { close, sizes, context } = stubBrowser();
    const result = await prepareImage(jpegFile(12 * 1024 * 1024), photo);

    expect(result.type).toBe('image/jpeg');
    expect(result.name).toBe('IMG_0001.jpg'); // extension matches the new format, which the server checks
    expect(result.size).toBeLessThan(5 * 1024 * 1024);
    expect(sizes).toEqual([[1200, 900]]);
    expect(context.drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('flattens transparency onto white when producing a JPEG', async () => {
    const { context } = stubBrowser({ width: 500, height: 500 });
    await prepareImage(pngFile(2 * 1024 * 1024), photo); // big enough that it is re-encoded rather than left alone
    expect(context.fillStyle).toBe('#ffffff');
    expect(context.fillRect).toHaveBeenCalledWith(0, 0, 500, 500);
  });

  it('re-encodes even a small JPEG, because that strips camera metadata such as GPS location', async () => {
    const { sizes } = stubBrowser({ width: 800, height: 600 });
    const result = await prepareImage(jpegFile(200_000), photo);
    expect(sizes).toEqual([[800, 600]]);
    expect(result).not.toBe(undefined);
    expect(result.type).toBe('image/jpeg');
  });

  it('leaves a small, in-bounds PNG untouched (screenshots stay pixel-perfect)', async () => {
    stubBrowser({ width: 1200, height: 800 });
    const original = pngFile(300_000);
    expect(await prepareImage(original, auto)).toBe(original);
  });

  it('uses WebP for screenshots when the browser can encode it', async () => {
    stubBrowser({ width: 3000, height: 2000 });
    const result = await prepareImage(pngFile(6 * 1024 * 1024), auto);
    expect(result.type).toBe('image/webp');
    expect(result.name).toBe('shot.webp');
  });

  it('falls back to the original file when the browser cannot decode images', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const original = jpegFile(9 * 1024 * 1024);
    expect(await prepareImage(original, photo)).toBe(original);
  });

  it('falls back to the original when decoding fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad image')));
    const original = jpegFile();
    expect(await prepareImage(original, photo)).toBe(original);
  });

  it('falls back to the original when the browser silently encodes a different format', async () => {
    stubBrowser({ encodeAs: 'image/png' }); // e.g. Safari answering a WebP request with a PNG
    const original = jpegFile(8 * 1024 * 1024);
    expect(await prepareImage(original, photo)).toBe(original);
  });
});
