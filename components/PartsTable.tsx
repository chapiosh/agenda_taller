import React, { useState } from 'react';
import { Part, PART_STATUS_LABELS } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';

interface PartsTableProps {
  parts: Part[];
  onAddPart: () => void;
  onEditPart: (part: Part) => void;
  onDeletePart: (partId: string) => void;
}

export function PartsTable({ parts, onAddPart, onEditPart, onDeletePart }: PartsTableProps) {
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '-';
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX');
  };

  const totalPurchase = parts.reduce((sum, part) => sum + (part.purchasePrice || 0), 0);
  const totalSell = parts.reduce((sum, part) => sum + (part.sellPrice || 0), 0);
  const grossProfit = totalSell - totalPurchase;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Refacciones</h3>
        <button
          onClick={onAddPart}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Agregar Refacción
        </button>
      </div>

      {parts.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay refacciones registradas</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Descripción</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">No. OEM</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Proveedor</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Estado</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Costo</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Venta</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Pedida</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Recibida</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-gray-700">Instalada</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm text-gray-900">{part.description}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{part.oemPartNumber || '-'}</td>
                    <td className="py-3 px-2 text-sm text-gray-600">{part.supplier || '-'}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${
                        part.status === 'installed' ? 'bg-green-100 text-green-800' :
                        part.status === 'received' ? 'bg-blue-100 text-blue-800' :
                        part.status === 'in_transit' ? 'bg-yellow-100 text-yellow-800' :
                        part.status === 'ordered' ? 'bg-purple-100 text-purple-800' :
                        part.status === 'quoted' ? 'bg-gray-100 text-gray-800' :
                        part.status === 'returned' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {PART_STATUS_LABELS[part.status]}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-right text-gray-900">{formatCurrency(part.purchasePrice)}</td>
                    <td className="py-3 px-2 text-sm text-right text-gray-900">{formatCurrency(part.sellPrice)}</td>
                    <td className="py-3 px-2 text-sm text-center text-gray-600">{formatDate(part.orderedAt)}</td>
                    <td className="py-3 px-2 text-sm text-center text-gray-600">{formatDate(part.receivedAt)}</td>
                    <td className="py-3 px-2 text-sm text-center text-gray-600">{formatDate(part.installedAt)}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditPart(part)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePart(part.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Costo Total</p>
                <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPurchase)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Venta Total</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSell)}</p>
              </div>
              <div className={`rounded-lg p-4 ${grossProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <p className="text-sm text-gray-600 mb-1">Utilidad Bruta</p>
                <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                  {formatCurrency(grossProfit)}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
