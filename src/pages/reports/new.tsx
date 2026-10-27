import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Card,
  CardContent,
  TextField,
  Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { ReportComponent } from '@/types/report';
import { reportService } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';
import ComponentDialog from '@/components/reports/ComponentDialog';

interface ReportFormData {
  title: string;
  description: string;
  market: string;
  audience: string;
  tone: string;
  user_id: string;
}

const NewReportPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const [report, setReport] = useState<ReportFormData>({
    title: '',
    description: JSON.stringify({
      market: '',
      audience: '',
      tone: ''
    }),
    market: '',
    audience: '',
    tone: '',
    user_id: user?.id || ''
  });
  
  const [components, setComponents] = useState<ReportComponent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<ReportComponent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<ReportComponent | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReport(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a report');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create the report with the user ID
      const reportData = {
        title: report.title,
        description: JSON.stringify({
          market: report.market,
          audience: report.audience,
          tone: report.tone
        }),
        user_id: user.id
      };
      
      const newReport = await reportService.createReport(reportData);
      
      // Create components for the report
      if (components.length > 0) {
        console.log('Creating components with data:', components);
        await Promise.all(
          components.map(component => {
            const componentData = {
              name: component.name,
              type: 'text',
              content: {
                wordLimit: component.wordLimit,
                characterLimit: component.characterLimit,
                gptPrompt: component.gptPrompt,
                isGptEnabled: component.isGptEnabled
              },
              order: components.indexOf(component),
              report_id: newReport.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            console.log('Sending component to create:', {
              ...componentData,
              'isGptEnabled (explicit)': componentData.content.isGptEnabled
            });
            return reportService.createComponent(componentData);
          })
        );
      }
      
      setSuccessMessage('Report created successfully!');
      
      // Redirect to the reports list after a short delay
      setTimeout(() => {
        router.push('/reports');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating report:', err);
      setError('Failed to create report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComponent = () => {
    setEditingComponent(null);
    setIsComponentDialogOpen(true);
  };

  const handleEditComponent = (component: ReportComponent) => {
    setEditingComponent(component);
    setIsComponentDialogOpen(true);
  };

  const handleDeleteClick = (component: ReportComponent) => {
    setComponentToDelete(component);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!componentToDelete) return;
    
    try {
      if (componentToDelete.id) {
        await reportService.deleteComponent(componentToDelete.id);
      }
      
      setComponents(components.filter(c => c !== componentToDelete));
      setSuccessMessage('Component deleted successfully');
    } catch (err) {
      console.error('Error deleting component:', err);
      setError('Failed to delete component. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setComponentToDelete(null);
    }
  };

  const handleSaveComponent = async (component: ReportComponent) => {
    try {
      if (editingComponent) {
        // Update existing component
        const updatedComponent = await reportService.updateComponent(component);
        setComponents(components.map(c => 
          c === editingComponent ? updatedComponent : c
        ));
      } else {
        // Add new component
        const newComponent = await reportService.createComponent(component);
        setComponents([...components, newComponent]);
      }
      
      setIsComponentDialogOpen(false);
      setEditingComponent(null);
    } catch (err) {
      console.error('Error saving component:', err);
      setError('Failed to save component. Please try again.');
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.back()}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Report
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Report Title"
              name="title"
              value={report.title}
              onChange={handleInputChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Market"
              name="market"
              value={report.market}
              onChange={handleInputChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Audience"
              name="audience"
              value={report.audience}
              onChange={handleInputChange}
              required
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tone"
              name="tone"
              value={report.tone}
              onChange={handleInputChange}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h2">
                Components
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddComponent}
              >
                Add Component
              </Button>
            </Box>
            
            {components.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No components added yet. Add your first component to get started.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {components.map((component, index) => (
                  <Grid item xs={12} key={component.id || `temp-${index}`}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {component.name || 'Untitled Component'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {component.type}
                              {component.wordLimit && ` • ${component.wordLimit} words`}
                              {component.characterLimit && ` • ${component.characterLimit} characters`}
                              {component.isGptEnabled && ' • GPT Enabled'}
                            </Typography>
                          </Box>
                          <Box>
                            <IconButton 
                              onClick={() => handleEditComponent(component)}
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDeleteClick(component)}
                              size="small"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={4}>
              <Button
                variant="outlined"
                onClick={() => router.push('/reports')}
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Report'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      <ComponentDialog
        open={isComponentDialogOpen}
        onClose={() => setIsComponentDialogOpen(false)}
        onSave={handleSaveComponent}
        component={editingComponent}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NewReportPage;
