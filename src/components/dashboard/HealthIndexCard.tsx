'use client'

import React from 'react'

interface HealthIndexProps {
  score: number;
}

export function HealthIndexCard({ score = 0 }: HealthIndexProps) {
  // Garante que o score seja um número válido entre 0 e 100
  const validScore = isNaN(score) ? 0 : Math.min(Math.max(score, 0), 100);

  const getTheme = (s: number) => {
    if (s >= 80) return { text: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Excelente' };
    if (s >= 50) return { text: 'text-amber-500', bg: 'bg-amber-500', label: 'Atenção' };
    return { text: 'text-rose-500', bg: 'bg-rose-500', label: 'Crítico' };
  };

  const theme = getTheme(validScore);

  return (
    <div className="bg-white p-6 rounded-[16px] border border-[#E5E5E7] shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-slate-500 font-semibold text-sm">Saúde da Escola</h3>
          <p className={`text-3xl font-bold ${theme.text}`}>{validScore}%</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-slate-50 ${theme.text}`}>
          {theme.label}
        </span>
      </div>
      
      {/* Container da Barra (Cinza ao fundo) */}
      <div className="w-full h-3 bg-slate-100 rounded-full mt-2 overflow-hidden">
        {/* Parte colorida da Barra */}
        <div 
          className={`h-full ${theme.bg} transition-all duration-1000 ease-out`}
          style={{ width: `${validScore}%` }}
        ></div>
      </div>
      
      <p className="text-[11px] text-slate-400 mt-4 leading-tight">
        Análise de performance SchoolRise baseada em leads e conversões atuais.
      </p>
    </div>
  )
}