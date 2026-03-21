"use client";

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { IngredientResponseRule } from '@/types/scenarioModel';

interface Props {
  rule: IngredientResponseRule;
}

export default function CurveEditor({ rule }: Props) {
  const data = useMemo(() => {
    const points = [];
    const minX = Math.max(0, rule.baselineX - 10);
    const maxX = rule.saturationEnd + 10;
    
    for (let x = minX; x <= maxX; x += 1) {
      const deltaKg = x - rule.baselineX;
      let y = 0;
      
      if (deltaKg > 0) {
        const saturationSpan = rule.saturationStart - rule.baselineX;
        let effDelta = deltaKg;
        if (deltaKg > saturationSpan) {
           effDelta = saturationSpan + ((deltaKg - saturationSpan) * rule.diminishingReturnFactor);
        }
        
        y = effDelta * (rule.maxMilkDelta / 10);
      } else {
        y = deltaKg * (rule.maxMilkDelta / 10) * rule.deficiencyPenaltyFactor;
      }
      
      points.push({
        x: x,
        y: Number(y.toFixed(2)),
      });
    }
    return points;
  }, [rule]);

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={['dataMin', 'dataMax']} 
            label={{ value: rule.xUnit, position: 'insideBottom', offset: -15, fill: '#6B7280', fontSize: 13 }} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis 
            label={{ value: rule.yUnit, angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 13 }} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: any) => [`${value} ${rule.yUnit}`, 'Отдача молока (дельта)']}
            labelFormatter={(label) => `Доза: ${label} ${rule.xUnit}`}
            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
          />
          
          <ReferenceLine x={rule.baselineX} stroke="#9CA3AF" strokeDasharray="5 5" label={{ position: 'top', value: 'База', fill: '#6B7280', fontSize: 12 }} />
          <ReferenceLine x={rule.saturationStart} stroke="#F59E0B" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: 'Снижение отдачи', fill: '#D97706', fontSize: 12 }} />
          <ReferenceLine x={rule.saturationEnd} stroke="#EF4444" strokeDasharray="5 5" label={{ position: 'insideTopRight', value: 'Потолок', fill: '#DC2626', fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#9CA3AF" />
          
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="#2563EB" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: '#2563EB', stroke: '#EFF6FF', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
