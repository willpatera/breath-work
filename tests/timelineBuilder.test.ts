import { describe, it, expect } from 'vitest'
import { buildTimeline, totalDuration, ORB_SCALE_MIN, ORB_SCALE_MAX } from '../src/features/player/timelineBuilder'
import type { Practice } from '../src/features/library/practiceTypes'

describe('timelineBuilder', () => {
  describe('flattenSteps', () => {
    it('flattens a simple practice with no repeats', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'instruction', label: 'Settle', text: 'Relax', duration: 5 },
          { type: 'inhale', duration: 4 },
          { type: 'exhale', duration: 4 },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(timeline).toHaveLength(3)
      expect(timeline[0].actionType).toBe('instruction')
      expect(timeline[1].actionType).toBe('inhale')
      expect(timeline[2].actionType).toBe('exhale')
    })

    it('expands repeat blocks', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          {
            type: 'repeat',
            label: 'Cycle',
            rounds: 3,
            sequence: [
              { type: 'inhale', duration: 4 },
              { type: 'exhale', duration: 4 },
            ],
          },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(timeline).toHaveLength(6) // 3 rounds × 2 steps
      expect(timeline[0].roundIndex).toBe(0)
      expect(timeline[0].roundTotal).toBe(3)
      expect(timeline[4].roundIndex).toBe(2)
    })

    it('computes total duration', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'instruction', label: 'Settle', duration: 10 },
          {
            type: 'repeat',
            rounds: 4,
            sequence: [
              { type: 'inhale', duration: 4 },
              { type: 'hold_in', duration: 4 },
              { type: 'exhale', duration: 4 },
              { type: 'hold_out', duration: 4 },
            ],
          },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(totalDuration(timeline)).toBe(10 + 4 * 16)
    })
  })

  describe('next-action preview', () => {
    it('attaches next action type and duration', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'inhale', duration: 4 },
          { type: 'hold_in', duration: 4 },
          { type: 'exhale', duration: 6 },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(timeline[0].nextActionType).toBe('hold_in')
      expect(timeline[0].nextActionDuration).toBe(4)
      expect(timeline[1].nextActionType).toBe('exhale')
      expect(timeline[1].nextActionDuration).toBe(6)
      expect(timeline[2].nextActionType).toBeNull()
      expect(timeline[2].nextActionDuration).toBeNull()
    })
  })

  describe('orb scale logic', () => {
    it('sets correct scales for simple inhale/exhale cycle', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'inhale', duration: 4 },
          { type: 'hold_in', duration: 4 },
          { type: 'exhale', duration: 4 },
          { type: 'hold_out', duration: 4 },
        ],
      }

      const timeline = buildTimeline(practice)

      // Inhale: MIN → MAX
      expect(timeline[0].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN)
      expect(timeline[0].orbScaleEnd).toBeCloseTo(ORB_SCALE_MAX)

      // Hold in: MAX → MAX
      expect(timeline[1].orbScaleStart).toBeCloseTo(ORB_SCALE_MAX)
      expect(timeline[1].orbScaleEnd).toBeCloseTo(ORB_SCALE_MAX)

      // Exhale: MAX → MIN
      expect(timeline[2].orbScaleStart).toBeCloseTo(ORB_SCALE_MAX)
      expect(timeline[2].orbScaleEnd).toBeCloseTo(ORB_SCALE_MIN)

      // Hold out: MIN → MIN
      expect(timeline[3].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN)
      expect(timeline[3].orbScaleEnd).toBeCloseTo(ORB_SCALE_MIN)
    })

    it('subdivides consecutive inhales (stacked breathing)', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'inhale', duration: 4 },
          { type: 'inhale', duration: 4 },
          { type: 'hold_in', duration: 4 },
        ],
      }

      const timeline = buildTimeline(practice)

      // Two equal-duration inhales should split range in half
      const midpoint = ORB_SCALE_MIN + (ORB_SCALE_MAX - ORB_SCALE_MIN) / 2

      // First inhale: MIN → midpoint
      expect(timeline[0].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN)
      expect(timeline[0].orbScaleEnd).toBeCloseTo(midpoint)

      // Second inhale: midpoint → MAX
      expect(timeline[1].orbScaleStart).toBeCloseTo(midpoint)
      expect(timeline[1].orbScaleEnd).toBeCloseTo(ORB_SCALE_MAX)

      // Hold in: MAX
      expect(timeline[2].orbScaleStart).toBeCloseTo(ORB_SCALE_MAX)
      expect(timeline[2].orbScaleEnd).toBeCloseTo(ORB_SCALE_MAX)
    })

    it('subdivides consecutive exhales proportionally', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'exhale', duration: 6 },
          { type: 'exhale', duration: 6 },
          { type: 'hold_out', duration: 4 },
        ],
      }

      const timeline = buildTimeline(practice)
      const midpoint = ORB_SCALE_MAX - (ORB_SCALE_MAX - ORB_SCALE_MIN) / 2

      // First exhale: MAX → midpoint
      expect(timeline[0].orbScaleStart).toBeCloseTo(ORB_SCALE_MAX)
      expect(timeline[0].orbScaleEnd).toBeCloseTo(midpoint)

      // Second exhale: midpoint → MIN
      expect(timeline[1].orbScaleStart).toBeCloseTo(midpoint)
      expect(timeline[1].orbScaleEnd).toBeCloseTo(ORB_SCALE_MIN)

      // Hold out: MIN
      expect(timeline[2].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN)
    })

    it('handles unequal duration stacked inhales', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'inhale', duration: 2 },
          { type: 'inhale', duration: 6 },
          { type: 'hold_in', duration: 4 },
        ],
      }

      const timeline = buildTimeline(practice)
      const range = ORB_SCALE_MAX - ORB_SCALE_MIN

      // First inhale is 2/(2+6) = 0.25 of range
      expect(timeline[0].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN)
      expect(timeline[0].orbScaleEnd).toBeCloseTo(ORB_SCALE_MIN + 0.25 * range)

      // Second inhale is 6/(2+6) = 0.75 of range
      expect(timeline[1].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN + 0.25 * range)
      expect(timeline[1].orbScaleEnd).toBeCloseTo(ORB_SCALE_MAX)
    })

    it('sets instruction steps to min scale', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'instruction', label: 'Rest', duration: 10 },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(timeline[0].orbScaleStart).toBeCloseTo(ORB_SCALE_MIN)
      expect(timeline[0].orbScaleEnd).toBeCloseTo(ORB_SCALE_MIN)
    })
  })

  describe('cues', () => {
    it('preserves countdown cues from practice JSON', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'hold_out', duration: 8, cues: { countdown: [3, 2, 1] } },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(timeline[0].cues).toEqual({ countdown: [3, 2, 1] })
    })

    it('sets cues to null when not specified', () => {
      const practice: Practice = {
        id: 'test',
        title: 'Test',
        author: 'Test',
        description: 'Test',
        steps: [
          { type: 'inhale', duration: 4 },
        ],
      }

      const timeline = buildTimeline(practice)
      expect(timeline[0].cues).toBeNull()
    })
  })

  describe('box breathing full practice', () => {
    it('produces correct timeline for box breathing', () => {
      const practice: Practice = {
        id: 'box-breathing',
        title: 'Box Breathing',
        author: 'Open',
        description: 'Classic 4-4-4-4',
        steps: [
          { type: 'instruction', label: 'Settle in', text: 'Breathe normally', duration: 10 },
          {
            type: 'repeat',
            label: 'Main cycle',
            rounds: 8,
            sequence: [
              { type: 'inhale', duration: 4 },
              { type: 'hold_in', duration: 4 },
              { type: 'exhale', duration: 4 },
              { type: 'hold_out', duration: 4, cues: { countdown: [3, 2, 1] } },
            ],
          },
        ],
      }

      const timeline = buildTimeline(practice)
      // 1 instruction + 8 rounds × 4 steps = 33 steps
      expect(timeline).toHaveLength(33)
      expect(totalDuration(timeline)).toBe(10 + 8 * 16)

      // First step is instruction
      expect(timeline[0].actionType).toBe('instruction')
      expect(timeline[0].roundIndex).toBeNull()

      // Second step is first inhale of round 0
      expect(timeline[1].actionType).toBe('inhale')
      expect(timeline[1].roundIndex).toBe(0)
      expect(timeline[1].roundTotal).toBe(8)

      // Last step (hold_out of round 7) has cues
      expect(timeline[32].actionType).toBe('hold_out')
      expect(timeline[32].roundIndex).toBe(7)
      expect(timeline[32].cues).toEqual({ countdown: [3, 2, 1] })
      expect(timeline[32].nextActionType).toBeNull()
    })
  })
})
