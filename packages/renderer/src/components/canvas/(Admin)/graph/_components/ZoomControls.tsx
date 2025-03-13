// ZOOM CONTROLS 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/ZoomControls.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col bg-white rounded-md shadow-md">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onZoomIn}
        className="p-2 hover:bg-slate-100 rounded-t-md"
      >
        <ZoomIn className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onZoomOut}
        className="p-2 hover:bg-slate-100"
      >
        <ZoomOut className="h-5 w-5" />
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onReset}
        className="p-2 hover:bg-slate-100 rounded-b-md"
      >
        <Maximize2 className="h-5 w-5" />
      </Button>
    </div>
  );
};