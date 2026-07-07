// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const BRAND_PRIMARY = getSemanticColors('dark')['brand-primary']

export interface SparklineProps extends ViewProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showDots?: boolean
  referenceLines?: Array<{
    value: number
    color: string
    dashed?: boolean
    label?: string
  }>
  highlightLast?: boolean
  className?: string
}

function normalizeData(
  data: number[],
  height: number,
): number[] {
  if (data.length === 0) return []
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return data.map((v) => height - ((v - min) / range) * height)
}

function normalizeValue(
  value: number,
  data: number[],
  height: number,
): number {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  return height - ((value - min) / range) * height
}

export function Sparkline({
  data,
  width = 80,
  height = 30,
  color,
  showDots = false,
  referenceLines,
  highlightLast = false,
  className,
  ...props
}: SparklineProps) {
  if (data.length === 0) {
    return (
      <View
        style={{ width, height }}
        className={className}
        testID="sparkline-empty"
        accessibilityLabel="Sparkline chart, no data"
        {...props}
      />
    )
  }

  const resolvedColor = color ?? BRAND_PRIMARY
  const normalized = normalizeData(data, height)
  const stepX = data.length > 1 ? width / (data.length - 1) : 0

  const dotSize = 3
  const highlightSize = 6

  return (
    <View
      style={{ width, height, position: 'relative' }}
      className={cn(className)}
      accessibilityRole="image"
      accessibilityLabel={`Sparkline chart with ${data.length} data points`}
      testID="sparkline"
      {...props}
    >
      {referenceLines?.map((line, i) => {
        const y = normalizeValue(line.value, data, height)
        return (
          <View
            key={`ref-${i}`}
            style={[
              {
                position: 'absolute',
                top: y,
                left: 0,
                right: 0,
                opacity: 0.6,
              },
              line.dashed
                ? {
                    height: 0,
                    borderStyle: 'dashed',
                    borderTopWidth: 1,
                    borderTopColor: line.color,
                  }
                : {
                    height: 1,
                    backgroundColor: line.color,
                  },
            ]}
            accessibilityElementsHidden
            testID={`sparkline-reference-${i}`}
          >
            {line.label && (
              <Text
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -10,
                  fontSize: 7,
                  color: line.color,
                  opacity: 1,
                }}
                testID={`sparkline-reference-label-${i}`}
              >
                {line.label}
              </Text>
            )}
          </View>
        )
      })}

      {/* Line segments connecting data points */}
      {normalized.map((y, i) => {
        if (i === 0) return null
        const prevY = normalized[i - 1]
        const x1 = (i - 1) * stepX
        const x2 = i * stepX
        const dx = x2 - x1
        const dy = y - prevY
        const length = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        return (
          <View
            key={`line-${i}`}
            style={{
              position: 'absolute',
              left: x1,
              top: prevY,
              width: length,
              height: 1.5,
              backgroundColor: resolvedColor,
              transformOrigin: '0 0',
              transform: [{ rotate: `${angle}deg` }],
            }}
            accessibilityElementsHidden
            testID={`sparkline-segment-${i}`}
          />
        )
      })}

      {/* Data point dots */}
      {(showDots || highlightLast) &&
        normalized.map((y, i) => {
          const isLast = i === data.length - 1
          const shouldShow = showDots || (highlightLast && isLast)
          if (!shouldShow) return null

          const size = highlightLast && isLast ? highlightSize : dotSize
          return (
            <View
              key={`dot-${i}`}
              style={{
                position: 'absolute',
                left: i * stepX - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: resolvedColor,
              }}
              accessibilityElementsHidden
              testID={`sparkline-dot-${i}`}
            />
          )
        })}
    </View>
  )
}
