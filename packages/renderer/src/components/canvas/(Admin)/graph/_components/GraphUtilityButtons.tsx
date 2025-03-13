// GRAPH UTILITY TOOLBAR 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/GraphUtilityButtons.tsx

import React from 'react';
import { Button } from '@/components/ui/button';

export interface GraphUtilityButtonsProps {
  onGenerateTestData: () => void;
  onGenerateLinks: () => void;
  onDebugConnections: () => void;
  showPanel: boolean;
  onTogglePanel: () => void;
  onResetGraph: () => void; // Add this prop
}

export const GraphUtilityButtons: React.FC<GraphUtilityButtonsProps> = ({
  onGenerateTestData,
  onGenerateLinks,
  onDebugConnections,
  showPanel,
  onTogglePanel,
  onResetGraph, // Destructure the new prop
}) => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={onTogglePanel}>
        {showPanel ? 'Hide Controls' : 'Show Controls'}
      </Button>
      <Button variant="destructive" size="sm" onClick={onResetGraph}> {/* Add Reset button */}
        Reset Graph
      </Button>
    </div>
  );
};