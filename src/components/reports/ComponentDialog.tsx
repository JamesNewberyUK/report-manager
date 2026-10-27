import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { ReportComponent } from '../../types/report';
import { v4 as uuidv4 } from 'uuid';

interface ComponentDialogProps {
  open: boolean;
  onClose: () => void;
  component: ReportComponent | null;
  onSave: (component: ReportComponent) => void;
}

const ComponentDialog = ({ open, onClose, component, onSave }: ComponentDialogProps) => {
  const [formData, setFormData] = useState<Omit<ReportComponent, 'id'>>({
    name: '',
    wordLimit: undefined,
    characterLimit: undefined,
    gptPrompt: '',
    isGptEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a temporary ID for new components
  const tempId = `temp-${uuidv4()}`;

  useEffect(() => {
    if (component) {
      setFormData({
        name: component.name || '',
        wordLimit: component.wordLimit,
        characterLimit: component.characterLimit,
        gptPrompt: component.gptPrompt || '',
        isGptEnabled: component.isGptEnabled || false,
      });
    } else {
      setFormData({
        name: '',
        wordLimit: undefined,
        characterLimit: undefined,
        gptPrompt: '',
        isGptEnabled: true,
      });
    }
  }, [component, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLimitTypeChange = (e: SelectChangeEvent<string>) => {
    const limitType = e.target.value;
    setFormData(prev => ({
      ...prev,
      wordLimit: limitType === 'word' ? 100 : undefined,
      characterLimit: limitType === 'character' ? 500 : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Component name is required');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const componentToSave: ReportComponent = {
        ...formData,
        id: component?.id || tempId,
      };
      
      onSave(componentToSave);
      onClose();
    } catch (err) {
      console.error('Error saving component:', err);
      setError('Failed to save component. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const limitType = formData.wordLimit !== undefined ? 'word' : 
                  formData.characterLimit !== undefined ? 'character' : 'none';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{component ? 'Edit Component' : 'Add New Component'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                name="name"
                label="Component Name"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="limit-type-label">Limit Type</InputLabel>
                <Select
                  labelId="limit-type-label"
                  id="limit-type"
                  value={limitType}
                  label="Limit Type"
                  onChange={handleLimitTypeChange}
                >
                  <MenuItem value="none">No Limit</MenuItem>
                  <MenuItem value="word">Word Limit</MenuItem>
                  <MenuItem value="character">Character Limit</MenuItem>
                </Select>
              </FormControl>
              
              {limitType === 'word' && (
                <TextField
                  margin="normal"
                  name="wordLimit"
                  label="Word Limit"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.wordLimit || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    wordLimit: parseInt(e.target.value) || undefined,
                  }))}
                  inputProps={{ min: 1 }}
                />
              )}
              
              {limitType === 'character' && (
                <TextField
                  margin="normal"
                  name="characterLimit"
                  label="Character Limit"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.characterLimit || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    characterLimit: parseInt(e.target.value) || undefined,
                  }))}
                  inputProps={{ min: 1 }}
                />
              )}
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isGptEnabled"
                    checked={formData.isGptEnabled}
                    onChange={handleInputChange}
                  />
                }
                label="Enable GPT Prompt"
              />
              
              {formData.isGptEnabled && (
                <TextField
                  margin="normal"
                  name="gptPrompt"
                  label="Content Prompt"
                  type="text"
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={formData.gptPrompt}
                  onChange={handleInputChange}
                  placeholder="Enter the instructions for this component..."
                  required
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Save
          </Button>
        </DialogActions>
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </form>
    </Dialog>
  );
};

export default ComponentDialog;
