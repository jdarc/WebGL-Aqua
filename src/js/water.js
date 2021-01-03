const sineBlob = (x, y, radius, scan, blobHeight, source) => {
    const length = 1024.0 / radius * 1024.0 / radius;
    const rad2 = radius * radius;
    let left = -radius;
    let right = radius;
    let top = -radius;
    let bottom = radius;
    if (x - radius < 1) left -= x - radius - 1;
    if (y - radius < 1) top -= y - radius - 1;
    if (x + radius > scan - 1) right -= x + radius - scan + 1;
    if (y + radius > scan - 1) bottom -= y + radius - scan + 1;
    for (let cy = top; cy < bottom; cy++) {
        for (let cx = left; cx < right; cx++) {
            const square = cy * cy + cx * cx;
            if (square < rad2) {
                const dist = Math.sqrt(square * length);
                source[scan * (cy + y) + cx + x] += ~~((Math.cos(dist) + 65535.0) * blobHeight) >> 20;
            }
        }
    }
}

export default class Water {
    constructor(size) {
        this.size = size;
        const buffers = [new Int32Array(size * size), new Int32Array(size * size)];
        let a = 0;

        this.ripple = (x, y, radius, height) => sineBlob(x, y, radius, size, height, buffers[a]);

        this.transfer = (dst) => {
            const src = buffers[1 - a];
            for (let i = 0; i < size * size; ++i) dst[i * 3 + 2] = src[i] * -0.0001;
        }

        this.animate = (delta) => {
            const src = buffers[a];
            const dst = buffers[1 - a];
            for (let i = size + 1, len = size * size - (size + 1); i < len; ++i) {
                const smooth = src[i - 1] +
                    src[i + 1] +
                    src[i - size] +
                    src[i + size] +
                    src[i - size + 1] +
                    src[i - size - 1] +
                    src[i + size + 1] +
                    src[i + size - 1] >> 2;
                dst[i] = smooth - dst[i];
                dst[i] -= (dst[i] >> 5) * delta;
            }
            a = 1 - a;
        };
    }
}
