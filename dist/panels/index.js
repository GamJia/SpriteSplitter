"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.template = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const plist_1 = __importDefault(require("plist"));
const editor_exports_1 = require("../utils/editor-exports");
const htmlPath = path.join(__dirname, './index.html');
const cssPath = path.join(__dirname, './index.css');
const logoPath = path.join(__dirname, './logo.png');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');
const logoImgTag = `<img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 100%; display: block; margin: 0 auto; padding-bottom:15px;" />`;
exports.template = `
  <style>${cssContent}</style>
  ${logoImgTag}
  ${htmlContent}
`;
module.exports = {
    template: exports.template,
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
        const btnSplit = this.$.splitSprite;
        const btnSelect = this.$.selectSpriteFrame;
        const inputCols = this.$.cols;
        const inputRows = this.$.rows;
        const inputX = this.$.xSize;
        const inputY = this.$.ySize;
        const statusLog = this.$.statusLog;
        const selectedPath = this.$.selectedPath;
        const assetInput = this.$.assetInput;
        const typeSelect = this.$.gridMode;
        const cellSizeInputs = this.$.cellSizeInputs;
        const cellCountInputs = this.$.cellCountInputs;
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
            }
            else if (selectedMode === 'cellCount') {
                cellSizeInputs.style.display = 'none';
                cellCountInputs.style.display = 'flex';
            }
        });
        assetInput === null || assetInput === void 0 ? void 0 : assetInput.addEventListener('change', async (event) => {
            const inputElement = event.target;
            const uuid = inputElement === null || inputElement === void 0 ? void 0 : inputElement.value;
            if (!uuid) {
                selectedPath.value = 'No texture selected';
                return;
            }
            try {
                const resolvedTexturePath = await editor_exports_1.Editor.Message.request('asset-db', 'query-path', uuid);
                selectedPath.value = resolvedTexturePath;
                console.log('[SpriteSplitter] Resolved texture path:', resolvedTexturePath);
            }
            catch (err) {
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
                const meta = await (0, sharp_1.default)(pngPath).metadata();
                const width = meta.width;
                const height = meta.height;
                const baseName = path.basename(pngPath, path.extname(pngPath));
                const outputPlist = path.join(path.dirname(pngPath), `${baseName}.plist`);
                let cols = 1, rows = 1, frameWidth = 0, frameHeight = 0;
                if (typeSelect.value === 'cellSize') {
                    frameWidth = parseInt(inputX.value);
                    frameHeight = parseInt(inputY.value);
                    if (!frameWidth || !frameHeight)
                        throw new Error('Pixel size input error');
                    cols = Math.floor(width / frameWidth);
                    rows = Math.floor(height / frameHeight);
                }
                else {
                    cols = parseInt(inputCols.value);
                    rows = parseInt(inputRows.value);
                    if (!cols || !rows)
                        throw new Error('Column/row input error');
                    frameWidth = Math.floor(width / cols);
                    frameHeight = Math.floor(height / rows);
                }
                const frames = {};
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
                fs.writeFileSync(outputPlist, plist_1.default.build(plistData));
                console.log(`[SpriteSplitter] Complete! Plist saved as: ${outputPlist}`);
                statusLog.textContent = `plist creation complete: ${outputPlist}`;
            }
            catch (e) {
                console.error('[SpriteSplitter] Error:', e);
                statusLog.textContent = 'Error occurred: Please check the console.';
            }
        });
    },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zb3VyY2UvcGFuZWxzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdUNBQXlCO0FBQ3pCLDJDQUE2QjtBQUM3QixrREFBMEI7QUFDMUIsa0RBQTBCO0FBQzFCLDREQUFpRDtBQUVqRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUN0RCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNwRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUVwRCxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN0RCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNwRCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdDLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFakQsTUFBTSxVQUFVLEdBQUcsbUNBQW1DLFVBQVUsMkZBQTJGLENBQUM7QUFFL0ksUUFBQSxRQUFRLEdBQUc7V0FDYixVQUFVO0lBQ2pCLFVBQVU7SUFDVixXQUFXO0NBQ2QsQ0FBQztBQUVGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixRQUFRLEVBQVIsZ0JBQVE7SUFDUixDQUFDLEVBQUU7UUFDRCxXQUFXLEVBQUUsY0FBYztRQUMzQixpQkFBaUIsRUFBRSxvQkFBb0I7UUFDdkMsSUFBSSxFQUFFLFlBQVk7UUFDbEIsSUFBSSxFQUFFLFlB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TCxDQUFDO0NBQ0YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcclxuaW1wb3J0IHBsaXN0IGZyb20gJ3BsaXN0JztcclxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSAnLi4vdXRpbHMvZWRpdG9yLWV4cG9ydHMnO1xyXG5cclxuY29uc3QgaHRtbFBhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi9pbmRleC5odG1sJyk7XHJcbmNvbnN0IGNzc1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi9pbmRleC5jc3MnKTtcclxuY29uc3QgbG9nb1BhdGggPSBwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi9sb2dvLnBuZycpO1xyXG5cclxuY29uc3QgaHRtbENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoaHRtbFBhdGgsICd1dGY4Jyk7XHJcbmNvbnN0IGNzc0NvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoY3NzUGF0aCwgJ3V0ZjgnKTtcclxuY29uc3QgbG9nb0J1ZmZlciA9IGZzLnJlYWRGaWxlU3luYyhsb2dvUGF0aCk7XHJcbmNvbnN0IGxvZ29CYXNlNjQgPSBsb2dvQnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKTtcclxuXHJcbmNvbnN0IGxvZ29JbWdUYWcgPSBgPGltZyBzcmM9XCJkYXRhOmltYWdlL3BuZztiYXNlNjQsJHtsb2dvQmFzZTY0fVwiIGFsdD1cIkxvZ29cIiBzdHlsZT1cIndpZHRoOiAxMDAlOyBkaXNwbGF5OiBibG9jazsgbWFyZ2luOiAwIGF1dG87IHBhZGRpbmctYm90dG9tOjE1cHg7XCIgLz5gO1xyXG5cclxuZXhwb3J0IGNvbnN0IHRlbXBsYXRlID0gYFxyXG4gIDxzdHlsZT4ke2Nzc0NvbnRlbnR9PC9zdHlsZT5cclxuICAke2xvZ29JbWdUYWd9XHJcbiAgJHtodG1sQ29udGVudH1cclxuYDtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIHRlbXBsYXRlLFxyXG4gICQ6IHtcclxuICAgIHNwcml0ZUZyYW1lOiAnI3Nwcml0ZUZyYW1lJyxcclxuICAgIHNlbGVjdFNwcml0ZUZyYW1lOiAnI3NlbGVjdFNwcml0ZUZyYW1lJyxcclxuICAgIGNvbHM6ICcjY29sc0lucHV0JyxcclxuICAgIHJvd3M6ICcjcm93c0lucHV0JyxcclxuICAgIHhTaXplOiAnI3hJbnB1dCcsXHJcbiAgICB5U2l6ZTogJyN5SW5wdXQnLFxyXG4gICAgc3BsaXRTcHJpdGU6ICcjY29udmVydEJ1dHRvbicsXHJcbiAgICBzZWxlY3RlZFBhdGg6ICcjc2VsZWN0ZWRQYXRoJyxcclxuICAgIHN0YXR1c0xvZzogJyNzdGF0dXNMb2cnLFxyXG4gICAgYXNzZXRJbnB1dDogJyNhc3NldElucHV0JyxcclxuICAgIGdyaWRNb2RlOiAnI2dyaWRNb2RlJyxcclxuICAgIGNlbGxTaXplSW5wdXRzOiAnI2NlbGxTaXplSW5wdXRzJyxcclxuICAgIGNlbGxDb3VudElucHV0czogJyNjZWxsQ291bnRJbnB1dHMnLFxyXG4gIH0sXHJcblxyXG4gIGFzeW5jIHJlYWR5KCkge1xyXG4gICAgY29uc3QgYnRuU3BsaXQgPSB0aGlzLiQuc3BsaXRTcHJpdGUgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgICBjb25zdCBidG5TZWxlY3QgPSB0aGlzLiQuc2VsZWN0U3ByaXRlRnJhbWUgYXMgSFRNTEJ1dHRvbkVsZW1lbnQ7XHJcbiAgICBjb25zdCBpbnB1dENvbHMgPSB0aGlzLiQuY29scyBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgY29uc3QgaW5wdXRSb3dzID0gdGhpcy4kLnJvd3MgYXMgSFRNTElucHV0RWxlbWVudDtcclxuICAgIGNvbnN0IGlucHV0WCA9IHRoaXMuJC54U2l6ZSBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgY29uc3QgaW5wdXRZID0gdGhpcy4kLnlTaXplIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XHJcbiAgICBjb25zdCBzdGF0dXNMb2cgPSB0aGlzLiQuc3RhdHVzTG9nIGFzIEhUTUxEaXZFbGVtZW50O1xyXG4gICAgY29uc3Qgc2VsZWN0ZWRQYXRoID0gdGhpcy4kLnNlbGVjdGVkUGF0aCBhcyBIVE1MSW5wdXRFbGVtZW50O1xyXG4gICAgY29uc3QgYXNzZXRJbnB1dCA9IHRoaXMuJC5hc3NldElucHV0IGFzIGFueTtcclxuXHJcbiAgICBjb25zdCB0eXBlU2VsZWN0ID0gdGhpcy4kLmdyaWRNb2RlIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xyXG4gICAgY29uc3QgY2VsbFNpemVJbnB1dHMgPSB0aGlzLiQuY2VsbFNpemVJbnB1dHMgYXMgSFRNTERpdkVsZW1lbnQ7XHJcbiAgICBjb25zdCBjZWxsQ291bnRJbnB1dHMgPSB0aGlzLiQuY2VsbENvdW50SW5wdXRzIGFzIEhUTUxEaXZFbGVtZW50O1xyXG5cclxuICAgIC8vIENoZWNrIGZvciBET00gZWxlbWVudHNcclxuICAgIGlmICghYnRuU3BsaXQgfHwgIXNlbGVjdGVkUGF0aCB8fCAhc3RhdHVzTG9nKSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTcHJpdGVTcGxpdHRlcl0gT25lIG9yIG1vcmUgRE9NIGVsZW1lbnRzIGFyZSBudWxsJyk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB0eXBlU2VsZWN0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsICgpID0+IHtcclxuICAgICAgY29uc3Qgc2VsZWN0ZWRNb2RlID0gdHlwZVNlbGVjdC52YWx1ZTtcclxuXHJcbiAgICAgIGlmIChzZWxlY3RlZE1vZGUgPT09ICdjZWxsU2l6ZScpIHtcclxuICAgICAgICBjZWxsU2l6ZUlucHV0cy5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xyXG4gICAgICAgIGNlbGxDb3VudElucHV0cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICB9IGVsc2UgaWYgKHNlbGVjdGVkTW9kZSA9PT0gJ2NlbGxDb3VudCcpIHtcclxuICAgICAgICBjZWxsU2l6ZUlucHV0cy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIGNlbGxDb3VudElucHV0cy5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBhc3NldElucHV0Py5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xyXG4gICAgICBjb25zdCBpbnB1dEVsZW1lbnQgPSBldmVudC50YXJnZXQ7XHJcbiAgICAgIGNvbnN0IHV1aWQgPSBpbnB1dEVsZW1lbnQ/LnZhbHVlO1xyXG5cclxuICAgICAgaWYgKCF1dWlkKSB7XHJcbiAgICAgICAgc2VsZWN0ZWRQYXRoLnZhbHVlID0gJ05vIHRleHR1cmUgc2VsZWN0ZWQnO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNvbHZlZFRleHR1cmVQYXRoID0gYXdhaXQgRWRpdG9yLk1lc3NhZ2UucmVxdWVzdCgnYXNzZXQtZGInLCAncXVlcnktcGF0aCcsIHV1aWQpO1xyXG4gICAgICAgIHNlbGVjdGVkUGF0aC52YWx1ZSA9IHJlc29sdmVkVGV4dHVyZVBhdGg7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1tTcHJpdGVTcGxpdHRlcl0gUmVzb2x2ZWQgdGV4dHVyZSBwYXRoOicsIHJlc29sdmVkVGV4dHVyZVBhdGgpO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdbU3ByaXRlU3BsaXR0ZXJdIEVycm9yIHJlc29sdmluZyB0ZXh0dXJlIHBhdGg6JywgZXJyKTtcclxuICAgICAgICBzZWxlY3RlZFBhdGgudmFsdWUgPSAnRXJyb3IgcmVzb2x2aW5nIHRleHR1cmUgcGF0aCc7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICBidG5TcGxpdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGFzeW5jICgpID0+IHtcclxuICAgICAgY29uc3QgcG5nUGF0aCA9IHNlbGVjdGVkUGF0aC52YWx1ZTtcclxuICAgICAgaWYgKCFwbmdQYXRoIHx8ICFmcy5leGlzdHNTeW5jKHBuZ1BhdGgpKSB7XHJcbiAgICAgICAgcmV0dXJuIHN0YXR1c0xvZy50ZXh0Q29udGVudCA9ICdQbGVhc2Ugc2VsZWN0IGEgUE5HIGZpbGUuJztcclxuICAgICAgfVxyXG5cclxuICAgICAgc3RhdHVzTG9nLnRleHRDb250ZW50ID0gJ1Byb2Nlc3NpbmcuLi4nO1xyXG5cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBtZXRhID0gYXdhaXQgc2hhcnAocG5nUGF0aCkubWV0YWRhdGEoKTtcclxuICAgICAgICBjb25zdCB3aWR0aCA9IG1ldGEud2lkdGghO1xyXG4gICAgICAgIGNvbnN0IGhlaWdodCA9IG1ldGEuaGVpZ2h0ITtcclxuICAgICAgICBjb25zdCBiYXNlTmFtZSA9IHBhdGguYmFzZW5hbWUocG5nUGF0aCwgcGF0aC5leHRuYW1lKHBuZ1BhdGgpKTtcclxuICAgICAgICBjb25zdCBvdXRwdXRQbGlzdCA9IHBhdGguam9pbihwYXRoLmRpcm5hbWUocG5nUGF0aCksIGAke2Jhc2VOYW1lfS5wbGlzdGApO1xyXG5cclxuICAgICAgICBsZXQgY29scyA9IDEsIHJvd3MgPSAxLCBmcmFtZVdpZHRoID0gMCwgZnJhbWVIZWlnaHQgPSAwO1xyXG4gICAgICAgIGlmICh0eXBlU2VsZWN0LnZhbHVlID09PSAnY2VsbFNpemUnKSB7XHJcbiAgICAgICAgICBmcmFtZVdpZHRoID0gcGFyc2VJbnQoaW5wdXRYLnZhbHVlKTtcclxuICAgICAgICAgIGZyYW1lSGVpZ2h0ID0gcGFyc2VJbnQoaW5wdXRZLnZhbHVlKTtcclxuICAgICAgICAgIGlmICghZnJhbWVXaWR0aCB8fCAhZnJhbWVIZWlnaHQpIHRocm93IG5ldyBFcnJvcignUGl4ZWwgc2l6ZSBpbnB1dCBlcnJvcicpO1xyXG4gICAgICAgICAgY29scyA9IE1hdGguZmxvb3Iod2lkdGggLyBmcmFtZVdpZHRoKTtcclxuICAgICAgICAgIHJvd3MgPSBNYXRoLmZsb29yKGhlaWdodCAvIGZyYW1lSGVpZ2h0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgY29scyA9IHBhcnNlSW50KGlucHV0Q29scy52YWx1ZSk7XHJcbiAgICAgICAgICByb3dzID0gcGFyc2VJbnQoaW5wdXRSb3dzLnZhbHVlKTtcclxuICAgICAgICAgIGlmICghY29scyB8fCAhcm93cykgdGhyb3cgbmV3IEVycm9yKCdDb2x1bW4vcm93IGlucHV0IGVycm9yJyk7XHJcbiAgICAgICAgICBmcmFtZVdpZHRoID0gTWF0aC5mbG9vcih3aWR0aCAvIGNvbHMpO1xyXG4gICAgICAgICAgZnJhbWVIZWlnaHQgPSBNYXRoLmZsb29yKGhlaWdodCAvIHJvd3MpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgZnJhbWVzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge307XHJcbiAgICAgICAgbGV0IGluZGV4ID0gMDtcclxuICAgICAgICBmb3IgKGxldCByb3cgPSAwOyByb3cgPCByb3dzOyByb3crKykge1xyXG4gICAgICAgICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgY29sczsgY29sKyspIHtcclxuICAgICAgICAgICAgY29uc3QgeCA9IGNvbCAqIGZyYW1lV2lkdGg7XHJcbiAgICAgICAgICAgIGNvbnN0IHkgPSBoZWlnaHQgLSAocm93ICsgMSkgKiBmcmFtZUhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIGZyYW1lc1tgc3ByaXRlXyR7aW5kZXh9YF0gPSB7XHJcbiAgICAgICAgICAgICAgZnJhbWU6IGB7eyR7eH0sJHt5fX0seyR7ZnJhbWVXaWR0aH0sJHtmcmFtZUhlaWdodH19fWAsXHJcbiAgICAgICAgICAgICAgb2Zmc2V0OiBgezAsMH1gLFxyXG4gICAgICAgICAgICAgIHJvdGF0ZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIHNvdXJjZUNvbG9yUmVjdDogYHt7MCwwfSx7JHtmcmFtZVdpZHRofSwke2ZyYW1lSGVpZ2h0fX19YCxcclxuICAgICAgICAgICAgICBzb3VyY2VTaXplOiBgeyR7ZnJhbWVXaWR0aH0sJHtmcmFtZUhlaWdodH19YCxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgaW5kZXgrKztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHBsaXN0RGF0YSA9IHtcclxuICAgICAgICAgIGZyYW1lcyxcclxuICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgIGZvcm1hdDogMixcclxuICAgICAgICAgICAgc2l6ZTogYHske3dpZHRofSwke2hlaWdodH19YCxcclxuICAgICAgICAgICAgdGV4dHVyZUZpbGVOYW1lOiBwYXRoLmJhc2VuYW1lKHBuZ1BhdGgpLFxyXG4gICAgICAgICAgICByZWFsVGV4dHVyZUZpbGVOYW1lOiBwYXRoLmJhc2VuYW1lKHBuZ1BhdGgpLFxyXG4gICAgICAgICAgICBzbWFydHVwZGF0ZTogJyRUZXh0dXJlUGFja2VyOlNtYXJ0VXBkYXRlOi4uLicsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZzLndyaXRlRmlsZVN5bmMob3V0cHV0UGxpc3QsIHBsaXN0LmJ1aWxkKHBsaXN0RGF0YSkpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGBbU3ByaXRlU3BsaXR0ZXJdIENvbXBsZXRlISBQbGlzdCBzYXZlZCBhczogJHtvdXRwdXRQbGlzdH1gKTtcclxuICAgICAgICBzdGF0dXNMb2cudGV4dENvbnRlbnQgPSBgcGxpc3QgY3JlYXRpb24gY29tcGxldGU6ICR7b3V0cHV0UGxpc3R9YDtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tTcHJpdGVTcGxpdHRlcl0gRXJyb3I6JywgZSk7XHJcbiAgICAgICAgc3RhdHVzTG9nLnRleHRDb250ZW50ID0gJ0Vycm9yIG9jY3VycmVkOiBQbGVhc2UgY2hlY2sgdGhlIGNvbnNvbGUuJztcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gIH0sXHJcbn07Il19