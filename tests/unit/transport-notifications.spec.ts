import { describe, test, expect } from 'bun:test'
import { estimerMinutes } from '../../src/lib/transport-notifications'

describe('estimerMinutes unit tests', () => {
  test('should return correct minutes for standard values', () => {
    // 25 km at 25 km/h = 60 minutes
    expect(estimerMinutes(25, 25)).toBe(60)

    // 12.5 km at 25 km/h = 30 minutes
    expect(estimerMinutes(12.5, 25)).toBe(30)

    // 10 km at 60 km/h = 10 minutes
    expect(estimerMinutes(10, 60)).toBe(10)
  })

  test('should round to the nearest minute', () => {
    // 2 km at 25 km/h = 4.8 minutes -> 5
    expect(estimerMinutes(2, 25)).toBe(5)

    // 1 km at 25 km/h = 2.4 minutes -> 2
    expect(estimerMinutes(1, 25)).toBe(2)
  })

  test('should use default speed of 25 km/h when not provided', () => {
    // 25 km at default 25 km/h = 60 minutes
    expect(estimerMinutes(25)).toBe(60)
  })

  test('should handle zero or negative speed by defaulting to 25 km/h', () => {
    // 25 km at speed 0 -> should use 25 -> 60 minutes
    expect(estimerMinutes(25, 0)).toBe(60)

    // 25 km at speed -10 -> should use 25 -> 60 minutes
    expect(estimerMinutes(25, -10)).toBe(60)
  })

  test('should return 0 minutes for 0 distance', () => {
    expect(estimerMinutes(0, 25)).toBe(0)
  })
})
