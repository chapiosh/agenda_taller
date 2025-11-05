import React from 'react';
import { AppointmentTag, APPOINTMENT_TAGS } from '../types';

interface TagSelectorProps {
  selectedTags: AppointmentTag[];
  onTagToggle: (tag: AppointmentTag) => void;
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

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onTagToggle }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Etiquetas
      </label>
      <div className="flex flex-wrap gap-2">
        {APPOINTMENT_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const colorClasses = TAG_COLORS[tag];

          return (
            <button
              key={tag}
              type="button"
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                isSelected
                  ? `${colorClasses} ring-2 ring-offset-1 ring-opacity-50`
                  : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              }`}
            >
              {isSelected && <span className="mr-1">✓</span>}
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagSelector;
