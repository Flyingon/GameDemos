export interface Vec2 {
  x: number
  y: number
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface PieceMeta {
  id: number
  row: number
  col: number
  rect: Rect
  displayWidth: number
  displayHeight: number
  targetPos: Vec2
  targetRot: number
  isEdge: boolean
}

export interface GridParams {
  rows: number
  cols: number
  imageWidth: number
  imageHeight: number
  boardWidth: number
  boardHeight: number
  padding?: number
}

export interface SnapConfig {
  distanceThreshold: number
  angleThreshold: number
}