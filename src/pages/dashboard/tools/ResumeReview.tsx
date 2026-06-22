import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { Layout } from '@components/layout/Layout';
import { useAuthStore } from '@store/index';
import { userService } from '@services/api';

interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
}

export const ResumeReview: React.FC = () => {
  const { user } = useAuthStore();
  const [resumeContent, setResumeContent] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const profile = await userService.getProfile(user.id);
        if (profile?.resumeUrl) {
          setHasResume(true);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const analyzeResume = async () => {
    if (!resumeContent.trim()) {
      await Swal.fire({
        title: 'Paste your resume',
        text: 'Please paste your resume content before analyzing.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate resume analysis
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockAnalysis: ResumeAnalysis = {
        score: Math.floor(Math.random() * 30 + 65),
        strengths: [
          'Clear professional summary',
          'Well-organized work experience',
          'Good use of action verbs',
        ],
        improvements: [
          'Add quantifiable achievements',
          'Include more technical skills',
          'Add metrics and results to projects',
        ],
        suggestions: [
          'Highlight leadership experiences',
          'Include certifications section',
          'Add links to portfolio projects',
        ],
      };

      setAnalysis(mockAnalysis);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!resumeFile) return;

    setLoading(true);
    try {
      // In production, upload to Supabase
      // const formData = new FormData();
      // formData.append('file', resumeFile);
      // await userService.uploadResume(user.id, formData);
      
      setHasResume(true);
      setOpenUpload(false);
      await Swal.fire({
        title: 'Upload successful',
        text: 'Resume uploaded successfully!',
        icon: 'success',
        confirmButtonText: 'OK',
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      await Swal.fire({
        title: 'Upload failed',
        text: 'Failed to upload resume.',
        icon: 'error',
        confirmButtonText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Resume Review
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Get AI-powered feedback on your resume to improve your chances.
          </Typography>
        </Box>

        {!analysis && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                {hasResume ? 'Analyze Your Uploaded Resume' : 'Paste Your Resume Content'}
              </Typography>

              {!hasResume && (
                <>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    placeholder="Paste your resume content here (copy from Word, PDF, or any document)..."
                    value={resumeContent}
                    onChange={(e) => setResumeContent(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={analyzeResume}
                    disabled={loading || !resumeContent.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      fontWeight: 700,
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Resume'}
                  </Button>
                </>
              )}

              {hasResume && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon
                    sx={{ fontSize: 64, color: 'success.main', mb: 2 }}
                  />
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    You have a resume on file. Click below to analyze it.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={analyzeResume}
                    disabled={loading}
                  >
                    {loading ? 'Analyzing...' : 'Analyze My Resume'}
                  </Button>
                </Box>
              )}

              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setOpenUpload(true)}
                sx={{ mt: 2 }}
              >
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(139,195,74,0.1) 100%)',
                  border: '2px solid rgba(76,175,80,0.3)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Resume Score
                    </Typography>
                    <Chip
                      label={`${analysis.score}/100`}
                      color={analysis.score >= 80 ? 'success' : analysis.score >= 65 ? 'warning' : 'error'}
                      sx={{ fontWeight: 700, fontSize: '1rem', p: 2 }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={analysis.score}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(76,175,80,0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        background: 'linear-gradient(90deg, #4CAF50 0%, #45a049 100%)',
                      },
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon sx={{ color: 'success.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Strengths
                    </Typography>
                  </Box>
                  <List>
                    {analysis.strengths.map((strength, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CheckCircleIcon sx={{ color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={strength} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WarningIcon sx={{ color: 'warning.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Areas for Improvement
                    </Typography>
                  </Box>
                  <List>
                    {analysis.improvements.map((improvement, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <ErrorIcon sx={{ color: 'warning.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={improvement} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    💡 Suggestions
                  </Typography>
                  <List>
                    {analysis.suggestions.map((suggestion, idx) => (
                      <ListItem key={idx}>
                        <ListItemIcon>
                          <CheckCircleIcon sx={{ color: 'info.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => setAnalysis(null)}
              >
                Analyze Another Resume
              </Button>
            </Grid>
          </Grid>
        )}

        <Dialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Resume</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                style={{ width: '100%' }}
              />
              <Typography variant="caption" sx={{ mt: 2, display: 'block', color: 'text.secondary' }}>
                Supported formats: PDF, DOC, DOCX
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUpload(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={!resumeFile || loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default ResumeReview;
