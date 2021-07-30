import { hasAnyOwnProperty, hasOwnProperty } from '@mp-server/common'
import { Changed } from './changed'

export interface Point {
  readonly x: number
  readonly y: number
  readonly z: number
}

export function isPoint(obj: unknown): obj is Point {
  return hasOwnProperty(obj, 'x', 'y', 'z')
}

export function isPartialPoint(obj: unknown): obj is Partial<Point> {
  return hasAnyOwnProperty(obj, 'x', 'y', 'z')
}

export interface PointStatic {
  absTotal(...points: Partial<Point>[]): number
  isChanged(prev: Point, current: Point): Changed<Point>
  add(a: Point, b: Partial<Point>, max?: number): Changed<Point>
  diff(a: Point, b: Partial<Point>): Point
  multiply(a: Point, b: number): Point
  multiply(a: Point, b: Partial<Point>): Point
  hasDiff(a: Point, ...points: Partial<Point>[]): boolean
  total(...points: Partial<Point>[]): number
}

function pointDiff(a: Point, b: Partial<Point>): Changed<Point> {
  return {
    x: a.x - b.x ?? 0,
    y: a.y - b.y ?? 0,
    z: a.z - b.z ?? 0,
    changed: pointHasDiff(a, b),
  }
}

function pointAdd(a: Point, b: Partial<Point>, max?: number): Changed<Point> {
  const uncheckedResult = {
    x: a.x + b.x ?? 0,
    y: a.y + b.y ?? 0,
    z: a.z + b.z ?? 0,
  }
  if (max === undefined) {
    return pointIsChanged(a, uncheckedResult)
  }
  const total = pointAbsTotal(uncheckedResult)
  if (total <= max) {
    return pointIsChanged(a, uncheckedResult)
  }

  const rXRatio = uncheckedResult.x / total
  const rYRatio = uncheckedResult.y / total
  const rZRatio = uncheckedResult.z / total

  return pointIsChanged(a, pointMultiply({
    x: rXRatio,
    y: rYRatio,
    z: rZRatio
  }, max))
}

function pointIsChanged(prev: Point, current: Point): Changed<Point> {
  return Object.assign({ changed: pointHasDiff(prev, current) }, current)
}

function pointComponent(p: Partial<Point> | number, component: keyof Point, fallback: number = 0): number {
  if (isPartialPoint(p)) {
    return p[component] ?? fallback
  }
  return p
}

function pointMultiply(a: Point, b: number): Changed<Point>
function pointMultiply(a: Point, b: Partial<Point>): Changed<Point>
function pointMultiply(a: Point, b: Partial<Point> | number): Changed<Point> {
  return pointIsChanged(a, {
    x: a.x * pointComponent(b, 'x', 1),
    y: a.y * pointComponent(b, 'y', 1),
    z: a.z * pointComponent(b, 'z', 1),
  })
}

function pointTotal(...points: Partial<Point>[]): number {
  return points.reduce((total, p) => total + (p.x ?? 0) + (p.y ?? 0) + (p.z ?? 0), 0)
}

function pointAbsTotal(...points: Partial<Point>[]): number {
  return points.reduce((total, p) => total + Math.abs(p.x ?? 0) + Math.abs(p.y ?? 0) + Math.abs(p.z ?? 0), 0)
}

function pointHasDiff(a: Point, ...points: Partial<Point>[]): boolean {
  return points.some(({ x, y, z }) => {
    return (x !== undefined && x !== a.x) || (y !== undefined && y !== a.y) || (z !== undefined && z !== a.z)
  })
}

export const Point: PointStatic = {
  absTotal: pointAbsTotal,
  total: pointTotal,
  hasDiff: pointHasDiff,
  diff: pointDiff,
  add: pointAdd,
  multiply: pointMultiply,
  isChanged: pointIsChanged,
}

export const INITIAL_POINT: Changed<Point> = Object.freeze({ x: 0, y: 0, z: 0, changed: false })
