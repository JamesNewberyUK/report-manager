import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Divider,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Report, ReportComponent } from '@/types/report';
import { reportService } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';
import ComponentDialog from '@/components/reports/ComponentDialog';

const ReportDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [report, setReport] = useState<Report | null>(null);
  const [components, setComponents] = useState<ReportComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ReportComponent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<ReportComponent | null>(null);

  useEffect(() => {
    if (id && user) {
      loadReport();
    }
  }, [id, user]);

  const loadReport = async () => {
    if (!id || !user) return;
    
    setIsLoading(true);
    try {
      // Load report details
      const reportData = await reportService.getReportById(id as string);
      
      // Transform the data to match our Report type
      const transformedReport: Report = {
        id: reportData.id,
        name: reportData.title,
        market: reportData.description?.split(' | ')[0] || '',
        audience: reportData.description?.split(' | ')[1] || '',
        tone: reportData.description?.split(' | ')[2] || '',
        components: [], // We'll load these separately
        createdAt: reportData.created_at,
        updatedAt: reportData.updated_at,
      };
      
      setReport(transformedReport);
      
      // Load components
      const componentsData = await reportService.getComponents(id as string);
      const transformedComponents = componentsData.map(comp => ({
        id: comp.id,
        name: comp.name,
        type: comp.type,
        content: comp.content,
        order: comp.order,
        // Map content fields to component properties
        wordLimit: comp.content?.wordLimit,
        characterLimit: comp.content?.characterLimit,
        gptPrompt: comp.content?.gptPrompt,
        isGptEnabled: comp.content?.isGptEnabled || false,
      }));
      
      // Sort components by order
      transformedComponents.sort((a, b) => a.order - b.order);
      setComponents(transformedComponents);
      
    } catch (err) {
      console.error('Error loading report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReport = () => {
    setIsEditDialogOpen(true);
  };

  const handleSaveReport = async () => {
    await loadReport(); // Refresh the data
    setIsEditDialogOpen(false);
    setSuccessMessage('Report updated successfully');
  };

  const handleAddComponent = () => {
    setEditingComponent(null);
    setIsComponentDialogOpen(true);
  };

  const handleEditComponent = (component: ReportComponent) => {
    setEditingComponent(component);
    setIsComponentDialogOpen(true);
  };

  const handleSaveComponent = async (component: ReportComponent) => {
    if (!id) return;
    
    try {
      const componentData = {
        name: component.name,
        type: 'text', // or derive from component type
        content: {
          wordLimit: component.wordLimit,
          characterLimit: component.characterLimit,
          gptPrompt: component.gptPrompt,
          isGptEnabled: component.isGptEnabled
        },
        order: components.length, // Add to the end by default
        report_id: id as string
      };
      
      if (component.id.startsWith('temp-')) {
        // New component
        await reportService.createComponent(componentData);
      } else {
        // Update existing component
        await reportService.updateComponent(component.id, componentData);
      }
      
      await loadReport(); // Refresh the data
      setIsComponentDialogOpen(false);
      setSuccessMessage('Component saved successfully');
    } catch (err) {
      console.error('Error saving component:', err);
      setError('Failed to save component. Please try again.');
    }
  };

  const handleDeleteClick = (component: ReportComponent) => {
    setComponentToDelete(component);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!componentToDelete) return;
    
    try {
      await reportService.deleteComponent(componentToDelete.id);
      setComponents(components.filter(c => c.id !== componentToDelete.id));
      setSuccessMessage('Component deleted successfully');
    } catch (err) {
      console.error('Error deleting component:', err);
      setError('Failed to delete component. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setComponentToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Report not found
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => router.push('/reports')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Reports
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/reports')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={handleEditReport}
            sx={{ mr: 1 }}
          >
            Edit Report
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddComponent}
          >
            Add Component
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {report.name}
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" color="textSecondary">Market</Typography>
            <Typography variant="body1">{report.market || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" color="textSecondary">Audience</Typography>
            <Typography variant="body1">{report.audience || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" color="textSecondary">Tone</Typography>
            <Typography variant="body1">{report.tone || 'N/A'}</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Components ({components.length})
          </Typography>
          {components.length === 0 ? (
            <Typography variant="body1" color="textSecondary" sx={{ py: 2 }}>
              No components added yet. Click "Add Component" to get started.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {components.map((component) => (
                <Grid item xs={12} key={component.id}>
                  <Card variant="outlined">
                    <CardHeader
                      title={component.name}
                      action={
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditComponent(component)}
                            aria-label="edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteClick(component)}
                            aria-label="delete"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                    />
                    <CardContent>
                      {component.gptPrompt && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" color="textSecondary">Prompt:</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {component.gptPrompt}
                          </Typography>
                        </Box>
                      )}
                      <Grid container spacing={2}>
                        {component.wordLimit && (
                          <Grid item>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Word Limit:</strong> {component.wordLimit}
                            </Typography>
                          </Grid>
                        )}
                        {component.characterLimit && (
                          <Grid item>
                            <Typography variant="body2" color="textSecondary">
                              <strong>Character Limit:</strong> {component.characterLimit}
                            </Typography>
                          </Grid>
                        )}
                        <Grid item>
                          <Typography variant="body2" color="textSecondary">
                            <strong>GPT Enabled:</strong> {component.isGptEnabled ? 'Yes' : 'No'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Edit Report Dialog */}
      {report && (
        <ReportDialog
          open={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
          }}
          onSave={handleSaveReport}
          report={report}
        />
      )}

      {/* Component Dialog */}
      <ComponentDialog
        open={isComponentDialogOpen}
        onClose={() => {
          setIsComponentDialogOpen(false);
          setEditingComponent(null);
        }}
        component={editingComponent}
        onSave={handleSaveComponent}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Component</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the component "{componentToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
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

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ReportDetailPage;
