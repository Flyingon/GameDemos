import { GridParams, PieceMeta } from './types'

function clamp(n: number, min: number, max: number): number { return Math.max(min, Math.min(max, n)) }

export function computeGridPiecesMeta(params: GridParams): PieceMeta[] {
  const rows = clamp(Math.floor(params.rows), 1, 200)
  const cols = clamp(Math.floor(params.cols), 1, 200)
  const imgW = params.imageWidth
  const imgH = params.imageHeight
  const boardW = params.boardWidth
  const boardH = params.boardHeight
  const padding = params.padding ?? 0

  const scale = Math.min((boardW - padding * 2) / imgW, (boardH - padding * 2) / imgH)
  const scaledW = imgW * scale
  const scaledH = imgH * scale
  const cellW = imgW / cols
  const cellH = imgH / rows
  const targetCellW = scaledW / cols
  const targetCellH = scaledH / rows

  const originX = (boardW - scaledW) / 2
  const originY = (boardH - scaledH) / 2

  const metas: PieceMeta[] = []
  let id = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rectX = c * cellW
      const rectY = r * cellH
      const targetX = originX + c * targetCellW + targetCellW / 2
      const targetY = originY + r * targetCellH + targetCellH / 2
      metas.push({
        id: id++,
        row: r,
        col: c,
        rect: { x: rectX, y: rectY, width: cellW, height: cellH },
        displayWidth: targetCellW,
        displayHeight: targetCellH,
        targetPos: { x: targetX, y: targetY },
        targetRot: 0,
        isEdge: r === 0 || c === 0 || r === rows - 1 || c === cols - 1,
      })
    }
  }
  return metas
}