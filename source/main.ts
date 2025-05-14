import { Editor } from "./utils/editor-exports";
const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

export const methods: { [key: string]: (...any: any) => any } = {

    OpenPanel() {
        Editor.Panel.open('spritesplitter.index');
    },

    async SplitByGrid(params: { pngPath: string, cols: number, rows: number }): Promise<any> {
        const { pngPath, cols, rows } = params;

        try {
            const data = fs.readFileSync(pngPath);
            const pngImage = PNG.sync.read(data);
            const { width, height } = pngImage;

            const tileWidth = Math.floor(width / cols);
            const tileHeight = Math.floor(height / rows);
            const imageName = path.basename(pngPath, path.extname(pngPath));
            const outputFolderPath = path.join(path.dirname(pngPath), imageName); // 폴더 이름을 이미지 이름과 동일하게

            console.log(`Output folder: ${outputFolderPath}`);

            if (!fs.existsSync(outputFolderPath)) {
                fs.mkdirSync(outputFolderPath, { recursive: true });
            }

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const startX = x * tileWidth;
                    const startY = y * tileHeight;

                    const tile = new PNG({ width: tileWidth, height: tileHeight });
                    for (let py = 0; py < tileHeight; py++) {
                        for (let px = 0; px < tileWidth; px++) {
                            const originalIndex = ((startY + py) * width + (startX + px)) * 4;
                            const tileIndex = (py * tileWidth + px) * 4;
                            for (let i = 0; i < 4; i++) {
                                tile.data[tileIndex + i] = pngImage.data[originalIndex + i];
                            }
                        }
                    }

                    const tileIndex = y * cols + x;
                    const outputFilePath = path.join(outputFolderPath, `tile_${tileIndex}.png`);
                    fs.writeFileSync(outputFilePath, PNG.sync.write(tile));
                }
            }

            return { success: true, message: 'Image split successfully', outputFolderPath };
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error during PNG split:', error.message);
                return { success: false, message: error.message };
            }
            return { success: false, message: 'An unknown error occurred' };
        }
    },

    async SplitByPixelSize(params: { pngPath: string, x: number, y: number }): Promise<any> {
        const { pngPath, x, y } = params;

        try {
            const data = fs.readFileSync(pngPath);
            const pngImage = PNG.sync.read(data);
            const { width, height } = pngImage;

            const cols = Math.floor(width / x);
            const rows = Math.floor(height / y);
            const imageName = path.basename(pngPath, path.extname(pngPath));
            const outputFolderPath = path.join(path.dirname(pngPath), imageName);

            console.log(`Output folder: ${outputFolderPath}`);

            if (!fs.existsSync(outputFolderPath)) {
                fs.mkdirSync(outputFolderPath, { recursive: true });
            }

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const startX = col * x;
                    const startY = row * y;

                    const tile = new PNG({ width: x, height: y });
                    for (let py = 0; py < y; py++) {
                        for (let px = 0; px < x; px++) {
                            const originalIndex = ((startY + py) * width + (startX + px)) * 4;
                            const tileIndex = (py * x + px) * 4;
                            for (let i = 0; i < 4; i++) {
                                tile.data[tileIndex + i] = pngImage.data[originalIndex + i];
                            }
                        }
                    }

                    const tileIndex = row * cols + col;
                    const outputFilePath = path.join(outputFolderPath, `tile_${tileIndex}.png`);
                    fs.writeFileSync(outputFilePath, PNG.sync.write(tile));
                }
            }

            return { success: true, message: 'Image split successfully by pixel size', outputFolderPath };
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error during PNG split by pixel size:', error.message);
                return { success: false, message: error.message };
            }
            return { success: false, message: 'An unknown error occurred' };
        }
    }
};

export function load() {
    // Extension load hook (if needed)
}

export function unload() {
    // Extension unload hook (if needed)
}
