
import React from 'react';
import { useFiles } from '@/context/FileContext';
import { Button } from '@/components/Button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Settings, Wand2 } from 'lucide-react';

const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, files, generateStories, isGenerating } = useFiles();
  
  const handleStoryCountChange = (value: number[]) => {
    updateSettings({ storyCount: value[0] });
  };
  
  const handleStoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 15) {
      updateSettings({ storyCount: value });
    }
  };
  
  const handleCriteriaCountChange = (value: number[]) => {
    updateSettings({ criteriaCount: value[0] });
  };
  
  const handleCriteriaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 8) {
      updateSettings({ criteriaCount: value });
    }
  };
  
  return (
    <div className="mt-12 bg-secondary/50 rounded-xl p-6 animate-slide-up border border-border">
      <div className="flex items-center mb-6">
        <Settings size={20} className="mr-2 text-primary" />
        <h2 className="text-xl font-medium">Story Generation Settings</h2>
      </div>
      
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="storyCount" className="text-sm font-medium">
              Number of User Stories
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="storyCountInput"
                type="number"
                min={1}
                max={15}
                value={settings.storyCount}
                onChange={handleStoryInputChange}
                className="w-16 h-8 text-center"
              />
            </div>
          </div>
          <Slider
            id="storyCount"
            min={1}
            max={15}
            step={1}
            value={[settings.storyCount]}
            onValueChange={handleStoryCountChange}
            className="py-2"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label htmlFor="criteriaCount" className="text-sm font-medium">
              Acceptance Criteria per Story
            </label>
            <div className="flex items-center gap-2">
              <Input
                id="criteriaCountInput"
                type="number"
                min={1}
                max={8}
                value={settings.criteriaCount}
                onChange={handleCriteriaInputChange}
                className="w-16 h-8 text-center"
              />
            </div>
          </div>
          <Slider
            id="criteriaCount"
            min={1}
            max={8}
            step={1}
            value={[settings.criteriaCount]}
            onValueChange={handleCriteriaCountChange}
            className="py-2"
          />
        </div>
        
        <div className="pt-4">
          <Button
            onClick={() => generateStories()}
            disabled={files.length === 0 || isGenerating}
            isLoading={isGenerating}
            className="w-full"
            size="lg"
          >
            {!isGenerating && <Wand2 size={16} className="mr-2" />}
            {isGenerating ? 'Generating Stories...' : 'Generate User Stories'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
