import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Report } from '@/types/report';
import ReportDialog from '@/components/reports/ReportDialog';
import { reportService } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';

const ReportsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
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
          isGptEnabled: false, // Default value for existing components
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

  const handleSaveReport = async (report: Report) => {
    try {
      const isEdit = !!editingReport?.id;
      
      // Save the report data
      if (isEdit) {
        await reportService.updateReport(report.id, {
          title: report.name,
          description: JSON.stringify({
            market: report.market,
            audience: report.audience,
            tone: report.tone,
          }),
        });
        
        // Handle components update if needed
        const currentComponents = await reportService.getComponents(report.id);
        const componentsToDelete = currentComponents.filter(
          c => !report.components.some(comp => comp.id === c.id)
        );
        
        await Promise.all(componentsToDelete.map(c => 
          reportService.deleteComponent(c.id)
        ));
        
        await Promise.all(report.components.map(async (component, index) => {
          const componentData = {
            name: component.name,
            type: 'text',
            is_gpt_enabled: component.isGptEnabled,
            content: {
              wordLimit: component.wordLimit,
              characterLimit: component.characterLimit,
              gptPrompt: component.gptPrompt
            },
            order: index,
            report_id: report.id
          };
          
          if (component.id.startsWith('temp-')) {
            await reportService.createComponent(componentData);
          } else {
            await reportService.updateComponent(component.id, componentData);
          }
        }));
      } else {
        // Create new report
        const newReport = await reportService.createReport({
          title: report.name,
          description: JSON.stringify({
            market: report.market,
            audience: report.audience,
            tone: report.tone,
          }),
          user_id: user?.id || ''
        });
        
        // Create components for the new report
        await Promise.all(report.components.map((component, index) => 
          reportService.createComponent({
            name: component.name,
            type: 'text',
            is_gpt_enabled: component.isGptEnabled,
            content: {
              wordLimit: component.wordLimit,
              characterLimit: component.characterLimit,
              gptPrompt: component.gptPrompt
            },
            order: index,
            report_id: newReport.id
          })
        ));
      }
      
      // Only after all operations are complete, update the UI
      await loadReports();
      setSuccessMessage(
        isEdit 
          ? 'Report updated successfully' 
          : 'Report created successfully'
      );
      setIsDialogOpen(false);
      setEditingReport(null);
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save report. Please try again.');
    }
  };

  const handleViewReport = (reportId: string) => {
    router.push(`/reports/${reportId}`);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Reports
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateReport}
        >
          New Report
        </Button>
      </Box>

      {reports.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No reports found
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            Get started by creating your first report.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateReport}
            sx={{ mt: 2 }}
          >
            Create Report
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {report.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Market:</strong> {report.market || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Audience:</strong> {report.audience || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <strong>Last Updated:</strong> {new Date(report.updatedAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleViewReport(report.id)}
                  >
                    View
                  </Button>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleEditReport(report)}
                      aria-label="edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteClick(report)}
                      aria-label="delete"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <ReportDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingReport(null);
        }}
        onSave={handleSaveReport}
        report={editingReport}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Report</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{reportToDelete?.name}"? This action cannot be undone.
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

export default ReportsPage;
