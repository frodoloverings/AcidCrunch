import { Tool, AnyLayer, ImageLayer, TextLayer, ArrowLayer, BrushLayer, LassoLayer } from '../../types';

export const drawLayer = (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, layer: AnyLayer, imageCache: Map<string, HTMLImageElement>) => {
    ctx.save();
    if (layer.type === 'image') {
        const imgEl = imageCache.get(layer.src);
        if (imgEl && imgEl.complete) (ctx as CanvasRenderingContext2D).drawImage(imgEl, layer.x, layer.y, layer.width, layer.height);
    } else if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        ctx.font = `${textLayer.fontSize}px ${textLayer.fontFamily}`; ctx.textAlign = textLayer.align; ctx.textBaseline = 'top';
        const lines = textLayer.text.split('\n'); const lineHeight = textLayer.fontSize * 1.2;
        const getXPos = (line: string) => {
            let xPos = textLayer.x;
            if (textLayer.align === 'center') xPos = textLayer.x + textLayer.width / 2;
            else if (textLayer.align === 'right') xPos = textLayer.x + textLayer.width;
            return xPos;
        };
        ctx.strokeStyle = 'black'; ctx.lineWidth = 4; ctx.lineJoin = 'round';
        lines.forEach((line, i) => ctx.strokeText(line, getXPos(line), textLayer.y + i * lineHeight));
        ctx.fillStyle = textLayer.color;
        lines.forEach((line, i) => ctx.fillText(line, getXPos(line), textLayer.y + i * lineHeight));
    } else {
        // Annotation Layers
        ctx.translate(layer.x, layer.y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (layer.type === Tool.Brush) {
            const brushLayer = layer as BrushLayer;
            ctx.strokeStyle = brushLayer.color;
            ctx.lineWidth = brushLayer.size;
            ctx.beginPath();
            if (brushLayer.points.length > 0) {
                ctx.moveTo(brushLayer.points[0].x, brushLayer.points[0].y);
                for (let i = 1; i < brushLayer.points.length; i++) {
                    ctx.lineTo(brushLayer.points[i].x, brushLayer.points[i].y);
                }
            }
            ctx.stroke();
        } else if (layer.type === Tool.Lasso) {
            const lassoLayer = layer as LassoLayer;
            ctx.lineWidth = 2;
            ctx.strokeStyle = lassoLayer.color;
            const colorWithAlpha = lassoLayer.color.startsWith('#') ? `${lassoLayer.color}80` : lassoLayer.color;
            ctx.fillStyle = colorWithAlpha;
            ctx.beginPath();
            if (lassoLayer.points.length > 0) {
                ctx.moveTo(lassoLayer.points[0].x, lassoLayer.points[0].y);
                for (let i = 1; i < lassoLayer.points.length; i++) {
                    ctx.lineTo(lassoLayer.points[i].x, lassoLayer.points[i].y);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (layer.type === Tool.Arrow) {
            const arrowLayer = layer as ArrowLayer;
            const { start, end } = arrowLayer;
            const headlen = Math.max(arrowLayer.size * 1.5, 10);
            const angle = Math.atan2(end.y - start.y, end.x - start.x);

            const draw = () => {
                ctx.beginPath();
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
                ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 7), end.y - headlen * Math.sin(angle - Math.PI / 7));
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 7), end.y - headlen * Math.sin(angle + Math.PI / 7));
                ctx.stroke();
            };
            ctx.strokeStyle = '#000000'; ctx.lineWidth = arrowLayer.size + 4; draw();
            ctx.strokeStyle = arrowLayer.color; ctx.lineWidth = arrowLayer.size; draw();
        }
    }
    ctx.restore();
};
