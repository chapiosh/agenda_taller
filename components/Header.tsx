
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-brand-blue shadow-md">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          Taller Mecánico Pro
        </h1>
        <p className="text-sm text-gray-300">Gestión de Citas</p>
      </div>
    </header>
  );
};

export default Header;
