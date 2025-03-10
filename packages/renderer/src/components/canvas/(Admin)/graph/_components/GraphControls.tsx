// GRAPH CONTROLS 
// /Users/matthewsimon/Documents/Github/solomon-Desktop-App/packages/renderer/src/components/canvas/(Admin)/graph/_components/GraphControls.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import SimulationSettings from your shared types (or define inline if needed)
import { SimulationSettings } from './GraphCanvas';

export interface GraphControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  simulationSettings: SimulationSettings;
  onSimulationSettingsChange: (settings: SimulationSettings) => void;
  uniqueGroups: string[];
}

export const GraphControls: React.FC<GraphControlsProps> = ({
  searchTerm,
  onSearchChange,
  simulationSettings,
  onSimulationSettingsChange,
  uniqueGroups,
}) => {
  return (
    <div className="space-y-4 pt-4">
      {/* Search Input */}
      <div className="space-y-1">
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Group Filter */}
      <div className="space-y-1">
        <Label>Filter by Group</Label>
        <Select
          value={simulationSettings.nodeGroupFilter}
          onValueChange={(value) =>
            onSimulationSettingsChange({ ...simulationSettings, nodeGroupFilter: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            {uniqueGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group === 'all' ? 'All Groups' : group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Similarity Threshold Slider */}
      <div className="space-y-2">
        <Label>Similarity Threshold: {simulationSettings.similarityThreshold.toFixed(2)}</Label>
        <Slider
          value={[simulationSettings.similarityThreshold]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(val) =>
            onSimulationSettingsChange({ ...simulationSettings, similarityThreshold: val[0] })
          }
        />
      </div>

      {/* Link Distance Slider */}
      <div className="space-y-2">
        <Label>Link Distance: {simulationSettings.linkDistance}</Label>
        <Slider
          value={[simulationSettings.linkDistance]}
          min={10}
          max={300}
          step={5}
          onValueChange={(val) =>
            onSimulationSettingsChange({ ...simulationSettings, linkDistance: val[0] })
          }
        />
      </div>

      {/* Force Strength Slider */}
      <div className="space-y-2">
        <Label>Force Strength: {Math.abs(simulationSettings.forceManyBody)}</Label>
        <Slider
          value={[Math.abs(simulationSettings.forceManyBody)]}
          min={10}
          max={1000}
          step={10}
          onValueChange={(val) =>
            onSimulationSettingsChange({ ...simulationSettings, forceManyBody: -val[0] })
          }
        />
      </div>

      {/* Collision Radius Slider */}
      <div className="space-y-2">
        <Label>Collision Radius: {simulationSettings.collisionRadius}</Label>
        <Slider
          value={[simulationSettings.collisionRadius]}
          min={5}
          max={100}
          step={1}
          onValueChange={(val) =>
            onSimulationSettingsChange({ ...simulationSettings, collisionRadius: val[0] })
          }
        />
      </div>

      {/* Show Labels Switch */}
      <div className="flex items-center justify-between">
        <Label htmlFor="showLabels">Show Labels</Label>
        <Switch
          id="showLabels"
          checked={simulationSettings.showLabels}
          onCheckedChange={(checked) =>
            onSimulationSettingsChange({ ...simulationSettings, showLabels: checked })
          }
        />
      </div>
    </div>
  );
};