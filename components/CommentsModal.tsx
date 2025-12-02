import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getVehicleComments, createVehicleComment, VehicleComment } from '../services/commentsService';

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleName: string;
}

const CommentsModal: React.FC<CommentsModalProps> = ({ isOpen, onClose, vehicleId, vehicleName }) => {
  const [comments, setComments] = useState<VehicleComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && vehicleId) {
      loadComments();
    }
  }, [isOpen, vehicleId]);

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const data = await getVehicleComments(vehicleId);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await createVehicleComment(vehicleId, newComment.trim());
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar el comentario');
    }
  };

  const handleClose = () => {
    setNewComment('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Comentarios - ${vehicleName}`}>
      <div className="space-y-4">
        <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">Cargando comentarios...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No hay comentarios aún</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-800 mb-2">{comment.comment}</p>
                <p className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} className="flex flex-col gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Agregar un nuevo comentario..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Agregar Comentario
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CommentsModal;
