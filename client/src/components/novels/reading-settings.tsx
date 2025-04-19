import { useState, useEffect } from "react";
import { X, IndentDecrease, WholeWord, StretchVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  lineSpacing: number;
  theme: 'dark' | 'light' | 'sepia';
  isFullWidth: boolean;
  isTtsEnabled: boolean;
}

interface ReadingSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ReadingSettings;
  onSettingsChange: (settings: ReadingSettings) => void;
}

const ReadingSettings = ({ 
  open, 
  onOpenChange, 
  settings, 
  onSettingsChange 
}: ReadingSettingsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<ReadingSettings>(settings);
  
  // Reset local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: ReadingSettings) => {
      if (!user) return;
      await apiRequest("PUT", "/api/user-settings", {
        fontSize: settings.fontSize,
        fontFamily: settings.fontFamily,
        lineSpacing: settings.lineSpacing,
        backgroundColor: settings.theme,
      });
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your reading preferences have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleChange = <K extends keyof ReadingSettings>(key: K, value: ReadingSettings[K]) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      onSettingsChange(newSettings);
      return newSettings;
    });
  };
  
  const handleSave = () => {
    if (user) {
      saveSettingsMutation.mutate(localSettings);
    } else {
      // If not logged in, just save to localStorage
      localStorage.setItem('novelverse-reading-settings', JSON.stringify(localSettings));
      toast({
        title: "Settings saved locally",
        description: "Sign in to sync your settings across devices.",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reading Settings</DialogTitle>
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Font Size */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Font Size</Label>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleChange('fontSize', Math.max(12, localSettings.fontSize - 2))}
                disabled={localSettings.fontSize <= 12}
              >
                <IndentDecrease className="h-4 w-4" />
              </Button>
              <div className="flex-1 h-10 flex items-center justify-center bg-muted/50">
                {localSettings.fontSize}px
              </div>
              <Button
                variant="outline" 
                size="icon"
                onClick={() => handleChange('fontSize', Math.min(32, localSettings.fontSize + 2))}
                disabled={localSettings.fontSize >= 32}
              >
                <WholeWord className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Font Family */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Font Family</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={localSettings.fontFamily === 'serif' ? "default" : "outline"}
                onClick={() => handleChange('fontFamily', 'serif')}
                className="font-serif"
              >
                Serif
              </Button>
              <Button
                variant={localSettings.fontFamily === 'sans' ? "default" : "outline"}
                onClick={() => handleChange('fontFamily', 'sans')}
                className="font-sans"
              >
                Sans
              </Button>
              <Button
                variant={localSettings.fontFamily === 'mono' ? "default" : "outline"}
                onClick={() => handleChange('fontFamily', 'mono')}
                className="font-mono"
              >
                Mono
              </Button>
            </div>
          </div>
          
          {/* Theme */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={localSettings.theme === 'dark' ? "default" : "outline"}
                onClick={() => handleChange('theme', 'dark')}
              >
                Dark
              </Button>
              <Button
                variant={localSettings.theme === 'light' ? "default" : "outline"}
                onClick={() => handleChange('theme', 'light')}
              >
                Light
              </Button>
              <Button
                variant={localSettings.theme === 'sepia' ? "default" : "outline"}
                onClick={() => handleChange('theme', 'sepia')}
              >
                Sepia
              </Button>
            </div>
          </div>
          
          {/* Line Spacing */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Line Spacing</Label>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleChange('lineSpacing', Math.max(100, localSettings.lineSpacing - 25))}
                disabled={localSettings.lineSpacing <= 100}
              >
                <StretchVertical className="h-4 w-4" />
              </Button>
              <div className="flex-1 h-10 flex items-center justify-center bg-muted/50">
                {(localSettings.lineSpacing / 100).toFixed(1)}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleChange('lineSpacing', Math.min(250, localSettings.lineSpacing + 25))}
                disabled={localSettings.lineSpacing >= 250}
              >
                <StretchVertical className="h-4 w-4 rotate-180" />
              </Button>
            </div>
          </div>
          
          {/* Other Options */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Other Options</Label>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Full Width</span>
                <Switch
                  checked={localSettings.isFullWidth}
                  onCheckedChange={(checked) => handleChange('isFullWidth', checked)}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Text-to-speech</span>
                <Switch
                  checked={localSettings.isTtsEnabled}
                  onCheckedChange={(checked) => handleChange('isTtsEnabled', checked)}
                />
              </div>
            </div>
          </div>
          
          <Button className="w-full" onClick={handleSave} disabled={saveSettingsMutation.isPending}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingSettings;
