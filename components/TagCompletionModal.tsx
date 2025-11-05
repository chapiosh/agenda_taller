import React, { useState } from 'react';
import { AppointmentTag, APPOINTMENT_TAGS } from '../types';

interface TagCompletionModalProps {
  isOpen: boolean;
  onConfirm: (tag: AppointmentTag) => void;
  onCancel: () => void;
}

const TAG_COLORS: Record<AppointmentTag, string> = {
  'asistió': 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
  'canceló': 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
  'no asistió': 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
  'reprogramó': 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
  'no dejó la unidad': 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
  'llegó sin cita': 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200',
  'llegó tarde': 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200',
};

const TagCompletionModal: React.FC<TagCompletionModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const [selectedTag, setSelectedTag] = useState<AppointmentTag | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedTag) {
      onConfirm(selectedTag);
      setSelectedTag(null);
    }
  };

  const handleCancel = () => {
    setSelectedTag(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Selecciona el estado de la cita
        </h3>
        <p className="text-gray-600 mb-6">
          Por favor, selecciona una etiqueta para completar esta cita:
        </p>

        <div className="flex flex-col gap-2 mb-6">
          {APPOINTMENT_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            const colorClasses = TAG_COLORS[tag];

            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? `${colorClasses} ring-2 ring-offset-2 ring-opacity-50`
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {isSelected && <span className="mr-2">✓</span>}
                {tag}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTag}
            className="flex-1 px-4 py-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagCompletionModal;
