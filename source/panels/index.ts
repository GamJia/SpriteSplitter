import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import plist from 'plist';
import { Editor } from '../utils/editor-exports';

const htmlPath = path.join(__dirname, './index.html');
const cssPath = path.join(__dirname, './index.css');
const logoPath = path.join(__dirname, './logo.png');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

const logoImgTag = `<img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 100%; display: block; margin: 0 auto; padding-bottom:15px;" />`;

export const template = `
  <style>${cssContent}</style>
  ${logoImgTag}
  ${htmlContent}
`;

module.exports = {
  template,
  $: {
    spriteFrame: '#spriteFrame',
    selectSpriteFrame: '#selectSpriteFrame',
    cols: '#colsInput',
    rows: '#rowsInput',
    xSize: '#xInput',
    ySize: '#yInput',
    splitSprite: '#convertButton',
    selectedPath: '#selectedPath',
    statusLog: '#statusLog',
    assetInput: '#assetInput',
    gridMode: '#gridMode',
    cellSizeInputs: '#cellSizeInputs',
    cellCountInputs: '#cellCountInputs',
  },

  async ready() {
    const btnSplit = this.$.splitSprite as HTMLButtonElement;
    const btnSelect = this.$.selectSpriteFrame as HTMLButtonElement;
    const inputCols = this.$.cols as HTMLInputElement;
    const inputRows = this.$.rows as HTMLInputElement;
    const inputX = this.$.xSize as HTMLInputElement;
    const inputY = this.$.ySize as HTMLInputElement;
    const statusLog = this.$.statusLog as HTMLDivElement;
    const selectedPath = this.$.selectedPath as HTMLInputElement;
    const assetInput = this.$.assetInput as any;

    const typeSelect = this.$.gridMode as HTMLSelectElement;
    const cellSizeInputs = this.$.cellSizeInputs as HTMLDivElement;
    const cellCountInputs = this.$.cellCountInputs as HTMLDivElement;

    // Check for DOM elements
    if (!btnSplit || !selectedPath || !statusLog) {
      console.error('[SpriteSplitter] One or more DOM elements are null');
      return;
    }

    typeSelect.addEventListener('change', () => {
      const selectedMode = typeSelect.value;

      if (selectedMode === 'cellSize') {
        cellSizeInputs.style.display = 'flex';
        cellCountInputs.style.display = 'none';
      } else if (selectedMode === 'cellCount') {
        cellSizeInputs.style.display = 'none';
        cellCountInputs.style.display = 'flex';
      }
    });

    assetInput?.addEventListener('change', async (event: any) => {
      const inputElement = event.target;
      const uuid = inputElement?.value;

      if (!uuid) {
        selectedPath.value = 'No texture selected';
        return;
      }

      try {
        const resolvedTexturePath = await Editor.Message.request('asset-db', 'query-path', uuid);
        selectedPath.value = resolvedTexturePath;
        console.log('[SpriteSplitter] Resolved texture path:', resolvedTexturePath);
      } catch (err) {
        console.error('[SpriteSplitter] Error resolving texture path:', err);
        selectedPath.value = 'Error resolving texture path';
      }
    });

     btnSplit.addEventListener('click', async () => {
      const pngPath = selectedPath.value;
      if (!pngPath || !fs.existsSync(pngPath)) {
        return statusLog.textContent = 'Please select a PNG file.';
      }

      statusLog.textContent = 'Processing...';

      try {
        const meta = await sharp(pngPath).metadata();
        const width = meta.width!;
        const height = meta.height!;
        const baseName = path.basename(pngPath, path.extname(pngPath));
        const outputPlist = path.join(path.dirname(pngPath), `${baseName}.plist`);

        let cols = 1, rows = 1, frameWidth = 0, frameHeight = 0;
        if (typeSelect.value === 'cellSize') {
          frameWidth = parseInt(inputX.value);
          frameHeight = parseInt(inputY.value);
          if (!frameWidth || !frameHeight) throw new Error('Pixel size input error');
          cols = Math.floor(width / frameWidth);
          rows = Math.floor(height / frameHeight);
        } else {
          cols = parseInt(inputCols.value);
          rows = parseInt(inputRows.value);
          if (!cols || !rows) throw new Error('Column/row input error');
          frameWidth = Math.floor(width / cols);
          frameHeight = Math.floor(height / rows);
        }

        const frames: { [key: string]: any } = {};
        let index = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = col * frameWidth;
            const y = height - (row + 1) * frameHeight;

            frames[`sprite_${index}`] = {
              frame: `{{${x},${y}},{${frameWidth},${frameHeight}}}`,
              offset: `{0,0}`,
              rotated: false,
              sourceColorRect: `{{0,0},{${frameWidth},${frameHeight}}}`,
              sourceSize: `{${frameWidth},${frameHeight}}`,
            };
            index++;
          }
        }

        const plistData = {
          frames,
          metadata: {
            format: 2,
            size: `{${width},${height}}`,
            textureFileName: path.basename(pngPath),
            realTextureFileName: path.basename(pngPath),
            smartupdate: '$TexturePacker:SmartUpdate:...',
          },
        };

        fs.writeFileSync(outputPlist, plist.build(plistData));
        console.log(`[SpriteSplitter] Complete! Plist saved as: ${outputPlist}`);
        statusLog.textContent = `plist creation complete: ${outputPlist}`;
      } catch (e) {
        console.error('[SpriteSplitter] Error:', e);
        statusLog.textContent = 'Error occurred: Please check the console.';
      }
    });

  },
};