import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import { Report } from '../types/report';
import ReportDialog from '../components/reports/ReportDialog';
import RunReportDialog from '../components/reports/RunReportDialog';
import { reportService } from '../services/reportService';
import { useAuth } from '../contexts/AuthContext';

const ReportsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [reportToRun, setReportToRun] = useState<Report | null>(null);
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect triggered, user:', user);
    if (user) {
      console.log('User is authenticated, loading reports...');
      loadReports();
    } else {
      console.log('No user found, not loading reports');
    }
  }, [user]);

  const loadReports = async () => {
    console.log('loadReports called');
    if (!user) {
      console.log('No user, returning early');
      return;
    }
    
    console.log('Setting loading to true');
    setIsLoading(true);
    try {
      // Fetch both reports and their components
      const reportsData = await reportService.getReports(user.id);
      console.log('Fetched reports data:', reportsData);
      
      // Transform the data to match our Report type
      const transformedData = await Promise.all(reportsData.map(async (report) => {
        // Try to parse market, audience, and tone from description if it exists
        let market = '';
        let audience = '';
        let tone = '';
        
        if (report.description) {
          try {
            // Try to parse as JSON first
            const desc = JSON.parse(report.description);
            market = desc.market || '';
            audience = desc.audience || '';
            tone = desc.tone || '';
          } catch (e) {
            // If not JSON, try to split by | as fallback
            const parts = report.description.split('|').map(part => part.trim());
            market = parts[0] || '';
            audience = parts[1] || '';
            tone = parts[2] || '';
          }
        }
        
        // Get components for this report
        const components = await reportService.getComponents(report.id);
        
        // Map components to match ReportComponent type
        const mappedComponents = components ? components.map(comp => ({
          id: comp.id,
          name: comp.name,
          isGptEnabled: comp.is_gpt_enabled || false, // Use the value from the database
          // Include other component fields if needed
          ...(comp.content ? { 
            wordLimit: comp.content.wordLimit,
            characterLimit: comp.content.characterLimit,
            gptPrompt: comp.content.gptPrompt
          } : {})
        })) : [];
        
        return {
          id: report.id,
          name: report.title || 'Untitled Report',
          market,
          audience,
          tone,
          components: mappedComponents,
          createdAt: report.created_at,
          updatedAt: report.updated_at || report.created_at,
        };
      }));
      
      console.log('Transformed reports:', transformedData);
      setReports(transformedData);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = () => {
    setEditingReport(null);
    setIsDialogOpen(true);
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleRunClick = (report: Report) => {
    setReportToRun(report);
    setIsRunDialogOpen(true);
  };

  const handleCloseRunDialog = () => {
    setIsRunDialogOpen(false);
    // Reset the reportToRun after a small delay to allow the dialog to close
    setTimeout(() => setReportToRun(null), 100);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    
    try {
      await reportService.deleteReport(reportToDelete.id);
      setReports(reports.filter(r => r.id !== reportToDelete.id));
      setSuccessMessage('Report deleted successfully');
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleReportSave = async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    
    try {
      if (editingReport) {
        // Update existing report
        await reportService.updateReport(editingReport.id, {
          title: report.name,
          description: JSON.stringify({
            market: report.market,
            audience: report.audience,
            tone: report.tone,
          }),
        });
        
        // First, get the current components to identify which ones need to be updated or created
        const currentComponents = await reportService.getComponents(editingReport.id);
        
        // Process all components from the form
        const updatedComponentIds = new Set<string>();
        
        await Promise.all(report.components.map(async (component, index) => {
          const { id, ...componentData } = component;
          const componentUpdate: any = {
            name: componentData.name,
            content: {
              wordLimit: componentData.wordLimit,
              characterLimit: componentData.characterLimit,
              gptPrompt: componentData.gptPrompt || '',
            },
            order: index,
            type: 'text', // Default type
          };
          
          // Add is_gpt_enabled at the root level if it exists
          if (componentData.isGptEnabled !== undefined) {
            componentUpdate.is_gpt_enabled = Boolean(componentData.isGptEnabled);
          }
          
          // Check if this is an existing component (has ID and exists in the database)
          const existingComponent = currentComponents.find(c => c.id === id);
          
          if (existingComponent) {
            // Update existing component
            await reportService.updateComponent(id, componentUpdate);
            updatedComponentIds.add(id);
          } else if (id && !id.startsWith('temp-')) {
            // This is an existing component that wasn't found in the database
            // This shouldn't normally happen, but handle it by updating if it does
            try {
              await reportService.updateComponent(id, componentUpdate);
              updatedComponentIds.add(id);
            } catch (error) {
              // If update fails (e.g., component was deleted), create a new one
              const newComponent = await reportService.createComponent({
                ...componentUpdate,
                report_id: editingReport.id,
              });
              updatedComponentIds.add(newComponent.id);
            }
          } else {
            // Create new component
            const newComponent = await reportService.createComponent({
              ...componentUpdate,
              report_id: editingReport.id,
            });
            updatedComponentIds.add(newComponent.id);
          }
        }));
        
        // Delete any components that were removed from the form and not updated
        const componentsToDelete = currentComponents.filter(
          c => !updatedComponentIds.has(c.id) && !c.id.startsWith('temp-')
        );
        
        if (componentsToDelete.length > 0) {
          await Promise.all(
            componentsToDelete.map(c => reportService.deleteComponent(c.id))
          );
        }
        
        setSuccessMessage('Report updated successfully');
      } else {
        // Create new report
        const newReport = await reportService.createReport({
          title: report.name,
          description: JSON.stringify({
            market: report.market,
            audience: report.audience,
            tone: report.tone,
          }),
          user_id: user.id,
        });
        
        // Create components
        await Promise.all(report.components.map(async (component, index) => {
          const { id, ...componentData } = component;
          await reportService.createComponent({
            report_id: newReport.id,
            name: componentData.name,
            type: 'text', // Default type
            content: {
              wordLimit: componentData.wordLimit,
              characterLimit: componentData.characterLimit,
              gptPrompt: componentData.gptPrompt,
            },
            order: index,
          });
        }));
        
        setSuccessMessage('Report created successfully');
      }
      
      // Refresh the reports list
      await loadReports();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">My Reports</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateReport}
          sx={{
            backgroundColor: '#211838',
            '&:hover': {
              backgroundColor: '#3a2a5f',
            },
          }}
        >
          NEW REPORT
        </Button>
      </Box>
      
      {/* Error and success messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this report? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Report Dialog */}
      <ReportDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleReportSave}
        report={editingReport}
      />
      
      {/* Run Report Dialog */}
      <RunReportDialog
        open={isRunDialogOpen}
        onClose={handleCloseRunDialog}
        report={reportToRun}
      />
      
      {reports.length === 0 ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="300px"
          textAlign="center"
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by creating a new report
          </Typography>
        </Box>
      ) : (
        <Box>
          <Grid container spacing={3}>
            {reports.map((report) => (
              <Grid item xs={12} sm={6} md={4} key={report.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {report.name}
                    </Typography>
                    <Typography color="text.secondary" variant="body2" paragraph>
                      <strong>Market:</strong> {report.market || 'Not specified'}<br />
                      <strong>Audience:</strong> {report.audience || 'Not specified'}<br />
                      <strong>Tone:</strong> {report.tone || 'Not specified'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {new Date(report.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunClick(report);
                      }}
                      variant="outlined"
                      color="primary"
                      sx={{ textTransform: 'none' }}
                    >
                      Run
                    </Button>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditReport(report);
                        }}
                        aria-label="edit report"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(report);
                        }}
                        aria-label="delete report"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ReportsPage;
