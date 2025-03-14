// GRAPH UTILITY TOOLBAR 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/GraphUtilityButtons.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export interface GraphUtilityButtonsProps {
  showPanel: boolean;
  onTogglePanel: () => void;
  onRefreshGraph?: () => void; // Optional to maintain backward compatibility
}

export const GraphUtilityButtons: React.FC<GraphUtilityButtonsProps> = ({
  showPanel,
  onTogglePanel,
  onRefreshGraph,
}) => {
  return (
    <div className="flex gap-2">
      {onRefreshGraph && (
        <Button variant="outline" size="sm" onClick={onRefreshGraph}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}
      <Button variant="outline" size="sm" onClick={onTogglePanel}>
        {showPanel ? 'Hide Controls' : 'Show Controls'}
      </Button>
    </div>
  );
};