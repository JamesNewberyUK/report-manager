import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Edit as EditIcon,
  FileDownload as FileDownloadIcon 
} from '@mui/icons-material';
import { Report, defaultReport, ReportComponent } from '../../types/report';
import { useAuth } from '../../contexts/AuthContext';
import ComponentDialog from './ComponentDialog';

interface ReportComponent {
  id: string;
  name: string;
  isGptEnabled: boolean;
  wordLimit?: number;
  characterLimit?: number;
  gptPrompt?: string;
}

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  report: Report | null;
}

const ReportDialog = ({ open, onClose, onSave, report }: ReportDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Omit<Report, 'id' | 'createdAt' | 'updatedAt'>>({
    ...defaultReport,
    name: '',
    components: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingComponent, setEditingComponent] = useState<ReportComponent | null>(null);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (report) {
        setFormData({
          ...report,
          components: report.components || []
        });
      } else {
        setFormData({
          ...defaultReport,
          name: '',
          components: []
        });
      }
    }
  }, [open, report]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddComponent = () => {
    setEditingComponent({
      id: `temp-${Date.now()}`,
      name: '',
      isGptEnabled: true,
      wordLimit: 500,
      characterLimit: 3000,
      gptPrompt: ''
    });
    setIsComponentDialogOpen(true);
  };

  const handleEditComponent = (component: ReportComponent) => {
    setEditingComponent(component);
    setIsComponentDialogOpen(true);
  };

  const handleDeleteComponent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      components: prev.components?.filter(c => c.id !== id) || []
    }));
  };

  const handleSaveComponent = (component: ReportComponent) => {
    setFormData(prev => {
      const components = [...(prev.components || [])];
      const existingIndex = components.findIndex(c => c.id === component.id);
      
      if (existingIndex >= 0) {
        components[existingIndex] = component;
      } else {
        components.push(component);
      }
      
      return {
        ...prev,
        components
      };
    });
    setIsComponentDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Failed to save report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{report ? 'Edit Report' : 'Create New Report'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Report Name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '1rem',
                      height: '56px',
                    },
                    '& .MuiInputBase-input': {
                      padding: '10.5px 14px',
                      fontWeight: 'bold',
                      fontSize: '1.125rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 'bold',
                      fontSize: '1rem',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Market*"
                  name="market"
                  value={formData.market || ''}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                  multiline
                  minRows={1}
                  maxRows={5}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.875rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    },
                    '& .MuiInputBase-input': {
                      padding: '10.5px 14px',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Audience*"
                  name="audience"
                  value={formData.audience || ''}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                  multiline
                  minRows={1}
                  maxRows={5}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.875rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    },
                    '& .MuiInputBase-input': {
                      padding: '10.5px 14px',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Tone*"
                  name="tone"
                  value={formData.tone || ''}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                  multiline
                  minRows={1}
                  maxRows={5}
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '0.875rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                    },
                    '& .MuiInputBase-input': {
                      padding: '10.5px 14px',
                    },
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h6" component="span" sx={{ mr: 1 }}>Components</Typography>
                    <Typography variant="caption" color="textSecondary" component="span">
                      ({formData.components.length}/10)
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddComponent}
                    size="small"
                    disabled={formData.components.length >= 10}
                  >
                    Add Component
                  </Button>
                </Box>
                
                {formData.components.length === 0 ? (
                  <Box sx={{ 
                    border: '1px dashed', 
                    borderColor: 'divider', 
                    borderRadius: 1, 
                    p: 4, 
                    textAlign: 'center',
                    backgroundColor: 'action.hover',
                    opacity: 0.7
                  }}>
                    <Typography variant="body2" color="textSecondary">
                      No components added yet. Click "Add Component" to get started.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {formData.components.map((component) => (
                      <Paper 
                        key={component.id} 
                        variant="outlined"
                        sx={{ 
                          p: 2, 
                          mb: 1,
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 1
                          }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ pr: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', fontWeight: 500, mb: 0.5 }}>
                              {component.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                {component.wordLimit ? `${component.wordLimit} words` : 'No length'}
                              </Typography>
                              {component.characterLimit && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                  • {component.characterLimit} chars
                                </Typography>
                              )}
                            </Box>
                            {component.gptPrompt && (
                              <Box 
                                sx={{ 
                                  fontSize: '0.75rem',
                                  color: 'text.secondary',
                                  maxHeight: '60px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  wordBreak: 'break-word',
                                  lineHeight: '1.2',
                                  mt: 0.5
                                }}
                              >
                                {component.gptPrompt}
                              </Box>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexShrink: 0 }}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => handleEditComponent(component)}
                                sx={{ '&:hover': { color: 'primary.main' } }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteComponent(component.id)}
                                sx={{ color: 'error.main', '&:hover': { color: 'error.dark' } }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            <Button 
              onClick={onClose} 
              disabled={isLoading}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Tooltip title="Export as HTML">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {}}
                startIcon={<FileDownloadIcon />}
                sx={{ mr: 1 }}
                disabled={isLoading}
              >
                Export
              </Button>
            </Tooltip>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? 'Saving...' : 'Save'}
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
      
      <ComponentDialog
        open={isComponentDialogOpen}
        onClose={() => {
          setIsComponentDialogOpen(false);
          setEditingComponent(null);
        }}
        component={editingComponent}
        onSave={handleSaveComponent}
      />
    </>
  );
};

export default ReportDialog;
