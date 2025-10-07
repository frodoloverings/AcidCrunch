import { Point, WorkspaceImage } from '../../types';

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';
const HANDLE_SIZE = 20;
const VISUAL_HANDLE_SIZE = 8;

export const isOverRect = (pos: Point, rect: { x: number; y: number; width: number; height: number; }) => {
    return pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height;
}

export const getImageAtPosition = (pos: Point, images: WorkspaceImage[]): WorkspaceImage | null => {
  for (const img of images) {
    if (isOverRect(pos, img)) return img;
  }
  return null;
};

export const getResizeHandles = (image: WorkspaceImage): { corners: Record<'tl' | 'tr' | 'bl' | 'br', Point>; sides: Record<'t' | 'b' | 'l' | 'r', Point> } => ({
  corners: {
      tl: { x: image.x, y: image.y }, tr: { x: image.x + image.width, y: image.y },
      bl: { x: image.x, y: image.y + image.height }, br: { x: image.x + image.width, y: image.y + image.height }
  },
  sides: {
      t: { x: image.x + image.width / 2, y: image.y }, b: { x: image.x + image.width / 2, y: image.y + image.height },
      l: { x: image.x, y: image.y + image.height / 2 }, r: { x: image.x + image.width, y: image.y + image.height / 2 }
  }
});

export const getResizeHandleAtPosition = (pos: Point, image: WorkspaceImage, scale: number, allowSideHandles: boolean): ResizeHandle | null => {
  const handles = getResizeHandles(image);
  const margin = HANDLE_SIZE / scale;

  for (const [key, point] of Object.entries(handles.corners)) {
    if (Math.hypot(pos.x - point.x, pos.y - point.y) < margin) return key as ResizeHandle;
  }
  
  if (allowSideHandles) {
    for (const [key, point] of Object.entries(handles.sides)) {
      if (Math.hypot(pos.x - point.x, pos.y - point.y) < margin) return key as ResizeHandle;
    }
  }

  return null;
};

export const calculateNewResizeAttributes = (
  original: WorkspaceImage, handle: ResizeHandle, pos: Point, scale: number, isProportional: boolean
): { result: { x: number; y: number; width: number; height: number; originalWidth: number; originalHeight: number; } } => {
    const originalAspectRatio = original.originalWidth / original.originalHeight;
    const right = original.x + original.width;
    const bottom = original.y + original.height;
    const minDim = 20 / scale;
    let newRect = { x: original.x, y: original.y, width: original.width, height: original.height };

    if (isProportional) {
        const Cx = original.x + original.width / 2;
        const Cy = original.y + original.height / 2;
        let newWidth, newHeight;
        
        const tempWidth = Math.max(2 * Math.abs(pos.x - Cx), minDim);
        const tempHeight = Math.max(2 * Math.abs(pos.y - Cy), minDim);
        if (tempWidth / tempHeight > originalAspectRatio) {
            newWidth = tempHeight * originalAspectRatio;
            newHeight = tempHeight;
        } else {
            newWidth = tempWidth;
            newHeight = tempWidth / originalAspectRatio;
        }
        
        newRect.x = Cx - newWidth / 2;
        newRect.y = Cy - newHeight / 2;
        newRect.width = newWidth;
        newRect.height = newHeight;
    } else {
        if (['tl', 'tr', 'bl', 'br'].includes(handle)) {
            const anchorX = handle.includes('l') ? right : original.x;
            const anchorY = handle.includes('t') ? bottom : original.y;
            
            const tempWidth = Math.abs(pos.x - anchorX);
            const tempHeight = Math.abs(pos.y - anchorY);
            
            let newWidth, newHeight;
            if (tempWidth / tempHeight > originalAspectRatio) {
                newHeight = tempWidth / originalAspectRatio;
                newWidth = tempWidth;
            } else {
                newWidth = tempHeight * originalAspectRatio;
                newHeight = tempHeight;
            }
            
            newRect.width = Math.max(newWidth, minDim);
            newRect.height = Math.max(newHeight, minDim);
            
            if (handle.includes('l')) {
                newRect.x = anchorX - newRect.width;
            }
            if (handle.includes('t')) {
                newRect.y = anchorY - newRect.height;
            }
        }
    }
    
    const originalPixelDensity = original.originalWidth / original.width;
    const newOriginalWidth = Math.round(newRect.width * originalPixelDensity);
    const newOriginalHeight = Math.round(newRect.height * originalPixelDensity);

    return { result: { ...newRect, originalWidth: newOriginalWidth, originalHeight: newOriginalHeight } };
};

export const calculateNewFreeResizeAttributes = (
  original: WorkspaceImage, handle: ResizeHandle, pos: Point, scale: number, isProportional: boolean
): { result: { x: number; y: number; width: number; height: number; originalWidth: number; originalHeight: number; } } => {
    const originalAspectRatio = original.originalWidth / original.originalHeight;
    const right = original.x + original.width;
    const bottom = original.y + original.height;
    const minDim = 20 / scale;
    let newRect = { x: original.x, y: original.y, width: original.width, height: original.height };
    
    // Symmetrical or proportional resize from center
    if (isProportional) {
        const centerX = original.x + original.width / 2;
        const centerY = original.y + original.height / 2;
        const isSideHandle = ['t', 'b', 'l', 'r'].includes(handle);

        if (isSideHandle) {
            // Symmetrical resize along one axis
            if (handle === 'l' || handle === 'r') {
                const dx = Math.abs(pos.x - centerX);
                newRect.width = Math.max(dx * 2, minDim);
                newRect.x = centerX - newRect.width / 2;
            } else { // 't' or 'b'
                const dy = Math.abs(pos.y - centerY);
                newRect.height = Math.max(dy * 2, minDim);
                newRect.y = centerY - newRect.height / 2;
            }
        } else { // Corner handle: Proportional from center (maintaining aspect ratio)
            const dx = Math.abs(pos.x - centerX);
            const dy = Math.abs(pos.y - centerY);
            
            let newHalfWidth, newHalfHeight;

            if (dx / dy > originalAspectRatio) {
                newHalfWidth = dx;
                newHalfHeight = newHalfWidth / originalAspectRatio;
            } else {
                newHalfHeight = dy;
                newHalfWidth = newHalfHeight * originalAspectRatio;
            }

            newRect.width = Math.max(newHalfWidth * 2, minDim);
            newRect.height = Math.max(newHalfHeight * 2, minDim);
            newRect.x = centerX - newRect.width / 2;
            newRect.y = centerY - newRect.height / 2;
        }
    } else { 
        // Free-form resize from anchor
        let { x: newX, y: newY, width: newW, height: newH } = original;

        if (handle.includes('t')) { newH = bottom - pos.y; newY = pos.y; }
        if (handle.includes('b')) { newH = pos.y - original.y; }
        if (handle.includes('l')) { newW = right - pos.x; newX = pos.x; }
        if (handle.includes('r')) { newW = pos.x - original.x; }

        if (newW < minDim) {
            if (handle.includes('l')) newX = right - minDim;
            newW = minDim;
        }
        if (newH < minDim) {
            if (handle.includes('t')) newY = bottom - minDim;
            newH = minDim;
        }
        newRect = { x: newX, y: newY, width: newW, height: newH };
    }
    
    const originalPixelDensity = original.originalWidth / original.width;
    const newOriginalWidth = Math.round(newRect.width * originalPixelDensity);
    const newOriginalHeight = Math.round(newRect.height * originalPixelDensity);

    return { result: { ...newRect, originalWidth: newOriginalWidth, originalHeight: newOriginalHeight } };
};
